import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import MarkdownContent from "@/components/MarkdownContent";
import CommentSection from "@/components/CommentSection";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import BookmarkButton from "@/components/BookmarkButton";
import ReportButton from "@/components/ReportButton";
import { auth } from "@/auth";
import { connectDB as connectDB2 } from "@/lib/db";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const post = await Post.findOne({ slug, status: "PUBLISHED" })
    .select("title excerpt coverImage")
    .lean();

  if (!post) return { title: "Post not found — StudentBlog" };

  const p = post as any;
  return {
    title: `${p.title} — StudentBlog`,
    description: p.excerpt || "A story from StudentBlog.",
    openGraph: {
      title: p.title,
      description: p.excerpt || "A story from StudentBlog.",
      images: p.coverImage ? [p.coverImage] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description: p.excerpt || "A story from StudentBlog.",
      images: p.coverImage ? [p.coverImage] : [],
    },
  };
}

async function getRelatedPosts(category: string, excludeId: string) {
  await connectDB();
  const posts = await Post.find({
    status: "PUBLISHED",
    category,
    _id: { $ne: excludeId },
  })
    .sort({ publishedAt: -1 })
    .limit(3)
    .select("title slug excerpt")
    .lean();
  return JSON.parse(JSON.stringify(posts));
}

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

  const wordCount = post.content.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200)); // ~200 wpm average

    const session = await auth();
  const currentUserId = (session?.user as any)?.id;
  const initiallyLiked = currentUserId
    ? (post.likes ?? []).some((id: string) => id === currentUserId)
    : false;

    let initiallyBookmarked = false;
  if (currentUserId) {
    await connectDB2();
    const currentUser = await User.findById(currentUserId).select("bookmarks").lean();
    initiallyBookmarked = !!(currentUser as any)?.bookmarks?.some(
      (id: any) => id.toString() === post._id
    );
  }

  const relatedPosts = await getRelatedPosts(post.category, post._id);


  return (
    <article>
      <p className="text-sm text-indigo-600 font-medium">{post.category}</p>
            <h1 className="text-3xl font-semibold text-neutral-900 mt-1">{post.title}</h1>

      {post.coverImage && (
        <img
          src={post.coverImage}
          alt=""
          className="w-full max-h-96 object-cover rounded-lg mt-4"
        />
      )}
      <p className="text-sm text-neutral-400 mt-2">
  <Link href={`/profile/${post.author?.username}`} className="hover:text-indigo-700 hover:underline">
    {post.author?.name}
  </Link>{" "}
    {post.author?.college ? `· ${post.author.college}` : ""} ·{" "}
  {new Date(post.publishedAt).toLocaleDateString()} · {readTime} min read
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

        <div className="mt-6 flex items-center gap-3">
        <LikeButton
          postId={post._id}
          initialCount={(post.likes ?? []).length}
          initialLiked={initiallyLiked}
        />
        <BookmarkButton postId={post._id} initialBookmarked={initiallyBookmarked} />
        <ReportButton targetType="POST" targetId={post._id} />
      </div>

      <hr className="my-8 border-neutral-200" />

            {relatedPosts.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Related posts</h2>
          <ul className="space-y-4">
            {relatedPosts.map((rp: any) => (
              <li key={rp._id}>
                <Link href={`/blog/${rp.slug}`} className="group">
                  <p className="font-medium text-neutral-900 group-hover:text-indigo-700">
                    {rp.title}
                  </p>
                  {rp.excerpt && <p className="text-sm text-neutral-500">{rp.excerpt}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CommentSection postId={post._id} />
    </article>
  );
}
