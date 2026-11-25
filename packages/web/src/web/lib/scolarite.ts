import type { DemoRow } from "./demo-data";
import { client } from "./api";

export type SnapshotHistoryEvent = {
  id: string;
  action: string;
  detail: string;
  actor: string;
  createdAt: string | number | Date;
};
export type SnapshotDocument = {
  id: string;
  kind: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy?: string;
  createdAt: string | number | Date;
};
export type SnapshotEnrollment = {
  id: string;
  academicYearId: string | null;
  schoolYear: string;
  classId: string | null;
  className: string;
  enrolledAt: string;
  kind: string;
  status: string;
  note: string;
  createdAt: string | number | Date;
};
export type SnapshotStudent = {
  id: string;
  name: string;
  reference: string;
  classId: string | null;
  className: string;
  guardians: string[];
  guardianRelations?: string[];
  guardianDetails?: {
    guardianId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    relation: string;
  }[];
  birthDate: string;
  sex?: string;
  address?: string;
  phone?: string;
  schoolYear?: string;
  photo?: string;
  birthCertificate?: string;
  transferCertificate?: string;
  enrolledAt: string;
  status: string;
  admissionDecision?: string;
  admissionNote?: string;
  archivedAt?: string;
  history?: SnapshotHistoryEvent[];
  documents?: SnapshotDocument[];
  enrollments?: SnapshotEnrollment[];
};
export type SnapshotGuardian = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  children: string[];
  portal: string;
  status: string;
};
export type SnapshotClass = {
  id: string;
  name: string;
  level: string;
  room: string;
  capacity: number;
  enrolled: number;
  mainTeacher: string;
  status: string;
};
export type SnapshotStaff = {
  id: string;
  name: string;
  type: string;
  specialty: string;
  assignments: string;
  weeklyHours: number;
  email: string;
  status: string;
};
export type ScolariteSnapshot = {
  students: SnapshotStudent[];
  guardians: SnapshotGuardian[];
  classes: SnapshotClass[];
  staff: SnapshotStaff[];
};

/** Référentiels de l'établissement (§8, §9, §13). */
export type ReferentielSnapshot = {
  academicYears: {
    id: string;
    label: string;
    startsOn: string;
    endsOn: string;
    status: string;
  }[];
  periods: {
    id: string;
    academicYearId: string;
    academicYearLabel: string;
    name: string;
    startsOn: string;
    endsOn: string;
    gradesDeadline: string;
    status: string;
  }[];
  subjects: {
    id: string;
    name: string;
    level: string;
    program: string;
    coefficient: number;
    weeklyHours: number;
    status: string;
  }[];
  rooms: {
    id: string;
    name: string;
    type: string;
    capacity: number;
    equipment: string;
    building: string;
    status: string;
  }[];
  programDocuments: {
    id: string;
    subjectId: string;
    fileName: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    createdAt: string | number | Date;
  }[];
  settings: {
    name: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    periodType: string;
    rounding: string;
  } | null;
};

export const REFERENTIEL_MODULES = ["subjects", "years", "rooms"] as const;
export type ReferentielModule = (typeof REFERENTIEL_MODULES)[number];

export const isReferentielModule = (id: string): id is ReferentielModule =>
  (REFERENTIEL_MODULES as readonly string[]).includes(id);


export const SCOLARITE_MODULES = ["students", "families", "classes", "teachers"] as const;
export type ScolariteModule = (typeof SCOLARITE_MODULES)[number];

export const isScolariteModule = (id: string): id is ScolariteModule =>
  (SCOLARITE_MODULES as readonly string[]).includes(id);

/** Valeurs proposées pour le statut d'un dossier élève. */
export const STUDENT_STATUSES = [
  "En attente de validation",
  "Inscrit",
  "Actif",
  "Transféré",
  "Sorti",
  "Suspendu",
  "Archivé",
  "Désinscrit",
] as const;

const formatDate = (value: string) => {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
};

/** Convertit la photographie serveur en lignes du tableau existant. */
export function buildScolariteRows(
  snapshot?: ScolariteSnapshot,
): Record<ScolariteModule, DemoRow[]> {
  return {
    students: (snapshot?.students ?? []).map((s) => ({
      name: s.name,
      sub: s.reference,
      fields: [s.className || "Sans classe", s.guardians.join(", ") || "À renseigner", formatDate(s.enrolledAt)],
      status: s.status,
    })),
    families: (snapshot?.guardians ?? []).map((g) => ({
      name: g.name,
      sub: "Responsable",
      fields: [g.children.join(", ") || "Aucun enfant lié", g.email || g.phone, g.portal],
      status: g.status,
    })),
    classes: (snapshot?.classes ?? []).map((c) => ({
      name: c.name,
      sub: c.room || "Salle à définir",
      fields: [c.level || "Niveau à définir", `${c.enrolled} / ${c.capacity}`, c.mainTeacher || "Non affecté"],
      status: c.status,
    })),
    teachers: (snapshot?.staff ?? []).map((s) => ({
      name: s.name,
      sub: s.type,
      id: s.id,
      fields: [s.specialty, s.assignments || "Aucune affectation", `${s.weeklyHours} heures`],
      status: s.status,
    })),
  };
}

/** Convertit les référentiels serveur en lignes de tableau. */
export function buildReferentielRows(
  snapshot?: ReferentielSnapshot,
): Record<ReferentielModule, DemoRow[]> {
  const programBySubject = new Map(
    (snapshot?.programDocuments ?? []).map((doc) => [doc.subjectId, doc]),
  );
  return {
    subjects: (snapshot?.subjects ?? []).map((s) => ({
      name: s.name,
      sub: s.level || "Tous niveaux",
      id: s.id,
      fields: [
        s.level || "Tous niveaux",
        programBySubject.get(s.id)?.fileName || s.program || "Aucun fichier",
        String(s.coefficient),
        `${s.weeklyHours} h / semaine`,
      ],
      status: s.status,
    })),
    years: (snapshot?.periods ?? []).map((p) => ({
      name: p.name,
      sub: p.academicYearLabel || "Année en cours",
      id: p.id,
      fields: [
        formatDate(p.startsOn) || "—",
        formatDate(p.endsOn) || "—",
        p.gradesDeadline ? `Jusqu’au ${formatDate(p.gradesDeadline)}` : "—",
      ],
      status: p.status,
    })),
    rooms: (snapshot?.rooms ?? []).map((r) => ({
      name: r.name,
      sub: r.type,
      id: r.id,
      fields: [
        `${r.capacity} places`,
        r.equipment || "—",
        r.building || "—",
      ],
      status: r.status,
    })),
  };
}

const toIsoDate = (value?: string) => {
  const raw = (value ?? "").trim();
  if (!raw) return undefined;
  const french = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (french) return `${french[3]}-${french[2].padStart(2, "0")}-${french[1].padStart(2, "0")}`;
  return raw;
};

const toNumber = (value: string | undefined, fallback: number) => {
  const digits = (value ?? "").match(/\d+/g);
  if (!digits?.length) return fallback;
  return Number(digits[digits.length - 1]);
};

/**
 * Inscription d'un élève depuis le formulaire dédié de la page
 * « Élèves & inscriptions » (identité, scolarité, responsable, documents).
 */
export async function enrollStudent(values: Record<string, string>, snapshot?: ScolariteSnapshot) {
  const firstName = (values.firstName ?? "").trim();
  const lastName = (values.lastName ?? "").trim();
  if (!firstName) throw new Error("Le prénom est obligatoire.");
  if (!lastName) throw new Error("Le nom est obligatoire.");
  const className = (values.className ?? "").trim().toLowerCase();
  const classId = className
    ? snapshot?.classes.find((c) => c.name.toLowerCase() === className)?.id
    : undefined;

  return client.scolarite.createStudent({
    firstName,
    lastName,
    classId,
    birthDate: toIsoDate(values.birthDate) ?? "",
    sex: (values.sex ?? "").trim(),
    address: (values.address ?? "").trim(),
    phone: (values.phone ?? "").trim(),
    schoolYear: (values.schoolYear ?? "").trim(),
    enrolledAt: toIsoDate(values.enrolledAt) ?? "",
    photo: (values.photo ?? "").trim(),
    birthCertificate: (values.birthCertificate ?? "").trim(),
    transferCertificate: (values.transferCertificate ?? "").trim(),
    guardianName: (values.guardianName ?? "").trim() || undefined,
    guardianPhone: (values.guardianPhone ?? "").trim() || undefined,
    guardianEmail: (values.guardianEmail ?? "").trim().toLowerCase(),
    guardianAddress: (values.guardianAddress ?? "").trim() || undefined,
    guardianRelation: (values.guardianRelation ?? "").trim() || undefined,
    status: (values.status ?? "").trim() || "En attente de validation",
  });
}

/**
 * Met à jour un dossier élève existant depuis le formulaire dédié.
 */
export async function updateStudentRecord(
  values: Record<string, string>,
  snapshot?: ScolariteSnapshot,
) {
  const id = (values.id ?? "").trim();
  if (!id) throw new Error("Dossier élève introuvable.");
  const className = (values.className ?? "").trim().toLowerCase();
  const classId = className
    ? snapshot?.classes.find((c) => c.name.toLowerCase() === className)?.id
    : undefined;

  return client.scolarite.updateStudent({
    id,
    firstName: (values.firstName ?? "").trim(),
    lastName: (values.lastName ?? "").trim(),
    classId,
    birthDate: toIsoDate(values.birthDate) ?? "",
    sex: (values.sex ?? "").trim(),
    address: (values.address ?? "").trim(),
    phone: (values.phone ?? "").trim(),
    schoolYear: (values.schoolYear ?? "").trim(),
    enrolledAt: toIsoDate(values.enrolledAt) ?? "",
    photo: (values.photo ?? "").trim(),
    birthCertificate: (values.birthCertificate ?? "").trim(),
    transferCertificate: (values.transferCertificate ?? "").trim(),
    guardianName: (values.guardianName ?? "").trim(),
    guardianPhone: (values.guardianPhone ?? "").trim(),
    guardianEmail: (values.guardianEmail ?? "").trim().toLowerCase(),
    guardianAddress: (values.guardianAddress ?? "").trim(),
    guardianRelation: (values.guardianRelation ?? "").trim(),
    status: (values.status ?? "").trim() as
      | "En attente de validation"
      | "Inscrit"
      | "Actif"
      | "Transféré"
      | "Sorti"
      | "Suspendu"
      | "Archivé"
      | "Désinscrit",
  });
}

export async function changeStudentStatus(
  id: string,
  status: (typeof STUDENT_STATUSES)[number],
) {
  return client.scolarite.changeStudentStatus({ id, status });
}

/** Décision d'admission : accepté, refusé ou liste d'attente. */
export async function decideStudentAdmission(
  id: string,
  decision: "accepté" | "refusé" | "liste d'attente",
  note = "",
  classId?: string,
) {
  return client.scolarite.decideAdmission({ id, decision, note, classId });
}

/** Réinscription annuelle. */
export async function reinscribeStudent(values: {
  id: string;
  schoolYear: string;
  classId?: string;
  enrolledAt?: string;
  note?: string;
}) {
  return client.scolarite.reinscribeStudent(values);
}

/** Transfert d'un élève vers une autre classe. */
export async function transferStudent(id: string, classId: string, reason = "") {
  return client.scolarite.transferStudent({ id, classId, reason });
}

/** Transfert vers un autre établissement. */
export async function transferOutStudent(id: string, destination: string, reason = "") {
  return client.scolarite.transferOutStudent({ id, destination, reason });
}

/** Archivage du dossier. */
export async function archiveStudent(id: string, reason = "") {
  return client.scolarite.archiveStudent({ id, reason });
}

export async function addStudentGuardian(values: {
  studentId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  relation?: string;
}) {
  return client.scolarite.addStudentGuardian({
    studentId: values.studentId,
    name: values.name,
    phone: values.phone ?? "",
    email: values.email ?? "",
    address: values.address ?? "",
    relation: values.relation ?? "Responsable légal",
  });
}

export async function updateStudentGuardian(values: {
  studentId: string;
  guardianId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  relation?: string;
}) {
  return client.scolarite.updateStudentGuardian({
    studentId: values.studentId,
    guardianId: values.guardianId,
    name: values.name,
    phone: values.phone ?? "",
    email: values.email ?? "",
    address: values.address ?? "",
    relation: values.relation ?? "Responsable légal",
  });
}

export async function removeStudentGuardian(studentId: string, guardianId: string) {
  return client.scolarite.removeStudentGuardian({ studentId, guardianId });
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      resolve(result.includes(",") ? result.slice(result.indexOf(",") + 1) : result);
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });

export const DOCUMENT_LABELS: Record<string, string> = {
  photo: "Photo de l’élève",
  birth_certificate: "Acte de naissance",
  transfer_certificate: "Certificat de transfert",
  other: "Pièce jointe",
};

export async function uploadStudentDocument(studentId: string, kind: string, file: File) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Le fichier dépasse la taille maximale de 5 Mo.");
  }
  const content = await fileToBase64(file);
  return client.studentDocuments.upload({
    studentId,
    kind: kind as "photo" | "birth_certificate" | "transfer_certificate" | "other",
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    content,
  });
}

export async function removeStudentDocument(id: string) {
  return client.studentDocuments.remove({ id });
}

function downloadBase64File(content: string, mimeType: string, fileName: string) {
  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadStudentDocument(id: string) {
  const doc = await client.studentDocuments.content({ id });
  downloadBase64File(doc.content, doc.mimeType, doc.fileName);
}

/** Programme d'une matière : fichier unique remplaçable. */
export async function uploadSubjectProgram(subjectId: string, file: File) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Le fichier dépasse la taille maximale de 5 Mo.");
  }
  const content = await fileToBase64(file);
  return client.subjectPrograms.upload({
    subjectId,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    content,
  });
}

export async function downloadSubjectProgram(id: string) {
  const doc = await client.subjectPrograms.content({ id });
  downloadBase64File(doc.content, doc.mimeType, doc.fileName);
}

export async function removeSubjectProgram(id: string) {
  return client.subjectPrograms.remove({ id });
}

/** Contrôle de complétude du dossier élève. */
export function studentCompleteness(student?: SnapshotStudent | null) {
  if (!student) return { checks: [], complete: false };
  const docs = student.documents ?? [];
  const hasDoc = (kind: string) => docs.some((d) => d.kind === kind);
  const checks = [
    {
      label: "Identité (nom, prénom, naissance, sexe)",
      done: Boolean(
        student.name.trim() && student.birthDate && (student.sex ?? "").trim(),
      ),
    },
    {
      label: "Coordonnées de l’élève",
      done: Boolean((student.address ?? "").trim() || (student.phone ?? "").trim()),
    },
    {
      label: "Classe et année scolaire",
      done: Boolean(student.className && (student.schoolYear ?? "").trim()),
    },
    {
      label: "Responsable légal",
      done: Boolean(student.guardians.length),
    },
    {
      label: "Photo de l’élève",
      done: hasDoc("photo") || Boolean((student.photo ?? "").trim()),
    },
    {
      label: "Acte de naissance",
      done: hasDoc("birth_certificate") || Boolean((student.birthCertificate ?? "").trim()),
    },
    {
      label: "Certificat de transfert (si nécessaire)",
      done:
        hasDoc("transfer_certificate") || Boolean((student.transferCertificate ?? "").trim()),
      optional: true,
    },
  ];
  return { checks, complete: checks.every((c) => c.optional || c.done) };
}

/** Enregistre un référentiel réel (matière, période, salle). */
export async function createReferentielRow(
  module: ReferentielModule,
  values: Record<string, string>,
) {
  const name = (values.name ?? "").trim();
  if (!name) throw new Error("Le nom est obligatoire.");
  const status = values.status?.trim() || "Actif";

  if (module === "subjects") {
    return client.referentiel.createSubject({
      name,
      level: (values.field0 ?? "").trim(),
      program: (values.field1 ?? "").trim(),
      coefficient: toNumber(values.field2, 1),
      weeklyHours: toNumber(values.field3, 0),
      status,
    });
  }

  if (module === "rooms") {
    return client.referentiel.createRoom({
      name,
      type: (values.sub ?? "").trim() || "Salle de cours",
      capacity: toNumber(values.field0, 30),
      equipment: (values.field1 ?? "").trim(),
      building: (values.field2 ?? "").trim(),
      status,
    });
  }

  const startsOn = toIsoDate(values.field0) ?? "";
  const endsOn = toIsoDate(values.field1) ?? "";
  const label =
    startsOn && endsOn
      ? `${startsOn.slice(0, 4)}–${endsOn.slice(0, 4)}`
      : (values.academicYearLabel ?? "").trim() || "Année en cours";
  return client.referentiel.createPeriod({
    academicYearLabel: label,
    name,
    startsOn,
    endsOn,
    gradesDeadline: toIsoDate(values.field2) ?? "",
    status,
  });
}

/** Met à jour un référentiel existant. */
export async function updateReferentielRow(
  module: ReferentielModule,
  id: string,
  values: Record<string, string>,
) {
  const name = (values.name ?? "").trim();
  if (!name) throw new Error("Le nom est obligatoire.");
  const status = values.status?.trim() || "Actif";

  if (module === "subjects") {
    return client.referentiel.updateSubject({
      id,
      name,
      level: (values.field0 ?? "").trim(),
      program: (values.field1 ?? "").trim(),
      coefficient: toNumber(values.field2, 1),
      weeklyHours: toNumber(values.field3, 0),
      status,
    });
  }

  if (module === "rooms") {
    return client.referentiel.updateRoom({
      id,
      name,
      type: (values.sub ?? "").trim() || "Salle de cours",
      capacity: toNumber(values.field0, 30),
      equipment: (values.field1 ?? "").trim(),
      building: (values.field2 ?? "").trim(),
      status,
    });
  }

  return client.referentiel.updatePeriod({
    id,
    name,
    startsOn: toIsoDate(values.field0) ?? "",
    endsOn: toIsoDate(values.field1) ?? "",
    gradesDeadline: toIsoDate(values.field2) ?? "",
    status,
  });
}

/**
 * Enregistre réellement une fiche SCOLARITÉ à partir des champs du formulaire
 * générique de l'interface.
 */
export async function createScolariteRow(
  module: ScolariteModule,
  values: Record<string, string>,
  snapshot?: ScolariteSnapshot,
) {
  const name = (values.name ?? "").trim();
  if (!name) throw new Error("Le nom est obligatoire.");
  const status = values.status?.trim() || "Actif";

  if (module === "students") {
    const [firstName, ...rest] = name.split(/\s+/);
    const className = (values.field0 ?? "").trim().toLowerCase();
    const classId = className
      ? snapshot?.classes.find((c) => c.name.toLowerCase() === className)?.id
      : undefined;
    await client.scolarite.createStudent({
      firstName,
      lastName: rest.join(" ") || firstName,
      classId,
      guardianName: (values.field1 ?? "").trim() || undefined,
      enrolledAt: toIsoDate(values.field2),
      status,
    });
    return;
  }

  if (module === "families") {
    const childName = (values.field0 ?? "").trim().toLowerCase();
    const studentIds = childName
      ? (snapshot?.students ?? [])
          .filter((s) => s.name.toLowerCase() === childName)
          .map((s) => s.id)
      : [];
    await client.scolarite.createGuardian({
      name,
      email: (values.field1 ?? "").trim(),
      studentIds,
      status,
    });
    return;
  }

  if (module === "classes") {
    await client.scolarite.createClass({
      name,
      level: (values.field0 ?? "").trim(),
      capacity: toNumber(values.field1, 30),
      mainTeacher: (values.field2 ?? "").trim(),
      status,
    });
    return;
  }

  await client.scolarite.createStaff({
    name,
    type: (values.type ?? "").trim() || "Enseignant",
    specialty: (values.field0 ?? "").trim(),
    assignments: (values.field1 ?? "").trim(),
    weeklyHours: toNumber(values.field2, 0),
    email: (values.email ?? "").trim().toLowerCase(),
    status,
  });
}

/**
 * Met à jour une fiche SCOLARITÉ existante. Seules les fiches personnel sont
 * modifiables pour l'instant ; les autres renvoient un message explicite.
 */
export async function updateScolariteRow(
  module: ScolariteModule,
  id: string,
  values: Record<string, string>,
) {
  const name = (values.name ?? "").trim();
  if (!name) throw new Error("Le nom est obligatoire.");
  if (module !== "teachers") {
    throw new Error("La modification de cette fiche n'est pas encore disponible.");
  }
  return client.scolarite.updateStaff({
    id,
    name,
    type: (values.type ?? "").trim() || "Enseignant",
    specialty: (values.field0 ?? "").trim(),
    assignments: (values.field1 ?? "").trim(),
    weeklyHours: toNumber(values.field2, 0),
    email: (values.email ?? "").trim().toLowerCase(),
    status: values.status?.trim() || "Actif",
  });
}

/** Retire un collaborateur de l'établissement. */
export async function removeStaff(id: string) {
  return client.scolarite.deleteStaff({ id });
}
