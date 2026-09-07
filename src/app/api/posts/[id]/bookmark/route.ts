import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const userId = (session.user as any).id;
  const user = await User.findById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const alreadySaved = user.bookmarks.some((b: any) => b.toString() === id);

  if (alreadySaved) {
    user.bookmarks = user.bookmarks.filter((b: any) => b.toString() !== id);
  } else {
    user.bookmarks.push(id as any);
    const post = await Post.findById(id).select("author");
    if (post) {
      await createNotification({
        recipientId: post.author.toString(),
        actorId: userId,
        type: "BOOKMARK",
        postId: id,
      });
    }
  }
  await user.save();

  return NextResponse.json({ bookmarked: !alreadySaved }); 
}