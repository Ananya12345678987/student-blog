"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PostFormValues = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string; // comma-separated in the form, split into an array on submit
};

const CATEGORIES = [
  "Programming",
  "Web Development",
  "AI/ML",
  "College Life",
  "Career",
  "Internships",
  "Projects",
  "Study Resources",
  "General",
];

export default function PostForm({
  postId,
  initialValues,
}: {
  postId?: string;
  initialValues?: Partial<PostFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PostFormValues>({
    title: initialValues?.title ?? "",
    excerpt: initialValues?.excerpt ?? "",
    content: initialValues?.content ?? "",
    category: initialValues?.category ?? "Programming",
    tags: initialValues?.tags ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"DRAFT" | "PUBLISHED" | null>(null);

  async function save(status: "DRAFT" | "PUBLISHED") {
    setError(null);
    setSaving(status);

    const payload = {
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      category: values.category,
      tags: values.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status,
    };

    const res = await fetch(postId ? `/api/posts/${postId}` : "/api/posts", {
      method: postId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(null);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <input
        placeholder="Post title"
        value={values.title}
        onChange={(e) => setValues({ ...values, title: e.target.value })}
        className="input text-lg font-medium"
        maxLength={200}
      />

      <input
        placeholder="Short excerpt (shown in the feed)"
        value={values.excerpt}
        onChange={(e) => setValues({ ...values, excerpt: e.target.value })}
        className="input"
        maxLength={300}
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={values.category}
          onChange={(e) => setValues({ ...values, category: e.target.value })}
          className="input"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          placeholder="tags, comma, separated"
          value={values.tags}
          onChange={(e) => setValues({ ...values, tags: e.target.value })}
          className="input"
        />
      </div>

      <textarea
        placeholder="Write in Markdown… (# headings, **bold**, `code`, ![alt](url) images)"
        value={values.content}
        onChange={(e) => setValues({ ...values, content: e.target.value })}
        rows={16}
        className="input font-mono text-sm"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => save("DRAFT")}
          disabled={!!saving}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          {saving === "DRAFT" ? "Saving…" : "Save draft"}
        </button>
        <button
          onClick={() => save("PUBLISHED")}
          disabled={!!saving}
          className="rounded-md bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving === "PUBLISHED" ? "Publishing…" : "Publish"}
        </button>
      </div>
    </div>
  );
}
