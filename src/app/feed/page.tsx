import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";

export const dynamic = "force-dynamic";

export default async function FollowingFeedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const currentUser = await User.findById((session.user as any).id).select("following").lean();
  const followingIds = (currentUser as any)?.following ?? [];

  const posts = await Post.find({
    status: "PUBLISHED",
    author: { $in: followingIds },
  })
    .sort({ publishedAt: -1 })
    .populate("author", "name username")
    .lean();

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-6 border-b border-rule pb-4">
        Following
      </h1>

      {followingIds.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md py-16 text-center text-ink/40">
          You're not following anyone yet.{" "}
          <Link href="/" className="text-marker-dark hover:underline">
            Browse posts
          </Link>{" "}
          and follow some writers.
        </div>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md py-16 text-center text-ink/40">
          No posts yet from people you follow.
        </div>
      ) : (
        <ul>
          {posts.map((post: any, i: number) => (
            <li key={post._id} className={`py-6 ${i > 0 ? "border-t border-rule" : ""}`}>
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="font-display text-2xl text-ink group-hover:text-marker-dark transition">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-ink/60 mt-1">{post.excerpt}</p>}
              </Link>
              <p className="text-sm text-ink/50 mt-2">
                <Link href={`/profile/${post.author?.username}`} className="hover:text-ink transition">
                  {post.author?.name}
                </Link>{" "}
                · {post.category}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}