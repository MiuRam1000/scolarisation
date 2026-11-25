import { client } from "./api";

/** Export CSV serveur du journal d'audit (tracé dans le journal). */
export async function exportAuditCsv() {
  return client.exports.audit({});
}

/** Export CSV serveur de la liste des élèves (tracé dans le journal). */
export async function exportStudentsCsv() {
  return client.exports.students({});
}

/** Export CSV serveur des paiements/reçus (tracé dans le journal). */
export async function exportFinancePaymentsCsv() {
  return client.exports.financePayments({});
}

/** Export CSV serveur des frais/factures (tracé dans le journal). */
export async function exportFinanceInvoicesCsv() {
  return client.exports.financeInvoices({});
}

/** Export CSV serveur des présences (tracé dans le journal). */
export async function exportAttendanceCsv() {
  return client.exports.attendance({});
}

/** Export CSV serveur des incidents disciplinaires (tracé dans le journal). */
export async function exportDisciplineCsv() {
  return client.exports.discipline({});
}

/** Export CSV serveur des examens/délibérations (tracé dans le journal). */
export async function exportExamsCsv() {
  return client.exports.exams({});
}
