import { client } from "./api";

export type CommunicationSnapshot = Awaited<
  ReturnType<typeof client.communication.snapshot>
>;
export type Announcement = CommunicationSnapshot["announcements"][number];

export async function createAnnouncement(values: {
  title: string;
  body: string;
  audience: string;
  classId?: string;
}) {
  return client.communication.create({
    title: values.title,
    body: values.body,
    audience: values.audience as
      | "Tous"
      | "Parents"
      | "Élèves"
      | "Enseignants"
      | "Personnel"
      | "Classe",
    classId: values.classId ?? "",
  });
}

export async function publishAnnouncement(id: string) {
  return client.communication.publish({ id });
}

export async function archiveAnnouncement(id: string) {
  return client.communication.archive({ id });
}
