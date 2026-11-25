import { client } from "./api";

export type NotificationsSnapshot = Awaited<ReturnType<typeof client.notifications.snapshot>>;
export type AppNotification = NotificationsSnapshot["notifications"][number];

export async function markNotificationRead(id: string) {
  return client.notifications.markRead({ id });
}

export async function markAllNotificationsRead() {
  return client.notifications.markAllRead({});
}
