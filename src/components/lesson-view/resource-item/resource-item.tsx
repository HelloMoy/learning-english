import type { Resource, ResourceKind } from "@/domain/entities/resource/resource";
import { Link } from "@/i18n/navigation";

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
      <Link
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-blue-700 underline hover:no-underline dark:text-blue-300"
      >
        <Icon
          aria-hidden="true"
          className="size-4 shrink-0"
        />
        <span>{resource.title}</span>
        <span className="sr-only">({t(resource.kind)})</span>
      </Link>
    </li>
  );
}
