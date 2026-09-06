import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Report from "@/models/Report";
import { reportCreateSchema } from "@/lib/validation";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = reportCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

    await connectDB();

  // Defense in depth: the UI already hides the Report button on your own
  // content, but don't rely on that alone — block it server-side too.
  if (parsed.data.targetType === "POST") {
    const Post = (await import("@/models/Post")).default;
    const post = await Post.findById(parsed.data.targetId).select("author");
    if (post && post.author.toString() === (session.user as any).id) {
      return NextResponse.json(
        { error: "You can't report your own post." },
        { status: 400 }
      );
    }
  } else {
    const Comment = (await import("@/models/Comment")).default;
    const comment = await Comment.findById(parsed.data.targetId).select("author");
    if (comment && comment.author.toString() === (session.user as any).id) {
      return NextResponse.json(
        { error: "You can't report your own comment." },
        { status: 400 }
      );
    }
  }

  await Report.create({
    reporter: (session.user as any).id,
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
  });

  return NextResponse.json({ message: "Report submitted. Thank you." }, { status: 201 });
}