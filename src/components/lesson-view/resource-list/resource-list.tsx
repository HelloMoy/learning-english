import type { Resource } from "@/domain/entities/resource/resource";

import { useTranslations } from "next-intl";

import { ResourceItem } from "../resource-item/resource-item";

/**
 * A flat list of resources for the Lesson Page's right rail. Renders a
 * heading plus one row per resource, or a localized empty-state message
 * when there are none.
 */
export function ResourceList({ resources }: { resources: Resource[] }) {
  const t = useTranslations("Components.ResourceList");
  if (resources.length === 0) {
    return (
      <section
        aria-label={t("title")}
        className="rounded border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400"
      >
        <h2 className="mb-2 font-semibold">{t("title")}</h2>
        <p>{t("empty")}</p>
      </section>
    );
  }
  return (
    <section
      aria-label={t("title")}
      className="rounded border border-slate-200 p-4 dark:border-slate-700"
    >
      <h2 className="mb-2 font-semibold">{t("title")}</h2>
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
