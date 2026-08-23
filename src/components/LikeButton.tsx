"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
}: {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (busy) return;

    setBusy(true);
    // Optimistic update — flip immediately, reconcile with the server after
    setLiked((l) => !l);
    setCount((c) => (liked ? c - 1 : c + 1));

    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    setBusy(false);

    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.count);
    } else {
      // Revert on failure
      setLiked((l) => !l);
      setCount((c) => (liked ? c + 1 : c - 1));
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition ${
        liked
          ? "bg-red-50 border-red-200 text-red-600"
          : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
      }`}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}