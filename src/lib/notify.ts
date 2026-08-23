import Notification from "@/models/Notification";

export async function createNotification({
  recipientId,
  actorId,
  type,
  postId,
}: {
  recipientId: string;
  actorId: string;
  type: "LIKE" | "COMMENT" | "BOOKMARK"|"FOLLOW";
  postId?: string;
}) {
  // Never notify someone about their own action on their own post
  // (e.g. liking your own post shouldn't create a notification).
  if (recipientId === actorId) return;

   await Notification.create({
    recipient: recipientId,
    actor: actorId,
    type,
    ...(postId ? { post: postId } : {}),
  });
}