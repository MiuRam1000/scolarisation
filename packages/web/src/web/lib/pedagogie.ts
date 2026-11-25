import { client } from "./api";

export type PedagogieSnapshot = Awaited<ReturnType<typeof client.pedagogie.snapshot>>;
export type EvaluationView = PedagogieSnapshot["evaluations"][number];
export type GradeView = PedagogieSnapshot["grades"][number];
export type ReportCardView = PedagogieSnapshot["reportCards"][number];

export async function createEvaluation(values: {
  classId: string;
  subjectId: string;
  periodId?: string;
  name: string;
  coefficient: number;
  maxScore: number;
  date?: string;
}) {
  return client.pedagogie.createEvaluation({
    classId: values.classId,
    subjectId: values.subjectId,
    periodId: values.periodId || undefined,
    name: values.name,
    coefficient: values.coefficient,
    maxScore: values.maxScore,
    date: values.date ?? "",
  });
}

export async function saveGrades(
  evaluationId: string,
  entries: { studentId: string; score: number | null; comment: string }[],
) {
  return client.pedagogie.saveGrades({ evaluationId, entries });
}

export async function validateEvaluation(id: string) {
  return client.pedagogie.validateEvaluation({ id });
}

export async function generateReportCards(periodId: string, classId: string) {
  return client.pedagogie.generateReportCards({ periodId, classId });
}

export async function validateReportCards(periodId: string, classId: string) {
  return client.pedagogie.validateReportCards({ periodId, classId });
}

export async function publishReportCards(periodId: string, classId: string) {
  return client.pedagogie.publishReportCards({ periodId, classId });
}

export type ReportCardContent = Awaited<ReturnType<typeof client.pedagogie.reportCardContent>>;

export async function fetchReportCardContent(id: string) {
  return client.pedagogie.reportCardContent({ id });
}
