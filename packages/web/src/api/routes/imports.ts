import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { classes, guardians, studentGuardians, students } from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { logStudentHistory, tenantOf } from "./scolarite-helpers";

const rowInput = z.object({
  name: z.string().trim().min(2).max(160),
  className: z.string().trim().min(1).max(80),
  guardianName: z.string().trim().max(120).default(""),
});

async function nextReference(establishmentId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)` })
    .from(students)
    .where(eq(students.establishmentId, establishmentId));
  const year = new Date().getFullYear();
  let sequence = Number(rows[0]?.n ?? 0) + 1;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const reference = `SC-${year}-${String(sequence).padStart(3, "0")}`;
    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(eq(students.reference, reference))
      .limit(1);
    if (!existing.length) return reference;
    sequence += 1;
  }
  return `SC-${year}-${Date.now().toString(36).toUpperCase()}`;
}

export const imports = {
  /** Import d'élèves prévalidé côté serveur. */
  importStudents: authed
    .input(z.object({ rows: z.array(rowInput).min(1).max(500) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, ["direction", "administration"]);
      const establishmentId = tenantOf(context);
      const [classRows, studentRows, guardianRows] = await Promise.all([
        db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
        db.select().from(students).where(eq(students.establishmentId, establishmentId)),
        db.select().from(guardians).where(eq(guardians.establishmentId, establishmentId)),
      ]);
      const classByName = new Map(
        classRows.map((row) => [row.name.trim().toLowerCase(), row]),
      );
      const seen = new Set(
        studentRows.map((row) =>
          `${row.firstName} ${row.lastName}`.trim().toLowerCase(),
        ),
      );
      const guardianIdByName = new Map(
        guardianRows.map((row) => [row.name.trim().toLowerCase(), row.id]),
      );
      const errors: Array<{ row: number; message: string }> = [];
      const imported: Array<{
        id: string;
        name: string;
        reference: string;
        className: string;
      }> = [];

      for (const [index, row] of input.rows.entries()) {
        const line = index + 2;
        const parts = row.name.trim().split(/\s+/);
        if (parts.length < 2) {
          errors.push({
            row: line,
            message: "Nom complet attendu avec au moins un prénom et un nom.",
          });
          continue;
        }
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ");
        const fullName = `${firstName} ${lastName}`;
        const normalized = fullName.toLowerCase();
        if (seen.has(normalized)) {
          errors.push({ row: line, message: "Cet élève existe déjà." });
          continue;
        }
        const classe = classByName.get(row.className.trim().toLowerCase());
        if (!classe) {
          errors.push({
            row: line,
            message: `Classe « ${row.className} » introuvable.`,
          });
          continue;
        }
        const guardianName = row.guardianName.trim();
        if (guardianName && guardianName.length < 2) {
          errors.push({ row: line, message: "Nom du responsable trop court." });
          continue;
        }
        seen.add(normalized);
        const studentId = crypto.randomUUID();
        const reference = await nextReference(establishmentId);
        await db.insert(students).values({
          id: studentId,
          establishmentId,
          firstName,
          lastName,
          reference,
          classId: classe.id,
          status: "Actif",
          enrolledAt: new Date().toISOString().slice(0, 10),
        });
        if (guardianName) {
          let guardianId = guardianIdByName.get(guardianName.toLowerCase());
          if (!guardianId) {
            guardianId = crypto.randomUUID();
            await db.insert(guardians).values({
              id: guardianId,
              establishmentId,
              name: guardianName,
              status: "Actif",
            });
            guardianIdByName.set(guardianName.toLowerCase(), guardianId);
          }
          await db
            .insert(studentGuardians)
            .values({ studentId, guardianId, relation: "Responsable légal" });
        }
        await logStudentHistory(
          establishmentId,
          studentId,
          "Import",
          `Élève importé dans ${classe.name}`,
          context.user.name,
        );
        imported.push({
          id: studentId,
          name: fullName,
          reference,
          className: classe.name,
        });
      }

      if (imported.length) {
        await logAudit({
          establishmentId,
          userId: context.user.id,
          actor: context.user.name,
          action: "Import d’élèves",
          target: `${imported.length} dossier(s)`,
          detail: `${errors.length} ligne(s) rejetée(s)`,
        });
      }
      return { imported, errors };
    }),
};
