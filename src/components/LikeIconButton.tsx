"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LikeIconButton({
  postId,
  initialLiked,
}: {
  postId: string;
  initialLiked: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
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
    setLiked((l) => !l);

    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    setBusy(false);

    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
    } else {
      setLiked((l) => !l);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-label={liked ? "Unlike" : "Like"}
      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-paper/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-paper transition"
>
      <span className={liked ? "text-pen-red" : "text-ink/60"}>
        {liked ? "♥" : "♡"}
      </span>
    </button>
  );
}