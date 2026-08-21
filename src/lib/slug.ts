import Post from "@/models/Post";

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/**
 * Appends -2, -3, etc. if the base slug is already taken, so two posts
 * titled "My First Project" don't collide on /blog/my-first-project.
 */
export async function uniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "post";
  let candidate = base;
  let counter = 2;

  while (await Post.exists({ slug: candidate })) {
    candidate = `${base}-${counter}`;
    counter++;
  }

  return candidate;
}
