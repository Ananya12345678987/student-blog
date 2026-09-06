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
            <h1 className="font-display text-3xl text-ink mb-6 border-b border-rule pb-4">Saved posts</h1>

      {posts.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md py-16 text-center text-ink/40">
          You haven't saved any posts yet.
        </div>
      ) : (
        <ul>
          {posts.map((post: any, i: number) => (
            <li key={post._id} className={`py-5 ${i > 0 ? "border-t border-rule" : ""}`}>
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="font-display text-lg text-ink group-hover:text-marker-dark transition">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-sm text-ink/50 mt-1">{post.excerpt}</p>}
              </Link>
              <p className="text-xs text-ink/40 mt-2">  


                {post.author?.name} · {post.category}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}