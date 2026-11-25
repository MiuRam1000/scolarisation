import { client } from "./api";

export type AdministrativeDocumentsSnapshot = Awaited<
  ReturnType<typeof client.documents.snapshot>
>;
export type AdministrativeDocument = AdministrativeDocumentsSnapshot["documents"][number];
export type AdministrativeDocumentKind = "certificate" | "enrollment" | "class_list";

export const DOCUMENT_KIND_LABELS: Record<AdministrativeDocumentKind, string> = {
  certificate: "Certificat de scolarité",
  enrollment: "Attestation d'inscription",
  class_list: "Liste de classe",
};

export async function generateAdministrativeDocument(values: {
  kind: AdministrativeDocumentKind;
  studentId?: string;
  classId?: string;
}) {
  return client.documents.generate({
    kind: values.kind,
    studentId: values.studentId ?? "",
    classId: values.classId ?? "",
  });
}

export async function validateAdministrativeDocument(id: string) {
  return client.documents.validate({ id });
}

export async function cancelAdministrativeDocument(id: string, reason: string) {
  return client.documents.cancel({ id, reason });
}

export async function fetchAdministrativeDocument(id: string) {
  return client.documents.content({ id });
}
