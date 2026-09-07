import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notify";

type Params = { params: Promise<{ username: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { username } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const currentUserId = (session.user as any).id;
  const targetUser = await User.findOne({ username });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (targetUser._id.toString() === currentUserId) {
    return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });
  }

  const currentUser = await User.findById(currentUserId);
  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

    const alreadyFollowing = currentUser.following.some(
    (id: any) => id.toString() === targetUser._id.toString()
  );

  if (alreadyFollowing) {
    currentUser.following = currentUser.following.filter(
      (id: any) => id.toString() !== targetUser._id.toString()
    );
  } else {
    currentUser.following.push(targetUser._id);
    await createNotification({
      recipientId: targetUser._id.toString(),
      actorId: currentUserId,
      type: "FOLLOW",
    });
  }
  await currentUser.save();

  const followerCount = await User.countDocuments({ following: targetUser._id });

  return NextResponse.json({ following: !alreadyFollowing, followerCount });
}