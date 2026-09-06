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
    .select("name username avatarSeed avatarStyle bio college role following")
    .lean();

  if (!user) return null;

  const posts = await Post.find({
    author: userId,
    status: "PUBLISHED",
  })
    .sort({ publishedAt: -1 })
    .select("title slug excerpt category publishedAt")
    .lean();

  const followerCount = await User.countDocuments({ following: userId });
  const followingCount = ((user as any).following ?? []).length;

  return {
    user: JSON.parse(JSON.stringify(user)),
    posts: JSON.parse(JSON.stringify(posts)),
    followerCount,
    followingCount,
  };
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getProfile(session.user.id);

  if (!profile) {
    redirect("/");
  }

  const { user, posts, followerCount, followingCount } = profile;

  return (
    <div className="space-y-10">
      <section className="text-center">
        <UserAvatar
          seed={user.avatarSeed || user.username}
          style={user.avatarStyle || "identicon"}
          size={120}
        />

        <h1 className="font-display text-3xl text-ink mt-4">{user.name}</h1>
        <p className="text-ink/50 mt-1">@{user.username}</p>

        {user.college && <p className="text-sm text-ink/50 mt-2">{user.college}</p>}

        {user.bio && (
          <p className="max-w-xl mx-auto text-ink/70 mt-4">{user.bio}</p>
        )}

        <div className="flex justify-center gap-8 mt-6">
          <Link href={`/profile/${user.username}/followers`} className="text-center hover:opacity-70">
            <p className="font-display text-xl text-ink">{followerCount}</p>
            <p className="text-xs text-ink/50">Followers</p>
          </Link>
          <Link href={`/profile/${user.username}/following`} className="text-center hover:opacity-70">
            <p className="font-display text-xl text-ink">{followingCount}</p>
            <p className="text-xs text-ink/50">Following</p>
          </Link>
        </div>

        <div className="mt-6">
          <Link
            href="/profile/edit"
            className="inline-block rounded-md bg-ink text-paper px-4 py-2 text-sm hover:bg-ink/90 transition"
          >
            Edit Profile
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5 border-b border-rule pb-3">
          <h2 className="font-display text-xl text-ink">Your Posts</h2>
          <span className="text-sm text-ink/40">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-rule rounded-md py-12 text-center">
            <p className="text-ink/50">You haven't published any posts yet.</p>
            <Link
              href="/dashboard/posts/new"
              className="inline-block mt-3 text-marker-dark hover:underline"
            >
              Write your first post
            </Link>
          </div>
        ) : (
          <ul>
            {posts.map((post: any, i: number) => (
              <li key={post._id} className={`py-5 ${i > 0 ? "border-t border-rule" : ""}`}>
                <Link href={`/blog/${post.slug}`} className="group">
                  <h3 className="font-display text-lg text-ink group-hover:text-marker-dark transition">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-ink/50 mt-1">{post.excerpt}</p>
                  )}
                </Link>
                <p className="text-xs text-ink/40 mt-2">
                  {post.category} ·{" "}
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}