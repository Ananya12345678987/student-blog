"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import MarkdownContent from "@/components/MarkdownContent";

type PostFormValues = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
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
    coverImage: initialValues?.coverImage ?? "",
    category: initialValues?.category ?? "Programming",
    tags: initialValues?.tags ?? "",
  });
      const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<"DRAFT" | "PUBLISHED" | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const inlineFileInputRef = useRef<HTMLInputElement>(null);
  const [contentTab, setContentTab] = useState<"write" | "preview">("write");

  async function uploadFile(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Upload failed.");
      return null;
    }
    return data.url as string;
  }

  async function handleCoverFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;

    setUploadingCover(true);
    const url = await uploadFile(file);
    setUploadingCover(false);

    if (url) setValues((v) => ({ ...v, coverImage: url }));
  }

  async function handleInlineFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingInline(true);
    const url = await uploadFile(file);
    setUploadingInline(false);
    if (!url) return;

    const alt = window.prompt("Short description (for accessibility):", "") || "image";
    const snippet = `\n![${alt}](${url})\n`;

    const textarea = contentRef.current;
    if (!textarea) {
      setValues((v) => ({ ...v, content: v.content + snippet }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = values.content.slice(0, start);
    const after = values.content.slice(end);
    setValues((v) => ({ ...v, content: before + snippet + after }));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + snippet.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }
  
  
  function handleInsertImage() {
    const url = window.prompt("Image URL:");
    if (!url) return;

    const alt = window.prompt("Short description (for accessibility):", "") || "image";
    const snippet = `\n![${alt}](${url})\n`;

    const textarea = contentRef.current;
    if (!textarea) {
      setValues((v) => ({ ...v, content: v.content + snippet }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = values.content.slice(0, start);
    const after = values.content.slice(end);
    const next = before + snippet + after;

    setValues((v) => ({ ...v, content: next }));

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + snippet.length;
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  }

    async function save(status: "DRAFT" | "PUBLISHED") {  
    setError(null);
    setSaving(status);

       const payload = {
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      coverImage: values.coverImage,
      category: values.category,
      tags: values.tags
        .split(/[,\s]+/)
        .map((t) => t.trim().replace(/^#+/, ""))
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

              <div className="flex gap-2">
        <input
          placeholder="Cover image URL (optional)"
          value={values.coverImage}
          onChange={(e) => setValues({ ...values, coverImage: e.target.value })}
          className="input flex-1"
          maxLength={500}
        />
        <input
          ref={coverFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => coverFileInputRef.current?.click()}
          disabled={uploadingCover}
          className="rounded-md border border-neutral-300 px-3 text-sm hover:bg-neutral-50 disabled:opacity-50 whitespace-nowrap"
        >
          {uploadingCover ? "Uploading…" : "Upload from computer"}
        </button>
      </div>

      {values.coverImage && (    
        <img
          src={values.coverImage}
          alt="Cover preview"
          className="w-full max-h-64 object-cover rounded-lg border border-neutral-200"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}

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

            <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">Content</span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleInsertImage}
            className="text-xs text-indigo-700 hover:underline"
          >
            + Insert image (URL)
          </button>
          <input
            ref={inlineFileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInlineFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inlineFileInputRef.current?.click()}
            disabled={uploadingInline}
            className="text-xs text-indigo-700 hover:underline disabled:opacity-50"
          >
            {uploadingInline ? "Uploading…" : "+ Upload from computer"}
          </button>
        </div>
      </div>      

                <div className="flex gap-1 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setContentTab("write")}
          className={`px-3 py-1.5 text-sm border-b-2 -mb-px ${
            contentTab === "write"
              ? "border-indigo-600 text-indigo-700 font-medium"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setContentTab("preview")}
          className={`px-3 py-1.5 text-sm border-b-2 -mb-px ${
            contentTab === "preview"
              ? "border-indigo-600 text-indigo-700 font-medium"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Preview
        </button>
      </div>

      {contentTab === "write" ? (
        <textarea
          ref={contentRef}
          placeholder="Write your post in Markdown…"
          value={values.content}
          onChange={(e) => setValues({ ...values, content: e.target.value })}
          className="input min-h-[300px] font-mono text-sm"
          required
        />
      ) : (
        <div className="min-h-[300px] border border-neutral-200 rounded-lg px-4 py-3">
          {values.content.trim() ? (
            <MarkdownContent content={values.content} />
          ) : (
            <p className="text-neutral-400 text-sm">Nothing to preview yet.</p>
          )}
        </div>
      )}

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
