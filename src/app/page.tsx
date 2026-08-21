import Link from "next/link";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import UserAvatar from "@/components/UserAvatar";

export const dynamic = "force-dynamic"; // always show latest posts, not a stale build-time snapshot

async function getPosts() {
  await connectDB();
  const posts = await Post.find({ status: "PUBLISHED" })
    .sort({ publishedAt: -1 })
    .limit(20)
    .populate("author", "name username")
    .lean();
  return JSON.parse(JSON.stringify(posts));
}

export default async function HomePage() {
  const posts = await getPosts();

  return (
    <div>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-indigo-950 tracking-tight">
          Stories from students, for students.
        </h1>
        <p className="text-neutral-500 mt-1">Projects, internships, coursework, and everything in between.</p>
      </div>

      {posts.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg py-16 text-center text-neutral-400">
          No posts published yet. Be the first to write one.
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post: any) => (
            <li key={post._id} className="border-b border-neutral-200 pb-6">
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-indigo-700">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-neutral-500 mt-1">{post.excerpt}</p>}
              </Link>
              <p className="text-sm text-neutral-400 mt-2">
                {post.author?.name ?? "Unknown"} · {post.category}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
