import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import UserAvatar from "@/components/UserAvatar";
import FollowButton from "@/components/FollowButton";

export const dynamic = "force-dynamic";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  await connectDB();

  const targetUser = await User.findOne({ username }).select("_id name username").lean();
  if (!targetUser) notFound();

  const followers = await User.find({ following: (targetUser as any)._id })
    .select("name username avatarSeed avatarStyle bio")
    .lean();

  const currentUserId = (session?.user as any)?.id;
  let myFollowing: string[] = [];
  if (currentUserId) {
    const me = await User.findById(currentUserId).select("following").lean();
    myFollowing = ((me as any)?.following ?? []).map((id: any) => id.toString());
  }

  return (
    <div>
      <div className="mb-6">
                  <Link href={`/profile/${username}`} className="text-sm text-marker-dark hover:underline">
          ← Back to profile
        </Link>
        <h1 className="font-display text-3xl text-ink mt-2">
          {(targetUser as any).name}'s Followers
        </h1>
      </div>

      {followers.length === 0 ? (
        <p className="text-ink/40">No followers yet.</p>
      ) : (
                <ul>
          {followers.map((f: any, i: number) => (
            <li key={f._id} className={`flex items-center justify-between gap-3 py-3 ${i > 0 ? "border-t border-rule" : ""}`}>
              <Link
                href={`/profile/${f.username}`}
                className="flex items-center gap-3 hover:bg-ink/5 rounded-md p-2 -m-2 flex-1 min-w-0"
              >
                <UserAvatar
                  seed={f.avatarSeed || f.username}
                  style={f.avatarStyle || "identicon"}
                  size={44}
                />
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{f.name}</p>
                  <p className="text-sm text-ink/50 truncate">@{f.username}</p>
                </div>
              </Link>

              {currentUserId && currentUserId !== f._id.toString() && (
                                <FollowButton
                  username={f.username}
                  initialFollowing={myFollowing.includes(f._id.toString())}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}