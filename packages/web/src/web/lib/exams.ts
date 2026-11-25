import { client } from "./api";

export type ExamsSnapshot = Awaited<ReturnType<typeof client.exams.snapshot>>;
export type Exam = ExamsSnapshot["exams"][number];
export type ExamStatus = Exam["status"];
export type ExamType = Exam["type"];

export const EXAM_STATUSES = ["Brouillon", "Planifié", "En cours", "Terminé", "Archivé"] as const;
export const EXAM_TYPES = ["Examen", "Conseil de classe", "Délibération", "Autre"] as const;

export type ExamInput = {
  title: string;
  type: (typeof EXAM_TYPES)[number];
  classesLabel: string;
  datesLabel: string;
  candidatesCount: number;
  status: (typeof EXAM_STATUSES)[number];
  notes: string;
  periodId: string;
  academicYearId: string;
};

export async function createExam(values: ExamInput) {
  return client.exams.create(values);
}

export async function updateExam(values: ExamInput & { id: string }) {
  return client.exams.update(values);
}

export async function removeExam(id: string) {
  return client.exams.remove({ id });
}
