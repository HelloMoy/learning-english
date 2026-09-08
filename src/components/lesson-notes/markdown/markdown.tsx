import { createElement, type JSX } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Element styling for a lesson notes body, in Immersion Cinema tokens.
 *
 * @remarks
 * The project does not load `@tailwindcss/typography`, so `prose` class names
 * compile to nothing. Declaring the styling here keeps it with the renderer,
 * lets a component test assert it, and stays in the Cinema palette instead of
 * a generic prose one.
 *
 * @internal
 */
const ELEMENT_CLASS = {
  h1: "mt-8 mb-3 text-2xl leading-tight font-bold text-foreground first:mt-0",
  h2: "mt-7 mb-3 text-xl leading-snug font-bold text-foreground first:mt-0",
  h3: "mt-6 mb-2 text-base leading-snug font-semibold text-gold first:mt-0",
  h4: "mt-5 mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase first:mt-0",
  p: "my-3 leading-relaxed text-foreground/90",
  ul: "my-3 list-disc space-y-1 pl-5 text-foreground/90 marker:text-gold",
  ol: "my-3 list-decimal space-y-1 pl-5 text-foreground/90 marker:text-gold",
  li: "leading-relaxed",
  blockquote: "my-4 border-l-2 border-gold/60 bg-foreground/5 py-2 pr-3 pl-4 text-foreground/80",
  strong: "font-semibold text-foreground",
  em: "italic text-foreground/90",
  code: "rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.9em] text-foreground",
  hr: "my-6 border-border",
  a: "text-practice-blue underline underline-offset-2 hover:opacity-80",
} as const;

type StyledTag = keyof typeof ELEMENT_CLASS;

/** Extra attributes an element needs beyond its class name. */
const EXTRA_PROPS: Partial<Record<StyledTag, Record<string, string>>> = {
  a: { rel: "noopener noreferrer" },
};

type MarkdownElementProps<Tag extends StyledTag> = { node?: unknown } & JSX.IntrinsicElements[Tag];

/**
 * The props react-markdown passes, minus its own mdast `node`.
 *
 * @remarks
 * `node` is not a DOM attribute; letting it through to the element makes React
 * warn about an unknown prop.
 */
function domPropsOf<Tag extends StyledTag>(props: MarkdownElementProps<Tag>) {
  const domProps = { ...props };
  delete domProps.node;
  return domProps;
}

/** A renderer for one Markdown element, carrying its class name. */
function styledElement(tag: StyledTag) {
  return function StyledElement(props: MarkdownElementProps<StyledTag>) {
    return createElement(tag, {
      ...domPropsOf(props),
      ...EXTRA_PROPS[tag],
      className: ELEMENT_CLASS[tag],
    });
  };
}

const components = Object.fromEntries(
  (Object.keys(ELEMENT_CLASS) as StyledTag[]).map((tag) => [tag, styledElement(tag)]),
) as Components;

/**
 * Renders a lesson notes Markdown body with the Immersion Cinema typographic
 * hierarchy.
 *
 * @remarks
 * Typography lives here rather than on the caller: the component owns how a
 * heading, a list or a blockquote looks, so every surface that renders notes
 * gets the same reading experience without repeating class names. Callers only
 * decide layout.
 *
 * The renderer is configured with `remark-gfm` for tables, task lists,
 * autolinks and strikethrough; raw HTML passthrough (`rehype-raw`) is
 * intentionally not enabled, so a hostile Markdown body cannot inject HTML.
 *
 * @example
 * ```tsx
 * <Markdown content={notes.es} />
 * ```
 *
 * @param content - The Markdown body to render
 * @category Components
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
