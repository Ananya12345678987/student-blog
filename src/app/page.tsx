import Link from "next/link";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
// import User from "@/models/User";
import UserAvatar from "@/components/UserAvatar";

export const dynamic = "force-dynamic"; // always show latest posts, not a stale build-time snapshot

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

  const PAGE_SIZE = 5;

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
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { excerpt: { $regex: q, $options: "i" } },
      { content: { $regex: q, $options: "i" } },
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

  return (
    <div>

      {trending.length > 0 && !category && !q && page === 1 && (
        <div className="mb-10 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-indigo-900 mb-3">🔥 Trending this week</h2>
          <ul className="space-y-2">
            {trending.map((t: any, i: number) => (
              <li key={t._id}>
                <Link
                  href={`/blog/${t.slug}`}
                  className="text-sm text-indigo-800 hover:underline flex items-center gap-2"
                >
                  <span className="text-indigo-400 font-medium">{i + 1}.</span>
                  <span className="flex-1">{t.title}</span>
                  <span className="text-xs text-indigo-400">{t.views} views</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

            <div className="mb-8">
        <h1 className="text-3xl font-semibold text-indigo-950 tracking-tight">
          Stories from students, for students.
        </h1>
        <p className="text-neutral-500 mt-1">Projects, internships, coursework, and everything in between.</p>

          <form action="/" method="GET" className="mt-4">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search posts…"
            className="input w-full max-w-md"
          />
        </form>    



        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href="/"
            className={`text-xs px-3 py-1.5 rounded-full border ${
              !category
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
            }`}
          >
            All
          </Link>
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}`}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                category === c
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="border border-dashed border-neutral-300 rounded-lg py-16 text-center text-neutral-400">
          No posts published yet. Be the first to write one.
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post: any) => (
                       <li key={post._id} className="border-b border-neutral-200 pb-6">
              <Link href={`/blog/${post.slug}`} className="group">
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt=""
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                )}
                <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-indigo-700">
                  {post.title}
                </h2>
                {post.excerpt && <p className="text-neutral-500 mt-1">{post.excerpt}</p>}
              </Link>
                              <p className="text-sm text-neutral-400 mt-2">
              {post.author?.username ? (
                <Link href={`/profile/${post.author.username}`} className="hover:text-indigo-700 hover:underline">
                  {post.author.name}
                </Link>
              ) : (
                "Unknown"
              )}{" "}
              · {post.category} · {Math.max(1, Math.round((post.content?.trim().split(/\s+/).length || 0) / 200))} min read
</p>
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
              className="text-sm text-indigo-700 hover:underline"
            >
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          <span className="text-sm text-neutral-400">
            Page {page} of {totalPages}
          </span>

          {page < totalPages ? (
            <Link
              href={`/?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(q ? { q } : {}),
                page: String(page + 1),
              }).toString()}`}
              className="text-sm text-indigo-700 hover:underline"
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
  
