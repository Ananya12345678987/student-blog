import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = (session.user as any).id;

  await Notification.updateMany(
    { recipient: userId, read: false },
    { $set: { read: true } }
  );

  return NextResponse.json({ success: true });
}