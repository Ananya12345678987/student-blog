import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import PostForm from "@/components/PostForm";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  await connectDB();
  const post = await Post.findById(id).lean();
  if (!post) notFound();

  // Same ownership rule as the API route (src/app/api/posts/[id]/route.ts)
  // enforced again here: rendering the edit form for someone else's post
  // would leak its (possibly unpublished) content even before any save
  // attempt, so this check has to happen before the page renders, not
  // just when the form submits.
  const userId = (session.user as any).id;
  const role = (session.user as any).role;
  if ((post as any).author.toString() !== userId && role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-indigo-950 mb-6">Edit post</h1>
      <PostForm
        postId={id}
        initialValues={{
          title: (post as any).title,
          excerpt: (post as any).excerpt,
          content: (post as any).content,
          category: (post as any).category,
          tags: ((post as any).tags ?? []).join(", "),
        }}
      />
    </div>
  );
}
