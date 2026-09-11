import type { Resource } from "@/domain/entities/resource/resource";

import { useTranslations } from "next-intl";

import { ResourceItem } from "../resource-item/resource-item";

/**
 * A flat list of resources for the Lesson Page's right rail. Renders a
 * heading plus one row per resource, or a localized empty-state message
 * when there are none.
 *
 * The heading lives under `Components.ResourceList.title`. The rail holds
 * exactly one of these cards, so the heading is the component's own — there
 * is no caller-supplied override.
 */
export function ResourceList({ resources }: { resources: Resource[] }) {
  const t = useTranslations("Components.ResourceList");
  const heading = t("title");
  if (resources.length === 0) {
    return (
      <section
        aria-label={heading}
        className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
      >
        <h2 className="mb-2 text-xs font-bold tracking-[0.24em] text-muted-foreground uppercase">
          {heading}
        </h2>
        <p>{t("empty")}</p>
      </section>
    );
  }
  return (
    <section
      aria-label={heading}
      className="rounded-xl border border-border bg-card p-4"
    >
      <h2 className="mb-2 text-xs font-bold tracking-[0.24em] text-muted-foreground uppercase">
        {heading}
      </h2>
      <ul className="space-y-2">
        {resources.map((resource) => (
          <ResourceItem
            key={resource.id}
            resource={resource}
          />
        ))}
      </ul>
    </section>
  );
}
