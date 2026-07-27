import type { Resource } from "@/domain/entities/resource/resource";

import { useTranslations } from "next-intl";

import { ResourceItem } from "../resource-item/resource-item";

/**
 * A flat list of resources for the Lesson Page's right rail. Renders a
 * heading plus one row per resource, or a localized empty-state message
 * when there are none.
 *
 * The default heading lives under `Components.ResourceList.title`. The
 * optional `titleOverride` accepts an already-translated string so the
 * caller can reuse this component for a different section (e.g. the
 * original notes resource) without crossing the i18n namespaces.
 */
export function ResourceList({
  resources,
  titleOverride,
}: {
  resources: Resource[];
  titleOverride?: string;
}) {
  const t = useTranslations("Components.ResourceList");
  const heading = titleOverride ?? t("title");
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
