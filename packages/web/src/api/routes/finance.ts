import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import {
  cashClosures,
  classes,
  feeInvoices,
  guardians,
  payments,
  studentGuardians,
  students,
} from "../database/schema";
import { authed, requireRole } from "../auth/guards";
import { assertTrustedOrigin } from "../auth/origin";
import { logAudit } from "../audit-log";
import { logStudentHistory, tenantOf } from "./scolarite-helpers";

const FINANCE_READ_ROLES = [
  "direction",
  "administration",
  "accountant",
  "parent",
  "student",
] as const;
const FINANCE_WRITE_ROLES = ["direction", "administration", "accountant"] as const;
const PAYMENT_METHODS = ["Espèces", "Chèque", "Virement", "Mobile money", "Autre"] as const;

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date attendue au format AAAA-MM-JJ.");

const moneyField = z.number().int().min(1).max(1_000_000_000);

const invoiceInput = z.object({
  studentId: z.string().trim().min(1).max(60),
  label: z.string().trim().min(2).max(160),
  amountCents: moneyField,
  dueDate: dateField,
  note: z.string().trim().max(500).default(""),
});

const paymentInput = z.object({
  invoiceId: z.string().trim().min(1).max(60),
  amountCents: moneyField,
  method: z.enum(PAYMENT_METHODS).default("Espèces"),
  reference: z.string().trim().max(100).default(""),
  paidAt: dateField,
  note: z.string().trim().max(500).default(""),
});

const cancelPaymentInput = z.object({
  id: z.string().trim().min(1).max(60),
  reason: z.string().trim().min(2).max(500),
});

const closeCashInput = z.object({
  date: dateField,
  note: z.string().trim().max(500).default(""),
});

function activeStudent(status: string) {
  return !["Archivé", "Transféré", "Sorti", "Désinscrit"].includes(status);
}

async function familyStudentIds(establishmentId: string, userId: string, role: string) {
  if (role === "student") {
    const rows = await db
      .select({ id: students.id })
      .from(students)
      .where(
        and(eq(students.establishmentId, establishmentId), eq(students.userId, userId)),
      );
    return rows.map((row) => row.id);
  }
  const linkedGuardians = await db
    .select({ id: guardians.id })
    .from(guardians)
    .where(
      and(eq(guardians.establishmentId, establishmentId), eq(guardians.userId, userId)),
    );
  if (!linkedGuardians.length) return [] as string[];
  if (!linkedGuardians.length) return [] as string[];
  const links = await db
    .select({ studentId: studentGuardians.studentId })
    .from(studentGuardians)
    .where(
      inArray(
        studentGuardians.guardianId,
        linkedGuardians.map((row) => row.id),
      ),
    );
  return [...new Set(links.map((row) => row.studentId))];
}

async function invoicePaidCents(establishmentId: string, invoiceId: string) {
  const rows = await db
    .select({ amountCents: payments.amountCents })
    .from(payments)
    .where(
      and(
        eq(payments.establishmentId, establishmentId),
        eq(payments.invoiceId, invoiceId),
        eq(payments.status, "Validé"),
      ),
    );
  return rows.reduce((sum, row) => sum + row.amountCents, 0);
}

async function refreshInvoiceStatus(establishmentId: string, invoiceId: string) {
  const rows = await db
    .select()
    .from(feeInvoices)
    .where(
      and(
        eq(feeInvoices.id, invoiceId),
        eq(feeInvoices.establishmentId, establishmentId),
      ),
    )
    .limit(1);
  const invoice = rows[0];
  if (!invoice || invoice.status === "Annulé") return;
  const paid = await invoicePaidCents(establishmentId, invoice.id);
  const status = paid <= 0 ? "À payer" : paid >= invoice.amountCents ? "Payé" : "Partiel";
  await db
    .update(feeInvoices)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(feeInvoices.id, invoice.id));
}

async function nextReceiptNumber(establishmentId: string) {
  const rows = await db
    .select({ id: payments.id })
    .from(payments)
    .where(eq(payments.establishmentId, establishmentId));
  let sequence = rows.length + 1;
  while (true) {
    const candidate = `REC-${new Date().getFullYear()}-${String(sequence).padStart(4, "0")}`;
    const existing = await db
      .select({ id: payments.id })
      .from(payments)
      .where(
        and(
          eq(payments.establishmentId, establishmentId),
          eq(payments.receiptNumber, candidate),
        ),
      )
      .limit(1);
    if (!existing.length) return candidate;
    sequence += 1;
  }
}

export const finance = {
  /** Frais, encaissements, soldes et clôtures visibles selon le rôle. */
  snapshot: authed.handler(async ({ context }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...FINANCE_READ_ROLES]);
    const establishmentId = tenantOf(context);
    const role = context.user.role;
    const family = role === "parent" || role === "student";
    const linkedIds = family
      ? await familyStudentIds(establishmentId, context.user.id, role)
      : null;
    const [classRows, studentRows, invoiceRows, paymentRows, closureRows] =
      await Promise.all([
        db.select().from(classes).where(eq(classes.establishmentId, establishmentId)),
        db
          .select()
          .from(students)
          .where(eq(students.establishmentId, establishmentId))
          .orderBy(asc(students.lastName), asc(students.firstName)),
        db
          .select()
          .from(feeInvoices)
          .where(eq(feeInvoices.establishmentId, establishmentId))
          .orderBy(desc(feeInvoices.dueDate), desc(feeInvoices.createdAt)),
        db
          .select()
          .from(payments)
          .where(eq(payments.establishmentId, establishmentId))
          .orderBy(desc(payments.paidAt), desc(payments.createdAt)),
        family
          ? Promise.resolve([])
          : db
              .select()
              .from(cashClosures)
              .where(eq(cashClosures.establishmentId, establishmentId))
              .orderBy(desc(cashClosures.date)),
      ]);
    const classById = new Map(classRows.map((row) => [row.id, row]));
    const visibleStudents = studentRows
      .filter((student) => activeStudent(student.status))
      .filter((student) => !linkedIds || linkedIds.includes(student.id));
    const studentById = new Map(studentRows.map((row) => [row.id, row]));
    const visibleInvoices = invoiceRows.filter(
      (invoice) => !linkedIds || linkedIds.includes(invoice.studentId),
    );
    const visiblePayments = paymentRows
      .filter((payment) => !linkedIds || linkedIds.includes(payment.studentId))
      .filter((payment) => !family || payment.status === "Validé");
    const paymentsByInvoice = new Map<string, number>();
    for (const payment of visiblePayments) {
      if (payment.status !== "Validé") continue;
      paymentsByInvoice.set(
        payment.invoiceId,
        (paymentsByInvoice.get(payment.invoiceId) ?? 0) + payment.amountCents,
      );
    }
    const invoiceById = new Map(visibleInvoices.map((row) => [row.id, row]));
    const invoices = visibleInvoices.map((invoice) => {
      const student = studentById.get(invoice.studentId);
      const paidCents = paymentsByInvoice.get(invoice.id) ?? 0;
      return {
        id: invoice.id,
        studentId: invoice.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : "",
        className: student?.classId ? classById.get(student.classId)?.name ?? "" : "",
        label: invoice.label,
        amountCents: invoice.amountCents,
        paidCents,
        balanceCents:
          invoice.status === "Annulé" ? 0 : Math.max(0, invoice.amountCents - paidCents),
        dueDate: invoice.dueDate,
        status: invoice.status,
        note: invoice.note,
        createdAt: new Date(invoice.createdAt).toISOString(),
      };
    });
    const enrichedPayments = visiblePayments.map((payment) => {
      const student = studentById.get(payment.studentId);
      const invoice = invoiceById.get(payment.invoiceId);
      return {
        id: payment.id,
        invoiceId: payment.invoiceId,
        invoiceLabel: invoice?.label ?? "",
        studentId: payment.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : "",
        className: student?.classId ? classById.get(student.classId)?.name ?? "" : "",
        amountCents: payment.amountCents,
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt,
        receivedByName: payment.receivedByName,
        status: payment.status,
        receiptNumber: payment.receiptNumber,
        note: payment.note,
        createdAt: new Date(payment.createdAt).toISOString(),
      };
    });
    const today = new Date().toISOString().slice(0, 10);
    const activeInvoices = invoices.filter((invoice) => invoice.status !== "Annulé");
    const validPayments = enrichedPayments.filter((payment) => payment.status === "Validé");
    const invoiced = activeInvoices.reduce((sum, invoice) => sum + invoice.amountCents, 0);
    const collected = validPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const outstanding = activeInvoices.reduce(
      (sum, invoice) => sum + invoice.balanceCents,
      0,
    );
    const todayCollected = validPayments
      .filter((payment) => payment.paidAt === today)
      .reduce((sum, payment) => sum + payment.amountCents, 0);
    const closures = closureRows.map((closure) => ({
      id: closure.id,
      date: closure.date,
      totalCents: closure.totalCents,
      paymentCount: closure.paymentCount,
      closedByName: closure.closedByName,
      note: closure.note,
      createdAt: new Date(closure.createdAt).toISOString(),
    }));
    return {
      students: visibleStudents.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        reference: student.reference,
        className: student.classId ? classById.get(student.classId)?.name ?? "" : "",
      })),
      invoices,
      payments: enrichedPayments,
      closures,
      stats: {
        invoiced,
        collected,
        outstanding,
        todayCollected,
        receiptCount: validPayments.length,
        invoiceCount: activeInvoices.length,
        cashClosedToday: closures.some((closure) => closure.date === today),
      },
    };
  }),

  createInvoice: authed.input(invoiceInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...FINANCE_WRITE_ROLES]);
    const establishmentId = tenantOf(context);
    const rows = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.id, input.studentId),
          eq(students.establishmentId, establishmentId),
        ),
      )
      .limit(1);
    const student = rows[0];
    if (!student) throw new ORPCError("BAD_REQUEST", { message: "Élève inconnu." });
    const id = crypto.randomUUID();
    await db.insert(feeInvoices).values({
      id,
      establishmentId,
      studentId: student.id,
      label: input.label,
      amountCents: input.amountCents,
      dueDate: input.dueDate,
      status: "À payer",
      note: input.note,
      updatedAt: new Date().toISOString(),
    });
    await logStudentHistory(
      establishmentId,
      student.id,
      "Finance",
      `Frais créé · ${input.label}`,
      context.user.name,
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Création de frais scolaires",
      target: `${student.firstName} ${student.lastName}`,
      detail: `${input.label} · ${input.amountCents} centimes`,
    });
    return { id };
  }),

  recordPayment: authed.input(paymentInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...FINANCE_WRITE_ROLES]);
    const establishmentId = tenantOf(context);
    const invoiceRows = await db
      .select()
      .from(feeInvoices)
      .where(
        and(
          eq(feeInvoices.id, input.invoiceId),
          eq(feeInvoices.establishmentId, establishmentId),
        ),
      )
      .limit(1);
    const invoice = invoiceRows[0];
    if (!invoice) throw new ORPCError("BAD_REQUEST", { message: "Frais inconnu." });
    if (invoice.status === "Annulé") {
      throw new ORPCError("BAD_REQUEST", { message: "Ce frais est annulé." });
    }
    const alreadyPaid = await invoicePaidCents(establishmentId, invoice.id);
    const remaining = Math.max(0, invoice.amountCents - alreadyPaid);
    if (remaining <= 0) {
      throw new ORPCError("BAD_REQUEST", { message: "Ce frais est déjà entièrement payé." });
    }
    if (input.amountCents > remaining) {
      throw new ORPCError("BAD_REQUEST", {
        message: `Le montant dépasse le solde restant (${remaining} centimes).`,
      });
    }
    if (input.reference) {
      const duplicate = await db
        .select({ id: payments.id })
        .from(payments)
        .where(
          and(
            eq(payments.establishmentId, establishmentId),
            eq(payments.reference, input.reference),
          ),
        )
        .limit(1);
      if (duplicate.length) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Cette référence de paiement est déjà utilisée.",
        });
      }
    }
    const receiptNumber = await nextReceiptNumber(establishmentId);
    const id = crypto.randomUUID();
    await db.insert(payments).values({
      id,
      establishmentId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amountCents: input.amountCents,
      method: input.method,
      reference: input.reference,
      paidAt: input.paidAt,
      receivedByUserId: context.user.id,
      receivedByName: context.user.name,
      status: "Validé",
      receiptNumber,
      note: input.note,
    });
    await refreshInvoiceStatus(establishmentId, invoice.id);
    await logStudentHistory(
      establishmentId,
      invoice.studentId,
      "Finance",
      `Paiement ${receiptNumber} · ${input.amountCents} centimes`,
      context.user.name,
    );
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Enregistrement d’un paiement",
      target: receiptNumber,
      detail: `${input.amountCents} centimes · ${input.method}`,
    });
    return { id, receiptNumber };
  }),

  cancelPayment: authed
    .input(cancelPaymentInput)
    .handler(async ({ context, input }) => {
      assertTrustedOrigin(context.headers);
      requireRole(context.user.role, ["direction", "administration"]);
      const establishmentId = tenantOf(context);
      const rows = await db
        .select()
        .from(payments)
        .where(
          and(eq(payments.id, input.id), eq(payments.establishmentId, establishmentId)),
        )
        .limit(1);
      const payment = rows[0];
      if (!payment) throw new ORPCError("BAD_REQUEST", { message: "Paiement inconnu." });
      if (payment.status === "Annulé") {
        throw new ORPCError("BAD_REQUEST", { message: "Ce paiement est déjà annulé." });
      }
      await db
        .update(payments)
        .set({
          status: "Annulé",
          note: `${payment.note ? `${payment.note} · ` : ""}Annulation : ${input.reason}`,
        })
        .where(eq(payments.id, payment.id));
      await refreshInvoiceStatus(establishmentId, payment.invoiceId);
      await logStudentHistory(
        establishmentId,
        payment.studentId,
        "Finance",
        `Paiement ${payment.receiptNumber} annulé · ${input.reason}`,
        context.user.name,
      );
      await logAudit({
        establishmentId,
        userId: context.user.id,
        actor: context.user.name,
        action: "Annulation d’un paiement",
        target: payment.receiptNumber,
        detail: input.reason,
      });
      return { id: payment.id };
    }),

  closeCash: authed.input(closeCashInput).handler(async ({ context, input }) => {
    assertTrustedOrigin(context.headers);
    requireRole(context.user.role, [...FINANCE_WRITE_ROLES]);
    const establishmentId = tenantOf(context);
    const existing = await db
      .select({ id: cashClosures.id })
      .from(cashClosures)
      .where(
        and(
          eq(cashClosures.establishmentId, establishmentId),
          eq(cashClosures.date, input.date),
        ),
      )
      .limit(1);
    if (existing.length) {
      throw new ORPCError("BAD_REQUEST", {
        message: "La caisse de cette date est déjà clôturée.",
      });
    }
    const dayPayments = await db
      .select({ amountCents: payments.amountCents })
      .from(payments)
      .where(
        and(
          eq(payments.establishmentId, establishmentId),
          eq(payments.paidAt, input.date),
          eq(payments.status, "Validé"),
        ),
      );
    const totalCents = dayPayments.reduce((sum, payment) => sum + payment.amountCents, 0);
    const id = crypto.randomUUID();
    await db.insert(cashClosures).values({
      id,
      establishmentId,
      date: input.date,
      totalCents,
      paymentCount: dayPayments.length,
      closedByUserId: context.user.id,
      closedByName: context.user.name,
      note: input.note,
    });
    await logAudit({
      establishmentId,
      userId: context.user.id,
      actor: context.user.name,
      action: "Clôture de caisse",
      target: input.date,
      detail: `${totalCents} centimes · ${dayPayments.length} reçu(s)`,
    });
    return { id, totalCents, paymentCount: dayPayments.length };
  }),
};
