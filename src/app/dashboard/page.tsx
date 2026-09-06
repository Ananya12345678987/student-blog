import Link from "next/link";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import DeletePostButton from "@/components/DeletePostButton";

export const dynamic = "force-dynamic";

 export default async function DashboardPage() {
  const session = await auth();
 // middleware already guarantees this exists, but
  // never assume — re-checking here means this page is safe even if it's
  // ever reached another way (e.g. middleware config changes later).
  if (!session?.user) return null;

  await connectDB();
  const posts = await Post.find({ author: (session.user as any).id })
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <div>
                <div className="flex items-center justify-between mb-6 border-b border-rule pb-4">
        <h1 className="font-display text-3xl text-ink">Your posts</h1>
        <Link
          href="/dashboard/posts/new"
          className="rounded-md bg-ink text-paper px-3 py-1.5 text-sm hover:bg-ink/90 transition"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md py-16 text-center text-ink/40">
          You haven't written anything yet.{" "}
          <Link href="/dashboard/posts/new" className="text-marker-dark hover:underline">
            Start your first post
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-rule">
          {posts.map((post: any) => (
            <li key={post._id} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">{post.title}</p>
                <p className="text-xs text-ink/40 mt-0.5">
                  <span
                    className={
                      post.status === "PUBLISHED"
                        ? "text-moss"
                        : "text-marker-dark"
                    }
                  >
                    {post.status}
                  </span>{" "}
                  · Updated {new Date(post.updatedAt).toLocaleDateString()}
                </p>
              </div>
                                                  <div className="flex items-center gap-3">
                {post.status === "PUBLISHED" && (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm text-ink/60 hover:text-ink transition"
                  >
                    View
                  </Link>
                )}
                <Link
                  href={`/dashboard/posts/${post._id}/edit`}
                  className="text-sm text-marker-dark hover:underline"
                >
                  Edit
                </Link>
                <DeletePostButton
                  postId={post._id.toString()}
                  postTitle={post.title}
                />
              </div>      
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
