import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  a: ({ children, ...rest }) => (
    <a
      {...rest}
      className="text-practice-blue underline underline-offset-2 hover:opacity-80"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};

/**
 * Thin Server Component wrapper around `react-markdown`. The renderer is
 * configured with `remark-gfm` for tables, task lists, autolinks, and
 * strikethrough; raw HTML passthrough (`rehype-raw`) is intentionally
 * not enabled so a hostile Markdown body cannot inject HTML.
 */
export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
