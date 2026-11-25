import { client } from "./api";

export type PlanningSnapshot = Awaited<ReturnType<typeof client.planning.snapshot>>;
export type TimeSlotView = PlanningSnapshot["slots"][number];
export type TimetableEntryView = PlanningSnapshot["entries"][number];
export type PlanningConflict = PlanningSnapshot["conflicts"][number];

export async function createTimeSlot(values: {
  name?: string;
  dayOfWeek: number;
  startsAt: string;
  endsAt: string;
  kind: "Cours" | "Pause";
}) {
  return client.planning.createSlot({
    name: values.name ?? "",
    dayOfWeek: values.dayOfWeek,
    startsAt: values.startsAt,
    endsAt: values.endsAt,
    kind: values.kind,
  });
}

export async function createTimetableEntry(values: {
  classId: string;
  subjectId: string;
  slotId: string;
  staffId?: string;
  roomId?: string;
  note?: string;
}) {
  return client.planning.createEntry({
    classId: values.classId,
    subjectId: values.subjectId,
    slotId: values.slotId,
    staffId: values.staffId || undefined,
    roomId: values.roomId || undefined,
    note: values.note ?? "",
  });
}

export async function deleteTimetableEntry(id: string) {
  return client.planning.deleteEntry({ id });
}

export async function generatePlanningProposal(classId: string) {
  return client.planning.generateProposal({ classId });
}

export async function validatePlanning() {
  return client.planning.validateSchedule();
}

export async function publishPlanning() {
  return client.planning.publishSchedule();
}
