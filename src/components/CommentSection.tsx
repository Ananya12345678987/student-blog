"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Comment = {
  _id: string;
  content: string;
  author: { name: string; username: string };
  createdAt: string;
};

export default function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data);
        setLoading(false);
      });
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);

    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    if (res.ok) {
      const newComment = await res.json();
      // Optimistically show it with the current user's name rather than
      // re-fetching the whole list.
      setComments((prev) => [
        { ...newComment, author: { name: session?.user?.name, username: (session?.user as any)?.username } },
        ...prev,
      ]);
      setText("");
    }
    setPosting(false);
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-neutral-900 mb-4">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>

      {session?.user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Share your thoughts…"
            className="input"
          />
          <button
            type="submit"
            disabled={posting || !text.trim()}
            className="mt-2 rounded-md bg-indigo-600 text-white px-4 py-1.5 text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {posting ? "Posting…" : "Comment"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-neutral-500 mb-6">
          <Link href="/login" className="text-indigo-700 hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-neutral-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-neutral-400">No comments yet.</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c._id} className="border-b border-neutral-100 pb-3">
              {/* content is rendered as plain text (React escapes it by
                  default) — never dangerouslySetInnerHTML — so there is no
                  HTML/script injection path through comments */}
              <p className="text-sm text-neutral-800">{c.content}</p>
              <p className="text-xs text-neutral-400 mt-1">
                {c.author?.name} · {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
