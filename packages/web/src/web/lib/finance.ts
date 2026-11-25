import { client } from "./api";

export type FinanceSnapshot = Awaited<ReturnType<typeof client.finance.snapshot>>;
export type FinanceInvoice = FinanceSnapshot["invoices"][number];
export type FinancePayment = FinanceSnapshot["payments"][number];
export type FinanceStudent = FinanceSnapshot["students"][number];

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export async function createInvoice(values: {
  studentId: string;
  label: string;
  amountCents: number;
  dueDate: string;
  note?: string;
}) {
  return client.finance.createInvoice({
    studentId: values.studentId,
    label: values.label,
    amountCents: values.amountCents,
    dueDate: values.dueDate,
    note: values.note ?? "",
  });
}

export async function recordPayment(values: {
  invoiceId: string;
  amountCents: number;
  method: string;
  reference?: string;
  paidAt: string;
  note?: string;
}) {
  return client.finance.recordPayment({
    invoiceId: values.invoiceId,
    amountCents: values.amountCents,
    method: values.method as
      | "Espèces"
      | "Chèque"
      | "Virement"
      | "Mobile money"
      | "Autre",
    reference: values.reference ?? "",
    paidAt: values.paidAt,
    note: values.note ?? "",
  });
}

export async function cancelPayment(id: string, reason: string) {
  return client.finance.cancelPayment({ id, reason });
}

export async function closeCash(date: string, note?: string) {
  return client.finance.closeCash({ date, note: note ?? "" });
}
