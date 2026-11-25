import { client } from "./api";

export type AttendanceSnapshot = Awaited<
  ReturnType<typeof client.vieScolaire.attendanceSnapshot>
>;
export type AttendanceStudent = AttendanceSnapshot["students"][number];
export type AttendanceSession = NonNullable<AttendanceSnapshot["session"]>;
export type DisciplineSnapshot = Awaited<
  ReturnType<typeof client.vieScolaire.disciplineSnapshot>
>;
export type DisciplineIncident = DisciplineSnapshot["incidents"][number];
export type DisciplineStudent = DisciplineSnapshot["students"][number];

export type AttendanceDraftEntry = {
  status: string;
  minutesLate: number;
  reason: string;
  justification: string;
};

export type AttendanceDraft = Record<string, AttendanceDraftEntry>;

export async function saveAttendance(values: {
  classId: string;
  date: string;
  validate: boolean;
  note?: string;
  records: Array<{
    studentId: string;
    status: string;
    minutesLate: number;
    reason: string;
    justification: string;
  }>;
}) {
  return client.vieScolaire.saveAttendance({
    classId: values.classId,
    date: values.date,
    validate: values.validate,
    note: values.note ?? "",
    records: values.records.map((record) => ({
      studentId: record.studentId,
      status: record.status as
        | "Présent"
        | "Absent"
        | "Retard"
        | "Absence justifiée"
        | "Dispensé",
      minutesLate: record.minutesLate,
      reason: record.reason,
      justification: record.justification,
    })),
  });
}

export async function createDisciplineIncident(values: {
  studentId: string;
  date: string;
  type: string;
  severity: string;
  description: string;
  location?: string;
  responsibleStaffId?: string;
  measures?: string;
  status?: string;
}) {
  return client.vieScolaire.createIncident({
    studentId: values.studentId,
    date: values.date,
    type: values.type as "Observation" | "Avertissement" | "Sanction" | "Incident",
    severity: values.severity as "Faible" | "Moyenne" | "Élevée",
    description: values.description,
    location: values.location ?? "",
    responsibleStaffId: values.responsibleStaffId || undefined,
    measures: values.measures ?? "",
    status: (values.status ?? "Ouvert") as "Ouvert" | "En cours" | "Résolu" | "Archivé",
  });
}

export async function updateDisciplineIncident(values: {
  id: string;
  status: string;
  measures?: string;
}) {
  return client.vieScolaire.updateIncident({
    id: values.id,
    status: values.status as "Ouvert" | "En cours" | "Résolu" | "Archivé",
    measures: values.measures,
  });
}
