import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

export const dynamic = "force-dynamic";

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(req: NextRequest) {
  await connectDB();

  const posts = await Post.find({ status: "PUBLISHED" })
    .sort({ publishedAt: -1 })
    .limit(30)
    .populate("author", "name")
    .select("title slug excerpt publishedAt author")
    .lean();

  const origin = req.nextUrl.origin;

  const items = posts
    .map((post: any) => {
      const url = `${origin}/blog/${post.slug}`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt || "")}</description>
      <author>${escapeXml(post.author?.name || "Unknown")}</author>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>StudentBlog</title>
    <link>${origin}</link>
    <description>Stories from students, for students.</description>
    <language>en</language>${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}