import { Schema, models, model, Types } from "mongoose";

export interface IPost {
  title: string;
  slug: string;
  excerpt?: string;
  content: string; // raw markdown, sanitized at render time, never trusted as HTML
  coverImage?: string;
  author: Types.ObjectId;
  category?: string;
  tags: string[];
  status: "DRAFT" | "PUBLISHED";
  publishedAt?: Date;
  views: number;
}

const PostSchema = new Schema<IPost>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, maxlength: 300, default: "" },
    // We store markdown, not HTML. Rendering markdown -> HTML happens at
    // display time through a sanitizing pipeline (see src/lib/markdown.ts),
    // so a stored value can never itself be executable HTML/JS.
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, default: "General" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["DRAFT", "PUBLISHED"], default: "DRAFT", index: true },
    publishedAt: { type: Date },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound index: the public feed always queries "published posts, newest
// first" — this index makes that query fast instead of scanning every post.
PostSchema.index({ status: 1, publishedAt: -1 });

export default models.Post || model<IPost>("Post", PostSchema);
