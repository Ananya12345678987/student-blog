import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export default async function SavedPostsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const userId = (session.user as any).id;
  const user = await User.findById(userId)
    .populate({
      path: "bookmarks",
      match: { status: "PUBLISHED" },
      select: "title slug excerpt category",
      populate: { path: "author", select: "name username" },
    })
    .lean();

  const posts = user ? JSON.parse(JSON.stringify((user as any).bookmarks ?? [])) : [];
  
  return (
    <div>
      <h1 className="text-2xl font-semibold text-indigo-950 mb-6">Saved posts</h1>

      {posts.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg py-16 text-center text-neutral-400">
          You haven't saved any posts yet.
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post: any) => (
            <li key={post._id} className="border-b border-neutral-200 pb-5">
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-indigo-700">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-sm text-neutral-500 mt-1">{post.excerpt}</p>}
              </Link>
              <p className="text-xs text-neutral-400 mt-2">
                {post.author?.name} · {post.category}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}