import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import DeletePostButton from "@/components/DeletePostButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session?.user) redirect("/login");
  if (role !== "ADMIN") redirect("/dashboard");

  await connectDB();
  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .populate("author", "name username")
    .lean();

  return (
    <div>
            <h1 className="font-display text-3xl text-ink mb-1">
        Admin — All posts
      </h1>
      <p className="text-sm text-ink/50 mb-6 border-b border-rule pb-4">
        {posts.length} total post{posts.length === 1 ? "" : "s"} across all users.
      </p>

      <ul className="divide-y divide-rule">
        {posts.map((post: any) => (
          <li key={post._id} className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">{post.title}</p>
              <p className="text-xs text-ink/40 mt-0.5">
                by {post.author?.name ?? "Unknown"} (@{post.author?.username ?? "?"}) ·{" "}
                <span
                  className={
                    post.status === "PUBLISHED" ? "text-moss" : "text-marker-dark"
                  }
                >
                  {post.status}
                </span>{" "}
                · {post.views} views
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
              
              <DeletePostButton
                postId={post._id.toString()}
                postTitle={post.title}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}