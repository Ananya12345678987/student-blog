import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "@/components/FollowButton";


export const dynamic = "force-dynamic";

async function getPublicProfile(username: string) {
  await connectDB();

  const user = await User.findOne({ username })
    .select("name username avatarSeed avatarStyle bio college role")
    .lean();

  if (!user) return null;

  const followerCount = await User.countDocuments({ following: (user as any)._id });

  const posts = await Post.find({
    author: (user as any)._id,
    status: "PUBLISHED",
  })
    .sort({ publishedAt: -1 })
    .select("title slug excerpt category publishedAt")
    .lean();

  return {
    user: JSON.parse(JSON.stringify(user)),
    posts: JSON.parse(JSON.stringify(posts)),
    followerCount,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

    const profile = await getPublicProfile(username);
  if (!profile) notFound();

  const { user, posts, followerCount } = profile;
  const isOwnProfile = (session?.user as any)?.username === user.username;

  let isFollowing = false;
  if (!isOwnProfile && session?.user) {
    await connectDB();
    const currentUser = await User.findById((session.user as any).id)
      .select("following")
      .lean();
    isFollowing = !!(currentUser as any)?.following?.some(
      (id: any) => id.toString() === user._id
    );
  }

  return (
    <div className="space-y-10">
      <section className="text-center">
        <UserAvatar
          seed={user.avatarSeed || user.username}
          style={user.avatarStyle || "identicon"}
          size={120}
        />

        <h1 className="text-2xl font-semibold text-indigo-950 mt-4">
          {user.name}
        </h1>

        <p className="text-neutral-500 mt-1">@{user.username}</p>

        {user.college && (
          <p className="text-sm text-neutral-500 mt-2">{user.college}</p>
        )}

        {user.bio && (
          <p className="max-w-xl mx-auto text-neutral-600 mt-4">
            {user.bio}
          </p>
        )}

               <div className="mt-5 flex justify-center">
          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className="inline-block rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700"
            >
              Edit Profile
            </Link>
          ) : (
            <FollowButton
              username={user.username}
              initialFollowing={isFollowing}
              initialFollowerCount={followerCount}
            />
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-indigo-950">
            {isOwnProfile ? "Your Posts" : `${user.name}'s Posts`}
          </h2>

          <span className="text-sm text-neutral-400">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-neutral-300 rounded-lg py-12 text-center">
            <p className="text-neutral-500">
              {isOwnProfile
                ? "You haven't published any posts yet."
                : `${user.name} hasn't published any posts yet.`}
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {posts.map((post: any) => (
              <li key={post._id} className="border-b border-neutral-200 pb-5">
                <Link href={`/blog/${post.slug}`} className="group">
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