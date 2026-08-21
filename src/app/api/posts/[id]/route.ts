import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { postUpdateSchema } from "@/lib/validation";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await connectDB();
  const post = await Post.findById(id).populate("author", "name username").lean();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const post = await Post.findById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // THE key authorization check: this is what stops a logged-in user from
  // editing someone else's post just by sending PATCH /api/posts/<their-id>
  // from Postman. The frontend hiding the "Edit" button is not security —
  // this server-side check is. Admins can also moderate any post.
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (post.author.toString() !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = postUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  Object.assign(post, parsed.data);
  if (parsed.data.status === "PUBLISHED" && !post.publishedAt) {
    post.publishedAt = new Date();
  }
  await post.save();

  return NextResponse.json(post);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const post = await Post.findById(id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if (post.author.toString() !== userId && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await post.deleteOne();
  return NextResponse.json({ success: true });
}
