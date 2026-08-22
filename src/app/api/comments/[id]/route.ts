import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const comment = await Comment.findById(id);
  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Same ownership pattern as post delete: only the comment's author
  // (or an admin) can remove it. Never trust the client to only send
  // delete requests for its own comments.
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (comment.author.toString() !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await comment.deleteOne();
  return NextResponse.json({ success: true });
}