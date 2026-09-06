import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const dynamic = "force-dynamic";

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  await connectDB();
  const posts = await Post.find({ status: "PUBLISHED", tags: decodedTag })
    .sort({ publishedAt: -1 })
    .populate("author", "name username")
    .lean();

  if (posts.length === 0) notFound();

  return (
    <div>
      <p className="text-sm text-marker-dark mb-1">Tag</p>
      <h1 className="font-display text-3xl text-ink mb-6 border-b border-rule pb-4">
        #{decodedTag}
      </h1>

      <ul>
        {posts.map((post: any, i: number) => (
          <li key={post._id} className={`py-5 ${i > 0 ? "border-t border-rule" : ""}`}>
            <Link href={`/blog/${post.slug}`} className="group">
              <h2 className="font-display text-xl text-ink group-hover:text-marker-dark transition">
                {post.title}
              </h2>
              {post.excerpt && <p className="text-ink/60 mt-1">{post.excerpt}</p>}
            </Link>
            <p className="text-sm text-ink/50 mt-2">
              {post.author?.name ?? "Unknown"} · {post.category}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}