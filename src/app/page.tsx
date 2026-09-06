import Link from "next/link";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import { auth } from "@/auth";
import { optimizedImageUrl } from "@/lib/cloudinaryUrl";
import SaveIconButton from "@/components/SaveIconButton";
import LikeIconButton from "@/components/LikeIconButton";

export const dynamic = "force-dynamic";

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

const PAGE_SIZE = 9;

async function getTrendingPosts() {
  await connectDB();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await Post.find({
    status: "PUBLISHED",
    publishedAt: { $gte: sevenDaysAgo },
  })
    .sort({ views: -1 })
    .limit(5)
    .select("title slug views")
    .lean();
  return JSON.parse(JSON.stringify(posts));
}

async function getPosts(category?: string, q?: string, page = 1) {
  await connectDB();
  const filter: Record<string, unknown> = { status: "PUBLISHED" };
  if (category) filter.category = category;
  if (q) {
    const User = (await import("@/models/User")).default;
    const matchingAuthors = await User.find({
      name: { $regex: q, $options: "i" },
    }).select("_id");
    const authorIds = matchingAuthors.map((u: any) => u._id);

    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { excerpt: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } },
      { author: { $in: authorIds } },
    ];
  }

  const [posts, total] = await Promise.all([
    Post.find(filter)
      .sort({ publishedAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .populate("author", "name username")
      .lean(),
    Post.countDocuments(filter),
  ]);

  return {
    posts: JSON.parse(JSON.stringify(posts)),
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
   const { category, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { posts, totalPages } = await getPosts(category, q, page);
  const trending = await getTrendingPosts();

    const session = await auth();
  const currentUserId = (session?.user as any)?.id;
  let myBookmarks = new Set<string>();
  if (currentUserId) {
    await connectDB();
    const me = await User.findById(currentUserId).select("bookmarks").lean();
    myBookmarks = new Set(((me as any)?.bookmarks ?? []).map((id: any) => id.toString()));
  }

  return (
    <div>
      <div className="mb-10 animate-fade-up">
        <h1 className="font-display text-4xl text-ink leading-tight">
          Stories from students, for students.
        </h1>
        <p className="text-ink/60 mt-2">
          Projects, internships, coursework, and everything in between.
        </p>

        <form action="/" method="GET" className="mt-5">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search posts…"
            className="input max-w-md"
          />
        </form>

        <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5 border-b border-rule pb-3">
          <Link
            href="/"
            className={`text-sm pb-1 border-b-2 -mb-3 transition ${
              !category
                ? "border-marker text-ink font-medium"
                : "border-transparent text-ink/50 hover:text-ink/80"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}`}
              className={`text-sm pb-1 border-b-2 -mb-3 transition whitespace-nowrap ${
                category === c
                  ? "border-marker text-ink font-medium"
                  : "border-transparent text-ink/50 hover:text-ink/80"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {trending.length > 0 && !category && !q && page === 1 && (
        <div className="mb-10 border border-rule rounded-md p-4">
          <h2 className="font-display text-lg text-ink mb-3">Trending this week</h2>
          <ul>
            {trending.map((t: any, i: number) => (
              <li key={t._id} className={i > 0 ? "border-t border-rule" : ""}>
                <Link
                  href={`/blog/${t.slug}`}
                  className="flex items-center gap-3 py-2 text-sm group"
                >
                  <span className="text-moss font-medium w-4">{i + 1}</span>
                  <span className="flex-1 text-ink/80 group-hover:text-ink">{t.title}</span>
                  <span className="text-xs text-ink/40">{t.views} views</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
          {posts.length === 0 ? (
        <div className="border border-dashed border-rule rounded-md py-16 text-center text-ink/40">
          {q ? (
            <>No posts found for "{q}". Try a different search.</>
          ) : category ? (
            <>No posts in {category} yet.</>
          ) : (
            <>No posts published yet. Be the first to write one.</>
          )}
        </div>
      ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post: any) => (
            <li key={post._id} className="rounded-lg overflow-hidden bg-paper shadow-sm hover:shadow-md transition-shadow">
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="relative">
                  {post.coverImage ? (
                    <img
                      src={optimizedImageUrl(post.coverImage, { width: 600, height: 400 })}
                      alt=""
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-marker/15 to-moss/15 flex items-center justify-center">
                      <span className="font-display text-3xl text-ink/20">Aa</span>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 text-xs font-medium bg-paper/95 backdrop-blur-sm text-ink/70 px-2.5 py-1 rounded-full">
                    {post.category}
                  </span>

                                    {session?.user && (
                    <>
                      <LikeIconButton
                        postId={post._id}
                        initialLiked={(post.likes ?? []).some((id: string) => id === currentUserId)}
                      />
                      <SaveIconButton
                        postId={post._id}
                        initialBookmarked={myBookmarks.has(post._id.toString())}
                      />
                    </>
                  )}
                </div>

                <div className="pt-4 pb-1">
                  <h2 className="font-display text-xl text-ink group-hover:text-marker-dark transition leading-snug">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-ink/60 mt-1.5 line-clamp-2">{post.excerpt}</p>
                  )}
                  <p className="text-xs text-ink/50 mt-3">
                    {post.author?.name ?? "Unknown"} ·{" "}
                    {Math.max(1, Math.round((post.content?.trim().split(/\s+/).length || 0) / 200))} min read
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
                

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          {page > 1 ? (
            <Link
              href={`/?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(q ? { q } : {}),
                page: String(page - 1),
              }).toString()}`}
              className="text-sm text-marker-dark hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-ink/40">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={`/?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(q ? { q } : {}),
                page: String(page + 1),
              }).toString()}`}
              className="text-sm text-marker-dark hover:underline"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}