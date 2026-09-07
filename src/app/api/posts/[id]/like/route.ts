import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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
  const post = await Post.findById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as any).id;
    const alreadyLiked = post.likes.some((l: any) => l.toString() === userId);

  if (alreadyLiked) {
    post.likes = post.likes.filter((l: any) => l.toString() !== userId);
  } else {
    post.likes.push(userId);
    await createNotification({
      recipientId: post.author.toString(),
      actorId: userId,
      type: "LIKE",
      postId: post._id.toString(),
    });
  }
  await post.save();

  return NextResponse.json({ liked: !alreadyLiked, count: post.likes.length });
}