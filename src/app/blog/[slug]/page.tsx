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
import { optimizedImageUrl } from "@/lib/cloudinaryUrl";


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
    { slug, status: "PUBLISHED" },
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
  const readTime = Math.max(1, Math.round(wordCount / 200));

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
      <p className="text-sm text-marker-dark font-medium flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-marker" />
        {post.category}
      </p>
      <h1 className="font-display text-4xl text-ink mt-2 leading-tight">{post.title}</h1>

            {post.coverImage && (
        <img
          src={optimizedImageUrl(post.coverImage, { width: 1200 })}
          alt=""
          className="w-full max-h-96 object-cover rounded-md mt-5"
        />
      )}

      <p className="text-sm text-ink/50 mt-4">
        <Link href={`/profile/${post.author?.username}`} className="hover:text-ink transition">
          {post.author?.name}
        </Link>{" "}
        {post.author?.college ? `· ${post.author.college}` : ""} ·{" "}
        {new Date(post.publishedAt).toLocaleDateString()} · {readTime} min read
      </p>

      <div className="mt-8 prose">
        <MarkdownContent content={post.content} />
      </div>

           {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8">
          {post.tags.map((tag: string) => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="text-xs border border-rule text-ink/60 px-2 py-1 rounded-md hover:border-marker hover:text-marker-dark transition"
            >
              #{tag}
            </Link>
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
        {currentUserId !== post.author?._id && (
          <ReportButton targetType="POST" targetId={post._id} />
        )}
      </div>

      <hr className="my-8 border-rule" />

      {relatedPosts.length > 0 && (
        <div className="mb-10">
          <h2 className="font-display text-xl text-ink mb-4">Related posts</h2>
          <ul>
            {relatedPosts.map((rp: any, i: number) => (
              <li key={rp._id} className={i > 0 ? "border-t border-rule" : ""}>
                <Link href={`/blog/${rp.slug}`} className="group block py-3">
                  <p className="font-medium text-ink group-hover:text-marker-dark transition">
                    {rp.title}
                  </p>
                  {rp.excerpt && <p className="text-sm text-ink/50">{rp.excerpt}</p>}
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