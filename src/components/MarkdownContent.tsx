import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { visit } from "unist-util-visit";

/**
 * Posts are stored as raw markdown (see models/Post.ts). This is the ONLY
 * component that turns that markdown into HTML, and it always runs through
 * rehype-sanitize with an explicit allowlist schema before anything
 * reaches the DOM.
 */
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title"],
    a: ["href", "title"],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

// Turns any #word appearing in plain post text into a link to /tag/word —
// Instagram-style inline hashtags. Only touches actual text nodes (never
// text inside an existing link or inline code), so URLs and code samples
// containing a "#" are left untouched.
function remarkHashtags() {
  return (tree: any) => {
    visit(tree, "text", (node: any, index: number | undefined, parent: any) => {
      if (!parent || index === undefined) return;
      if (parent.type === "link" || parent.type === "linkReference" || parent.type === "inlineCode") {
        return;
      }

      const regex = /#([a-zA-Z0-9_]+)/g;
      const matches = [...node.value.matchAll(regex)];
      if (matches.length === 0) return;

      const newNodes: any[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const tag = match[1];
        const start = match.index ?? 0;
        if (start > lastIndex) {
          newNodes.push({ type: "text", value: node.value.slice(lastIndex, start) });
        }
        newNodes.push({
          type: "link",
          url: `/tag/${encodeURIComponent(tag)}`,
          children: [{ type: "text", value: `#${tag}` }],
        });
        lastIndex = start + match[0].length;
      }

      if (lastIndex < node.value.length) {
        newNodes.push({ type: "text", value: node.value.slice(lastIndex) });
      }

      parent.children.splice(index, 1, ...newNodes);
    });
  };
}

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose prose-neutral max-w-none prose-a:text-indigo-700 prose-headings:text-indigo-950">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkHashtags]}
        rehypePlugins={[[rehypeSanitize, schema]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}