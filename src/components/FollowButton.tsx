"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function FollowButton({
  username,
  initialFollowing,
  onChange,
}: {
  username: string;
  initialFollowing: boolean;
  onChange?: (following: boolean) => void;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
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
      onChange?.(data.following);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition ${
        following
          ? "border border-rule text-ink/70 hover:bg-ink/5"
          : "bg-ink text-paper hover:bg-ink/90"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}