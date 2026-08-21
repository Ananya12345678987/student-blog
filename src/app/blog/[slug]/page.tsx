import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import MarkdownContent from "@/components/MarkdownContent";
import CommentSection from "@/components/CommentSection";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  await connectDB();
  const post = await Post.findOneAndUpdate(
    { slug, status: "PUBLISHED" }, // the status filter here is what prevents a
    // guessed/leaked slug from exposing someone's unpublished draft
    { $inc: { views: 1 } },
    { returnDocument: "after" }

  )
    .populate("author", "name username college")
    .lean();
  return post ? JSON.parse(JSON.stringify(post)) : null;
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <article>
      <p className="text-sm text-indigo-600 font-medium">{post.category}</p>
      <h1 className="text-3xl font-semibold text-neutral-900 mt-1">{post.title}</h1>
      <p className="text-sm text-neutral-400 mt-2">
        {post.author?.name} {post.author?.college ? `· ${post.author.college}` : ""} ·{" "}
        {new Date(post.publishedAt).toLocaleDateString()}
      </p>

      <div className="mt-6">
        <MarkdownContent content={post.content} />
      </div>

      {post.tags?.length > 0 && (
        <div className="flex gap-2 mt-8">
          {post.tags.map((tag: string) => (
            <span key={tag} className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <hr className="my-8 border-neutral-200" />

      <CommentSection postId={post._id} />
    </article>
  );
}
