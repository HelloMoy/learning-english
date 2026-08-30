import type { Resource, ResourceKind } from "@/domain/entities/resource/resource";

import { Code, FileText, Paperclip, Presentation } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComponentType, SVGProps } from "react";

const KIND_ICONS: Record<ResourceKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  pdf: FileText,
  slides: Presentation,
  code: Code,
  other: Paperclip,
};

/**
 * A single resource row inside the Resources list. The icon is chosen by
 * `ResourceKind`; the title is the link text; the URL is opened in a new tab
 * so the learner does not navigate away from the lesson.
 */
export function ResourceItem({ resource }: { resource: Resource }) {
  const t = useTranslations("Components.ResourceItem");
  const Icon = KIND_ICONS[resource.kind];
  return (
    <li>
      {/*
        A plain `<a>`, deliberately NOT the locale-aware `Link` from
        `@/i18n/navigation`. A `Resource.url` addresses content — an
        absolute URL, or a site-relative path to a static asset that
        Next.js serves from the origin root — never an in-app route.
        Since `routing.localePrefix` is "always", the locale-aware `Link`
        would rewrite `/local-filesystem-lesson/…` to
        `/en/local-filesystem-lesson/…`, which no route and no `public/`
        file matches: every resource link 404s. Guarded by the e2e case
        "resource links resolve" in `e2e/lesson-page.spec.ts` — the
        prefix is applied during the server render, so jsdom cannot see it.
      */}
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-gold underline underline-offset-2 hover:no-underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0"
        />
        <span>{resource.title}</span>
        <span className="sr-only">({t(resource.kind)})</span>
      </a>
    </li>
  );
}
