"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ReportButton from "@/components/ReportButton";

type Comment = {
  _id: string;
  content: string;
  author: { _id: string; name: string; username: string };
  createdAt: string;
  parentComment?: string;
};

export default function CommentSection({ postId }: { postId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        setComments(data);
        setLoading(false);
      });
  }, [postId]);

  async function postComment(content: string, parentCommentId?: string) {
    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentCommentId }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments((prev) => [
        {
          ...newComment,
          author: {
            _id: (session?.user as any)?.id,
            name: session?.user?.name,
            username: (session?.user as any)?.username,
          },
        },
        ...prev,
      ]);
    }
    return res.ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    await postComment(text);
    setText("");
    setPosting(false);
  }

  async function handleReplySubmit(parentId: string) {
    if (!replyText.trim()) return;
    setPosting(true);
    const ok = await postComment(replyText, parentId);
    setPosting(false);
    if (ok) {
      setReplyText("");
      setReplyingTo(null);
    }
  }

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;

    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } else {
      alert("Failed to delete comment.");
    }
  }

  const topLevel = comments.filter((c) => !c.parentComment);
  const repliesFor = (parentId: string) =>
    comments.filter((c) => c.parentComment === parentId);

  function renderComment(c: Comment, isReply: boolean) {
    return (
      <div key={c._id} className={isReply ? "ml-8 mt-3" : ""}>
        <p className="text-sm text-ink/80">{c.content}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-ink/40">
            {c.author?.name} · {new Date(c.createdAt).toLocaleDateString()}
          </p>
          <div className="flex items-center gap-3">
            {session?.user && (
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(replyingTo === c._id ? null : c._id);
                  setReplyText("");
                }}
                className="text-xs text-marker-dark hover:underline"
              >
                Reply
              </button>
            )}
            {(session?.user as any)?.id === c.author?._id ? (
              <button
                type="button"
                onClick={() => handleDelete(c._id)}
                className="text-xs text-pen-red hover:underline"
              >
                Delete
              </button>
            ) : (
              <ReportButton targetType="COMMENT" targetId={c._id} />
            )}
          </div>
        </div>

        {replyingTo === c._id && (
          <div className="mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder={`Reply to ${c.author?.name}…`}
              className="input text-sm"
            />
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => handleReplySubmit(c._id)}
                disabled={posting || !replyText.trim()}
                className="rounded-md bg-ink text-paper px-3 py-1 text-xs hover:bg-ink/90 transition disabled:opacity-50"
              >
                {posting ? "Posting…" : "Reply"}
              </button>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-xs text-ink/50 hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {!isReply &&
          repliesFor(c._id).map((reply) => renderComment(reply, true))}
      </div>
    );
  }

  return (
    <section>
      <h2 className="font-display text-xl text-ink mb-4">
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
            className="mt-2 rounded-md bg-ink text-paper px-4 py-1.5 text-sm hover:bg-ink/90 transition disabled:opacity-50"
          >
            {posting ? "Posting…" : "Comment"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-ink/50 mb-6">
          <Link href="/login" className="text-marker-dark hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40">Loading comments…</p>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-ink/40">No comments yet.</p>
      ) : (
        <ul>
          {topLevel.map((c, i) => (
            <li key={c._id} className={`py-3 ${i > 0 ? "border-t border-rule" : ""}`}>
              {renderComment(c, false)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}