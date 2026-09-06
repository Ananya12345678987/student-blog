"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SaveIconButton({
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

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

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
    } else {
      setBookmarked((b) => !b);
    }
  }

  return (
        <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={bookmarked ? "Remove from saved" : "Save for later"}
      className="absolute top-12 right-2 w-8 h-8 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-paper transition"
    >
      <span className={bookmarked ? "text-marker-dark" : "text-ink/60"}>
        {bookmarked ? "🔖" : "📑"}
      </span>
    </button>
  );
}