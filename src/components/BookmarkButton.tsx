"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function BookmarkButton({
  postId,
  initialBookmarked,
}: {
  postId: string;
  initialBookmarked: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (busy) return;

    setBusy(true);
    setBookmarked((b) => !b);

    const res = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
    setBusy(false);

    if (res.ok) {
      const data = await res.json();
      setBookmarked(data.bookmarked);
      router.refresh();
    } else {
      setBookmarked((b) => !b);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition ${
        bookmarked
          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
          : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
      }`}
    >
      <span>{bookmarked ? "🔖" : "📑"}</span>
      <span>{bookmarked ? "Saved" : "Save"}</span>
    </button>
  );
}