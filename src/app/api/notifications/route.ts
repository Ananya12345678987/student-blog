import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = (session.user as any).id;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("actor", "name username")
      .populate("post", "title slug")
      .lean(),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}