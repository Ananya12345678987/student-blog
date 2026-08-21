import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import { commentCreateSchema } from "@/lib/validation";
import { auth } from "@/auth";

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
  });

  return NextResponse.json(comment, { status: 201 });
}
