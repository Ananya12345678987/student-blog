"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FollowButton({
  username,
  initialFollowing,
  initialFollowerCount,
}: {
  username: string;
  initialFollowing: boolean;
  initialFollowerCount: number;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (busy) return;

    setBusy(true);
    const res = await fetch(`/api/users/${username}/follow`, { method: "POST" });
    setBusy(false);

    if (res.ok) {
      const data = await res.json();
      setFollowing(data.following);
      setFollowerCount(data.followerCount);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
          following
            ? "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {following ? "Following" : "Follow"}
      </button>
      <span className="text-sm text-neutral-500">
        {followerCount} {followerCount === 1 ? "follower" : "followers"}
      </span>
    </div>
  );
}