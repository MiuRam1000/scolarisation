import { client } from "./api";

export type LessonsSnapshot = Awaited<ReturnType<typeof client.lessons.snapshot>>;
export type Lesson = LessonsSnapshot["lessons"][number];
export type LessonStatus = Lesson["status"];

export const LESSON_STATUSES: LessonStatus[] = ["Planifié", "Réalisé", "Annulé"];

export type LessonInput = {
  classId: string;
  subjectId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  content: string;
  homework: string;
  status: LessonStatus;
};

export async function createLesson(values: LessonInput) {
  return client.lessons.create(values);
}

export async function updateLesson(values: LessonInput & { id: string }) {
  return client.lessons.update(values);
}

export async function removeLesson(id: string) {
  return client.lessons.remove({ id });
}
