import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

/**
 * Posts are stored as raw markdown (see models/Post.ts). This is the ONLY
 * component that turns that markdown into HTML, and it always runs through
 * rehype-sanitize with an explicit allowlist schema before anything
 * reaches the DOM.
 *
 * Why this matters: a student's post content is exactly the kind of
 * user-generated content the OWASP stored-XSS category warns about. If we
 * rendered raw markdown -> HTML without sanitizing, a post containing
 * `<img src=x onerror="steal-cookies()">` or `[link](javascript:...)`
 * would execute in every reader's browser. Sanitizing here — server-side
 * during render, not just "we'll trust the editor" — closes that off
 * regardless of what actually made it into the database.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    // Allow images or links to keep className/style off the allowlist;
    // strip anything not explicitly listed (event handlers, style, etc.)
    img: ["src", "alt", "title"],
    a: ["href", "title"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"], // blocks javascript: and data: URLs
    src: ["http", "https"],
  },
};

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-a:text-indigo-700 prose-headings:text-indigo-950">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[[rehypeSanitize, schema]]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
