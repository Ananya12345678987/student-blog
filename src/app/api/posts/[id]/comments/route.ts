import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { commentCreateSchema } from "@/lib/validation";
import { auth } from "@/auth";
import { createNotification } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await connectDB();
  const comments = await Comment.find({ post: id })
    .sort({ createdAt: -1 })
    .populate("author", "name username")
    .lean();
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = commentCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

    await connectDB();
  // content is stored as plain text (maxlength enforced in schema) and
  // rendered as plain text on the frontend — never dangerouslySetInnerHTML
  // — so there's no HTML/XSS injection path through comments at all.
    const comment = await Comment.create({
    post: id,
    author: (session.user as any).id,
    content: parsed.data.content,
    ...(parsed.data.parentCommentId ? { parentComment: parsed.data.parentCommentId } : {}),
  });

  const post = await Post.findById(id).select("author");
  if (post) {
    await createNotification({
      recipientId: post.author.toString(),
      actorId: (session.user as any).id,
      type: "COMMENT",
      postId: id,
    });
  }

  // Also notify whoever wrote the comment being replied to, if different
  // from the post owner (who was already notified above).
  if (parsed.data.parentCommentId) {
    const parent = await Comment.findById(parsed.data.parentCommentId).select("author");
    if (parent && parent.author.toString() !== (session.user as any).id) {
      await createNotification({
        recipientId: parent.author.toString(),
        actorId: (session.user as any).id,
        type: "COMMENT",
        postId: id,
      });
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
