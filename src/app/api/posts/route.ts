import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { postCreateSchema } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";
import { auth } from "@/auth";

// GET /api/posts — public feed. Only ever returns PUBLISHED posts here;
// drafts are only visible through /api/dashboard/posts (auth required),
// so there's no path by which a draft leaks to an unauthenticated request.
export async function GET(req: NextRequest) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(20, Number(searchParams.get("limit")) || 10); // hard cap: never let a client request an unbounded page size
  const category = searchParams.get("category");

  const filter: Record<string, unknown> = { status: "PUBLISHED" };
  if (category) filter.category = category;

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("author", "name username")
      .lean(),
    Post.countDocuments(filter),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/posts — create a post. Requires a logged-in session; the
// author is always taken from the server-verified session, NEVER from the
// request body, so nobody can create a post "as" another user by editing
// the JSON payload.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = postCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();
    const slug = await uniqueSlug(parsed.data.title);

    const post = await Post.create({
      ...parsed.data,
      slug,
      author: (session.user as any).id,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : undefined,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error("Create post error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
