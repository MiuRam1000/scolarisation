import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray, like } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  academicYears,
  administrativeDocuments,
  classes,
  establishments,
  guardians,
  studentGuardians,
  students,
} from "../database/schema";
import { authed, requireRole, STAFF_ROLES } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { tenantOf } from "./scolarite-helpers";

const MANAGE_ROLES = ["direction", "administration"] as const;
const KINDS = ["certificate", "enrollment", "class_list"] as const;
type DocumentKind = (typeof KINDS)[number];

const DOCUMENT_LABELS: Record<DocumentKind, { title: string; prefix: string }> = {
  certificate: { title: "Certificat de scolarité", prefix: "CERT" },
  enrollment: { title: "Attestation d'inscription", prefix: "ATT" },
  class_list: { title: "Liste de classe", prefix: "LIST" },
};

const generateInput = z.object({
  kind: z.enum(KINDS),
  studentId: z.string().trim().max(60).default(""),
  classId: z.string().trim().max(60).default(""),
});

const idInput = z.object({ id: z.string().trim().min(1).max(60) });

function activeStudent(status: string) {
  return !["Archivé", "Transféré", "Sorti", "Désinscrit"].includes(status);
}

function academicYearLabel() {
  const now = new Date();
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${start + 1}`;
}

function parseSnapshot(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function familyStudentIds(establishmentId: string, userId: string, role: string) {
  if (role === "student") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.establishmentId, establishmentId), eq(students.userId, userId)));
    return rows.map((row) => row.id);
  }
  const myGuardians = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(and(eq(guardians.establishmentId, establishmentId), eq(guardians.userId, userId)));
  if (!myGuardians.length) return [] as string[];
  const links = await db
    .select({ studentId: studentGuardians.studentId })
    .from(studentGuardians)
    .where(
      inArray(
        studentGuardians.guardianId,
        myGuardians.map((row) => row.id),
      ),
    );
  return [...new Set(links.map((row) => row.studentId))];
}

async function nextReference(
  establishmentId: string,
  kind: DocumentKind,
  year: number,
) {
  const prefix = DOCUMENT_LABELS[kind].prefix;
  const rows = await db
    .select({ reference: administrativeDocuments.reference })
    .from(administrativeDocuments)
    .where(
      and(
        eq(administrativeDocuments.establishmentId, establishmentId),
        like(administrativeDocuments.reference, `${prefix}-${year}-%`),
      ),
    );
  const used = new Set(rows.map((row) => row.reference));
  let sequence = rows.length + 1;
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const reference = `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
    if (!used.has(reference)) return reference;
    sequence += 1;
  }
  return `${prefix}-${year}-${Date.now().toString(36).toUpperCase()}`;
}

export const administrativeDocumentsApi = {
  /** Liste des documents générés, avec instantané imprimable. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...STAFF_ROLES, "parent", "student"]);
    const establishmentId = tenantOf(context);
    const role = context.user.role;
    const rows = await db
      .select()
      .from(administrativeDocuments)
      .where(eq(administrativeDocuments.establishmentId, establishmentId))
      .orderBy(desc(administrativeDocuments.createdAt));
    let visible = rows;
    if (role === "parent" || role === "student") {
      const linkedStudentIds = await familyStudentIds(establishmentId, context.user.id, role);
      visible = rows.filter(
        (row) =>
          row.status === "Validé" &&
          row.kind !== "class_list" &&
          !!row.studentId &&
          linkedStudentIds.includes(row.studentId),
      );
    }
    return {
      documents: visible.map((row) => ({
        id: row.id,
        kind: row.kind,
        reference: row.reference,
        title: row.title,
        recipient: row.recipient,
        status: row.status,
        issuedByName: row.issuedByName,
        issuedAt: row.issuedAt,
        createdAt: row.createdAt,
        snapshot: parseSnapshot(row.snapshot),
      })),
    };
  }),

  /** Génère un document numéroté et fige les données imprimées. */
  generate: authed.input(generateInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);

    const [schoolRows, yearRows] = await Promise.all([
      db
        .select()
        .from(establishments)
        .where(eq(establishments.id, establishmentId))
        .limit(1),
      db
        .select()
        .from(academicYears)
        .where(
          and(
            eq(academicYears.establishmentId, establishmentId),
            eq(academicYears.status, "Active"),
          ),
        )
        .orderBy(asc(academicYears.startsOn))
        .limit(1),
    ]);
    const school = schoolRows[0];
    if (!school) throw new ORPCError("NOT_FOUND", { message: "Établissement introuvable." });
    const schoolYear = yearRows[0]?.label || academicYearLabel();

    let studentSnapshot: Record<string, unknown> | null = null;
    let classSnapshot: Record<string, unknown> | null = null;
    let studentId: string | null = null;
    let classId: string | null = null;
    let recipient = "Administration";

    if (input.kind === "class_list") {
      if (!input.classId) {
        throw new ORPCError("BAD_REQUEST", { message: "Sélectionnez une classe." });
      }
      const classRows = await db
        .select()
        .from(classes)
        .where(
          and(eq(classes.id, input.classId), eq(classes.establishmentId, establishmentId)),
        )
        .limit(1);
      const classe = classRows[0];
      if (!classe) throw new ORPCError("NOT_FOUND", { message: "Classe introuvable." });
      const studentRows = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.establishmentId, establishmentId),
            eq(students.classId, classe.id),
          ),
        )
        .orderBy(asc(students.lastName), asc(students.firstName));
      classId = classe.id;
      recipient = `Administration — ${classe.name}`;
      classSnapshot = {
        name: classe.name,
        level: classe.level,
        room: classe.room,
        mainTeacher: classe.mainTeacher,
        students: studentRows
          .filter((row) => activeStudent(row.status))
          .map((row) => ({
            name: `${row.firstName} ${row.lastName}`,
            reference: row.reference,
            birthDate: row.birthDate,
            status: row.status,
          })),
      };
    } else {
      if (!input.studentId) {
        throw new ORPCError("BAD_REQUEST", { message: "Sélectionnez un élève." });
      }
      const studentRows = await db
        .select()
        .from(students)
        .where(
          and(
            eq(students.id, input.studentId),
            eq(students.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const student = studentRows[0];
      if (!student) throw new ORPCError("NOT_FOUND", { message: "Dossier élève introuvable." });
      const linkedClasses = student.classId
        ? await db
            .select()
            .from(classes)
            .where(
              and(
                eq(classes.id, student.classId),
                eq(classes.establishmentId, establishmentId),
              ),
            )
            .limit(1)
        : [];
      studentId = student.id;
      classId = student.classId;
      recipient = `${student.firstName} ${student.lastName}`;
      studentSnapshot = {
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`,
        reference: student.reference,
        birthDate: student.birthDate,
        sex: student.sex,
        address: student.address,
        enrolledAt: student.enrolledAt,
        schoolYear: student.schoolYear || schoolYear,
        status: student.status,
        className: linkedClasses[0]?.name ?? "",
        level: linkedClasses[0]?.level ?? "",
        mainTeacher: linkedClasses[0]?.mainTeacher ?? "",
      };
    }

    const now = new Date();
    const reference = await nextReference(establishmentId, input.kind, now.getFullYear());
    const id = crypto.randomUUID();
    const snapshot = {
      reference,
      kind: input.kind,
      title: DOCUMENT_LABELS[input.kind].title,
      issuedOn: now.toISOString(),
      schoolYear,
      school: {
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
      },
      student: studentSnapshot,
      class: classSnapshot,
    };
    await db.insert(administrativeDocuments).values({
      id,
      establishmentId,
      kind: input.kind,
      reference,
      title: DOCUMENT_LABELS[input.kind].title,
      studentId,
      classId,
      recipient,
      status: "Brouillon",
      snapshot: JSON.stringify(snapshot),
      issuedByUserId: context.user.id,
      issuedByName: context.user.name,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Génération d'un document administratif",
      target: reference,
      detail: `${DOCUMENT_LABELS[input.kind].title} — ${recipient}`,
    });
    return { id, reference };
  }),

  /** Valide un brouillon : le document devient officiel et imprimable. */
  validate: authed.input(idInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, MANAGE_ROLES);
    const establishmentId = tenantOf(context);
    const rows = await db
      .select()
      .from(administrativeDocuments)
      .where(
        and(
          eq(administrativeDocuments.id, input.id),
          eq(administrativeDocuments.establishmentId, establishmentId),
        ),
      )
      .limit(1);
    const document = rows[0];
    if (!document) {
      throw new ORPCError("NOT_FOUND", { message: "Document introuvable." });
    }
    if (document.status === "Annulé") {
      throw new ORPCError("BAD_REQUEST", { message: "Un document annulé ne peut être validé." });
    }
    if (document.status === "Validé") return { id: document.id, reference: document.reference };
    const issuedAt = new Date().toISOString();
    await db
      .update(administrativeDocuments)
      .set({
        status: "Validé",
        issuedAt,
        issuedByUserId: context.user.id,
        issuedByName: context.user.name,
      })
      .where(eq(administrativeDocuments.id, document.id));
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Validation d'un document administratif",
      target: document.reference,
      detail: document.title,
    });
    return { id: document.id, reference: document.reference };
  }),

  /** Annule un document en conservant la trace et la numérotation. */
  cancel: authed
    .input(z.object({ id: idInput.shape.id, reason: z.string().trim().min(2).max(500) }))
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, MANAGE_ROLES);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(administrativeDocuments)
        .where(
          and(
            eq(administrativeDocuments.id, input.id),
            eq(administrativeDocuments.establishmentId, establishmentId),
          ),
        )
        .limit(1);
      const document = rows[0];
      if (!document) {
        throw new ORPCError("NOT_FOUND", { message: "Document introuvable." });
      }
      if (document.status === "Annulé") return { id: document.id };
      await db
        .update(administrativeDocuments)
        .set({ status: "Annulé" })
        .where(eq(administrativeDocuments.id, document.id));
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Annulation d'un document administratif",
        target: document.reference,
        detail: input.reason,
      });
      return { id: document.id };
    }),

  /** Données d'impression d'un document (personnel, ou famille pour ses documents validés). */
  content: authed.input(idInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...STAFF_ROLES, "parent", "student"]);
    const establishmentId = tenantOf(context);
    const role = context.user.role;
    const rows = await db
      .select()
      .from(administrativeDocuments)
      .where(
        and(
          eq(administrativeDocuments.id, input.id),
          eq(administrativeDocuments.establishmentId, establishmentId),
        ),
      )
      .limit(1);
    const document = rows[0];
    if (!document) throw new ORPCError("NOT_FOUND", { message: "Document introuvable." });
    if (role === "parent" || role === "student") {
      const linkedStudentIds = await familyStudentIds(establishmentId, context.user.id, role);
      const allowed =
        document.status === "Validé" &&
        document.kind !== "class_list" &&
        !!document.studentId &&
        linkedStudentIds.includes(document.studentId);
      if (!allowed) throw new ORPCError("FORBIDDEN", { message: "Accès refusé." });
    }
    return {
      id: document.id,
      kind: document.kind,
      reference: document.reference,
      title: document.title,
      status: document.status,
      issuedAt: document.issuedAt,
      createdAt: document.createdAt,
      snapshot: parseSnapshot(document.snapshot),
    };
  }),

  /** Vérifie l'existence de plusieurs élèves ou classes pour l'interface. */
  targets: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, STAFF_ROLES);
    const establishmentId = tenantOf(context);
    const [studentRows, classRows] = await Promise.all([
      db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          reference: students.reference,
          status: students.status,
          classId: students.classId,
        })
        .from(students)
        .where(eq(students.establishmentId, establishmentId))
        .orderBy(asc(students.lastName), asc(students.firstName)),
      db
        .select({ id: classes.id, name: classes.name })
        .from(classes)
        .where(eq(classes.establishmentId, establishmentId))
        .orderBy(asc(classes.name)),
    ]);
    return {
      students: studentRows.filter((row) => activeStudent(row.status)),
      classes: classRows,
    };
  }),
};
