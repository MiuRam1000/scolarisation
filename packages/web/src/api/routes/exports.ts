import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  attendanceRecords,
  attendanceSessions,
  auditLogs,
  classes,
  disciplineIncidents,
  exams,
  feeInvoices,
  payments,
  students,
} from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { tenantOf } from "./scolarite-helpers";

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(columns: string[], rows: string[][]) {
  // BOM + séparateur point-virgule, cohérent avec les exports côté client.
  return (
    "\uFEFF" +
    [columns, ...rows]
      .map((row) => row.map((cell) => csvCell(cell ?? "")).join(";"))
      .join("\n")
  );
}

/** Exports serveur tracés (§30, §39). */
export const exportsApi = {
  /** Export CSV complet du journal d'audit de l'établissement. */
  audit: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration"]);
    const establishmentId = tenantOf(context);
    const rows = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.establishmentId, establishmentId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(5000);
    const content = toCsv(
      ["Date", "Acteur", "Action", "Cible", "Détail"],
      rows.map((row) => [
        new Date(row.createdAt).toISOString(),
        row.actor,
        row.action,
        row.target,
        row.detail,
      ]),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Journal d'audit",
      detail: `${rows.length} ligne(s)`,
    });
    return { filename: `journal-audit-${Date.now()}`, content, count: rows.length };
  }),

  /** Export CSV des élèves (données personnelles : direction/administration). */
  students: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration"]);
    const establishmentId = tenantOf(context);
    const [studentRows, classRows] = await Promise.all([
      db
        .select()
        .from(students)
        .where(eq(students.establishmentId, establishmentId))
        .orderBy(asc(students.lastName), asc(students.firstName)),
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
    ]);
    const classById = new Map(classRows.map((row) => [row.id, row.name]));
    const content = toCsv(
      [
        "Référence",
        "Nom",
        "Prénom",
        "Classe",
        "Année scolaire",
        "Statut",
        "Date de naissance",
        "Sexe",
        "Date d'inscription",
      ],
      studentRows.map((row) => [
        row.reference,
        row.lastName,
        row.firstName,
        row.classId ? classById.get(row.classId) ?? "" : "",
        row.schoolYear,
        row.status,
        row.birthDate,
        row.sex,
        row.enrolledAt,
      ]),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Élèves",
      detail: `${studentRows.length} ligne(s)`,
    });
    return { filename: `eleves-${Date.now()}`, content, count: studentRows.length };
  }),

  /** Export CSV des paiements/reçus (direction/administration/comptabilité). */
  financePayments: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration", "accountant"]);
    const establishmentId = tenantOf(context);
    const [paymentRows, studentRows, classRows, invoiceRows] = await Promise.all([
      db
        .select()
        .from(payments)
        .where(eq(payments.establishmentId, establishmentId))
        .orderBy(desc(payments.paidAt), desc(payments.createdAt)),
      db.select().from(students).where(eq(students.establishmentId, establishmentId)),
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
      db.select().from(feeInvoices).where(eq(feeInvoices.establishmentId, establishmentId)),
    ]);
    const studentById = new Map(studentRows.map((row) => [row.id, row]));
    const classById = new Map(classRows.map((row) => [row.id, row.name]));
    const invoiceById = new Map(invoiceRows.map((row) => [row.id, row]));
    const content = toCsv(
      [
        "Reçu",
        "Date",
        "Élève",
        "Classe",
        "Frais",
        "Montant (centimes)",
        "Mode",
        "Référence",
        "Statut",
        "Encaissé par",
      ],
      paymentRows.map((row) => {
        const student = studentById.get(row.studentId);
        const invoice = invoiceById.get(row.invoiceId);
        const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : "";
        const className = student?.classId ? classById.get(student.classId) ?? "" : "";
        return [
          row.receiptNumber,
          row.paidAt,
          studentName,
          className,
          invoice?.label ?? "",
          String(row.amountCents),
          row.method,
          row.reference,
          row.status,
          row.receivedByName,
        ];
      }),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Paiements",
      detail: `${paymentRows.length} ligne(s)`,
    });
    return { filename: `paiements-${Date.now()}`, content, count: paymentRows.length };
  }),

  /** Export CSV des frais/factures (direction/administration/comptabilité). */
  financeInvoices: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration", "accountant"]);
    const establishmentId = tenantOf(context);
    const [invoiceRows, studentRows, classRows] = await Promise.all([
      db
        .select()
        .from(feeInvoices)
        .where(eq(feeInvoices.establishmentId, establishmentId))
        .orderBy(desc(feeInvoices.dueDate), desc(feeInvoices.createdAt)),
      db.select().from(students).where(eq(students.establishmentId, establishmentId)),
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
    ]);
    const studentById = new Map(studentRows.map((row) => [row.id, row]));
    const classById = new Map(classRows.map((row) => [row.id, row.name]));
    const content = toCsv(
      ["Élève", "Classe", "Frais", "Montant (centimes)", "Échéance", "Statut", "Note"],
      invoiceRows.map((row) => {
        const student = studentById.get(row.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : "";
        const className = student?.classId ? classById.get(student.classId) ?? "" : "";
        return [
          studentName,
          className,
          row.label,
          String(row.amountCents),
          row.dueDate,
          row.status,
          row.note,
        ];
      }),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Frais",
      detail: `${invoiceRows.length} ligne(s)`,
    });
    return { filename: `frais-${Date.now()}`, content, count: invoiceRows.length };
  }),

  /** Export CSV des présences (appels/pointages) - personnel habilité. */
  attendance: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration", "teacher", "supervisor"]);
    const establishmentId = tenantOf(context);
    const [sessionRows, recordRows, studentRows, classRows] = await Promise.all([
      db
        .select()
        .from(attendanceSessions)
        .where(eq(attendanceSessions.establishmentId, establishmentId))
        .orderBy(desc(attendanceSessions.date), desc(attendanceSessions.createdAt)),
      db
        .select()
        .from(attendanceRecords)
        .where(eq(attendanceRecords.establishmentId, establishmentId)),
      db.select().from(students).where(eq(students.establishmentId, establishmentId)),
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
    ]);
    const sessionById = new Map(sessionRows.map((row) => [row.id, row]));
    const studentById = new Map(studentRows.map((row) => [row.id, row]));
    const classById = new Map(classRows.map((row) => [row.id, row.name]));
    const content = toCsv(
      [
        "Date",
        "Classe",
        "Élève",
        "Statut élève",
        "Minutes de retard",
        "Motif",
        "Justificatif",
        "Statut de l'appel",
        "Saisi par",
      ],
      recordRows.map((row) => {
        const session = sessionById.get(row.sessionId);
        const student = studentById.get(row.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : "";
        const className = session?.classId ? classById.get(session.classId) ?? "" : "";
        return [
          session?.date ?? "",
          className,
          studentName,
          row.status,
          String(row.minutesLate ?? 0),
          row.reason,
          row.justification,
          session?.status ?? "",
          session?.takenByName ?? "",
        ];
      }),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Présences",
      detail: `${recordRows.length} ligne(s)`,
    });
    return { filename: `presences-${Date.now()}`, content, count: recordRows.length };
  }),

  /** Export CSV des incidents disciplinaires - personnel habilité. */
  discipline: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration", "supervisor", "teacher"]);
    const establishmentId = tenantOf(context);
    const [incidentRows, studentRows, classRows] = await Promise.all([
      db
        .select()
        .from(disciplineIncidents)
        .where(eq(disciplineIncidents.establishmentId, establishmentId))
        .orderBy(desc(disciplineIncidents.date), desc(disciplineIncidents.createdAt)),
      db.select().from(students).where(eq(students.establishmentId, establishmentId)),
      db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
    ]);
    const studentById = new Map(studentRows.map((row) => [row.id, row]));
    const classById = new Map(classRows.map((row) => [row.id, row.name]));
    const content = toCsv(
      ["Date", "Élève", "Classe", "Type", "Gravité", "Statut", "Responsable", "Lieu", "Description", "Mesures"],
      incidentRows.map((row) => {
        const student = studentById.get(row.studentId);
        const studentName = student ? `${student.firstName} ${student.lastName}`.trim() : "";
        const className = student?.classId ? classById.get(student.classId) ?? "" : "";
        return [
          row.date,
          studentName,
          className,
          row.type,
          row.severity,
          row.status,
          row.responsibleName,
          row.location,
          row.description,
          row.measures,
        ];
      }),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Discipline",
      detail: `${incidentRows.length} ligne(s)`,
    });
    return { filename: `discipline-${Date.now()}`, content, count: incidentRows.length };
  }),

  /** Export CSV des examens et délibérations - personnel habilité. */
  exams: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, ["direction", "administration", "teacher", "supervisor"]);
    const establishmentId = tenantOf(context);
    const rows = await db
      .select()
      .from(exams)
      .where(eq(exams.establishmentId, establishmentId))
      .orderBy(desc(exams.createdAt));
    const content = toCsv(
      ["Titre", "Type", "Classes", "Dates", "Candidats", "Statut", "Notes", "Créé par"],
      rows.map((row) => [
        row.title,
        row.type,
        row.classesLabel,
        row.datesLabel,
        String(row.candidatesCount ?? 0),
        row.status,
        row.notes,
        row.createdByName,
      ]),
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Export CSV",
      target: "Examens",
      detail: `${rows.length} ligne(s)`,
    });
    return { filename: `examens-${Date.now()}`, content, count: rows.length };
  }),
};
