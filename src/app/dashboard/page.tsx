import Link from "next/link";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import DeletePostButton from "@/components/DeletePostButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth(); // middleware already guarantees this exists, but
  // never assume — re-checking here means this page is safe even if it's
  // ever reached another way (e.g. middleware config changes later).
  if (!session?.user) return null;

  await connectDB();
  const posts = await Post.find({ author: (session.user as any).id })
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-indigo-950">Your posts</h1>
        <Link
          href="/dashboard/posts/new"
          className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700"
        >
          New post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg py-16 text-center text-neutral-400">
          You haven't written anything yet.{" "}
          <Link href="/dashboard/posts/new" className="text-indigo-700 hover:underline">
            Start your first post
          </Link>
          .
        </div>
      ) : (
        <ul className="divide-y divide-neutral-200">
          {posts.map((post: any) => (
            <li key={post._id} className="py-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">{post.title}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  <span
                    className={
                      post.status === "PUBLISHED"
                        ? "text-emerald-600"
                        : "text-amber-600"
                    }
                  >
                    {post.status}
                  </span>{" "}
                  · Updated {new Date(post.updatedAt).toLocaleDateString()}
                </p>
              </div>
                            <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/posts/${post._id}/edit`}
                  className="text-sm text-indigo-700 hover:underline"
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
