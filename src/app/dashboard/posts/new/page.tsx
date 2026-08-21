import PostForm from "@/components/PostForm";

export default function NewPostPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-indigo-950 mb-6">Write a new post</h1>
      <PostForm />
    </div>
  );
}
