import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import UserAvatar from "@/components/UserAvatar";

export const dynamic = "force-dynamic";

async function getProfile(userId: string) {
  await connectDB();

  const user = await User.findById(userId)
    .select("name username avatarSeed bio college role")
    .lean();

  if (!user) return null;

  const posts = await Post.find({
    author: userId,
    status: "PUBLISHED",
  })
    .sort({ publishedAt: -1 })
    .select("title slug excerpt category publishedAt")
    .lean();

  return {
    user: JSON.parse(JSON.stringify(user)),
    posts: JSON.parse(JSON.stringify(posts)),
  };
}

export default async function ProfilePage() {
  const session = await auth();

  // User must be logged in
  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getProfile(session.user.id);

  if (!profile) {
    redirect("/");
  }

  const { user, posts } = profile;

  return (
    <div className="space-y-10">
      {/* Profile header */}
      <section className="text-center">
        <UserAvatar
          seed={user.avatarSeed || user.username}
          size={120}
        />

        <h1 className="text-2xl font-semibold text-indigo-950 mt-4">
          {user.name}
        </h1>

        <p className="text-neutral-500 mt-1">
          @{user.username}
        </p>

        {user.college && (
          <p className="text-sm text-neutral-500 mt-2">
            {user.college}
          </p>
        )}

        {user.bio && (
          <p className="max-w-xl mx-auto text-neutral-600 mt-4">
            {user.bio}
          </p>
        )}

        <div className="mt-5">
          <Link
            href="/profile/edit"
            className="inline-block rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700"
          >
            Edit Profile
          </Link>
        </div>
      </section>

      {/* Posts */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-indigo-950">
            Your Posts
          </h2>

          <span className="text-sm text-neutral-400">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-lg py-12 text-center">
            <p className="text-neutral-500">
              You haven't published any posts yet.
            </p>

            <Link
              href="/dashboard/posts/new"
              className="inline-block mt-3 text-indigo-600 hover:underline"
            >
              Write your first post
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post: any) => (
              <li
                key={post._id}
                className="border-b border-neutral-200 pb-5"
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group"
                >
                  <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-indigo-700">
                    {post.title}
                  </h3>

                  {post.excerpt && (
                    <p className="text-sm text-neutral-500 mt-1">
                      {post.excerpt}
                    </p>
                  )}
                </Link>

                <p className="text-xs text-neutral-400 mt-2">
                  {post.category} ·{" "}
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}