import {
  JSX,
  ReflectionKind,
  type DeclarationReflection,
  type ProjectReflection,
  type Reflection,
} from "typedoc";

import {
  countModulesInLayer,
  displayModuleName,
  folderOf,
  groupModulesByFolder,
  HEXAGON_LAYERS,
  ROOT_FOLDER,
  type HexagonLayer,
  type ModuleGroup,
} from "./module-index.mts";

/**
 * The slice of TypeDoc's render context the home page needs.
 */
export type HomeContext = {
  urlTo: (reflection: Reflection) => string | undefined;
  commentShortSummary: (reflection: Reflection) => JSX.Element | undefined;
};

const h = JSX.createElement;

const SUMMARY_PREFERENCE = [
  ReflectionKind.Function | ReflectionKind.Class,
  ReflectionKind.Variable | ReflectionKind.Enum,
];

/**
 * The reference's home page: a marquee, one poster per hexagon layer, and
 * every documented module grouped by folder.
 *
 * @param context - Resolves module URLs and renders comment summaries.
 * @param project - The converted project the reference documents.
 */
export function cinemaHome(context: HomeContext, project: ProjectReflection): JSX.Element {
  const modules = project.getChildrenByKind(ReflectionKind.Module);
  return h(
    "div",
    { class: "cinema-home" },
    marquee(project, modules.length),
    layerPosters(modules),
    moduleIndex(context, groupModulesByFolder(modules)),
  );
}

function marquee(project: ProjectReflection, moduleCount: number): JSX.Element {
  return h(
    "section",
    { class: "cinema-marquee", "aria-labelledby": "cinema-home-title" },
    h("p", { class: "cinema-eyebrow" }, `Now showing · ${project.name}`),
    h(
      "h1",
      { id: "cinema-home-title" },
      "The ",
      h("em", null, "API reference"),
      " for English Course.",
    ),
    h(
      "p",
      { class: "cinema-lede" },
      "Every exported contract that carries JSDoc: the domain's ports and use cases, the adapters behind them, and the hooks, utilities and components the app is built from.",
    ),
    h(
      "div",
      { class: "cinema-badges" },
      project.packageVersion && badge(`v${project.packageVersion}`, "gold"),
      badge(`${moduleCount} modules`, "neutral"),
      badge("Hexagonal · Ports & Adapters", "neutral"),
    ),
  );
}

function layerPosters(modules: readonly DeclarationReflection[]): JSX.Element {
  return h(
    "section",
    { class: "cinema-section", "aria-labelledby": "cinema-layers-title" },
    sectionHead({
      id: "cinema-layers-title",
      eyebrow: "Browse by layer",
      title: "Start from the hexagon",
      note: "The domain imports nothing but zod and neverthrow. Everything else reaches it through a port.",
    }),
    h(
      "ul",
      { class: "cinema-posters" },
      HEXAGON_LAYERS.map((layer) => layerPoster(layer, countModulesInLayer(modules, layer.folder))),
    ),
  );
}

function layerPoster(layer: HexagonLayer, moduleCount: number): JSX.Element {
  return h(
    "li",
    { class: "cinema-poster" },
    h(
      "div",
      { class: "cinema-poster-art" },
      h("span", { class: "cinema-poster-path" }, `src/${layer.folder}`),
      h(
        "span",
        { class: "cinema-poster-row" },
        h("span", { class: "cinema-poster-count" }, String(moduleCount)),
        playIcon(),
      ),
    ),
    h(
      "div",
      { class: "cinema-poster-meta" },
      h("h3", null, h("a", { href: `#${folderAnchor(layer.folder)}` }, layer.title)),
      h("p", null, layer.blurb),
    ),
  );
}

function moduleIndex(
  context: HomeContext,
  groups: readonly ModuleGroup<DeclarationReflection>[],
): JSX.Element {
  return h(
    "section",
    { class: "cinema-section", "aria-labelledby": "cinema-modules-title" },
    sectionHead({
      id: "cinema-modules-title",
      eyebrow: "Index",
      title: "All modules",
      note: "Grouped by folder. Paths mirror src/, one folder per entity.",
    }),
    h(
      "div",
      { class: "cinema-index" },
      groups.map((group) => moduleGroup(context, group)),
    ),
  );
}

function moduleGroup(context: HomeContext, group: ModuleGroup<DeclarationReflection>): JSX.Element {
  return h(
    "section",
    { class: "cinema-index-group", id: folderAnchor(group.folder) },
    h(
      "div",
      { class: "cinema-index-group-head" },
      h("h3", { class: "cinema-eyebrow" }, group.folder),
      h("span", { class: "cinema-index-count" }, String(group.modules.length)),
    ),
    h(
      "ul",
      { class: "cinema-index-rows" },
      group.modules.map((module) => moduleRow(context, module)),
    ),
  );
}

function moduleRow(context: HomeContext, module: DeclarationReflection): JSX.Element {
  const documentedExport = representativeExport(module);
  return h(
    "li",
    { class: "cinema-index-row" },
    moduleLink(context, module),
    h(
      "span",
      { class: "cinema-index-summary" },
      documentedExport && context.commentShortSummary(documentedExport),
    ),
    h(
      "span",
      { class: "cinema-index-kinds" },
      exportedKinds(module).map((kind) => badge(kind, "neutral")),
    ),
  );
}

function moduleLink(context: HomeContext, module: DeclarationReflection): JSX.Element {
  const name = displayModuleName(module.name);
  const folder = folderOf(module.name);
  const prefix = folder === ROOT_FOLDER ? "" : `${folder}/`;
  return h(
    "a",
    { class: "cinema-index-name", href: context.urlTo(module) },
    h("span", { class: "cinema-dim" }, prefix),
    name.slice(prefix.length),
  );
}

/**
 * The documented export that best says what a module does: a function or
 * class before a variable or enum, and those before the helper types a
 * module often declares first. Source order breaks ties.
 */
function representativeExport(module: DeclarationReflection): DeclarationReflection | undefined {
  const documented = (module.children ?? []).filter(hasSummary);
  return documented.sort((left, right) => summaryRank(left) - summaryRank(right))[0];
}

function summaryRank(declaration: DeclarationReflection): number {
  const rank = SUMMARY_PREFERENCE.findIndex((kinds) => declaration.kindOf(kinds));
  return rank === -1 ? SUMMARY_PREFERENCE.length : rank;
}

function hasSummary(declaration: DeclarationReflection): boolean {
  const comments = [declaration.comment, ...(declaration.signatures ?? []).map((s) => s.comment)];
  return comments.some((comment) => (comment?.summary.length ?? 0) > 0);
}

function exportedKinds(module: DeclarationReflection): string[] {
  const kinds = (module.children ?? []).map((child) => ReflectionKind.singularString(child.kind));
  return [...new Set(kinds)];
}

function sectionHead(head: { id: string; eyebrow: string; title: string; note: string }) {
  return h(
    "div",
    { class: "cinema-section-head" },
    h(
      "div",
      null,
      h("p", { class: "cinema-eyebrow" }, head.eyebrow),
      h("h2", { id: head.id }, head.title),
    ),
    h("p", null, head.note),
  );
}

function badge(label: string, tone: "gold" | "neutral"): JSX.Element {
  return h("span", { class: `cinema-badge cinema-badge-${tone}` }, label);
}

function playIcon(): JSX.Element {
  return h(
    "span",
    { class: "cinema-play", "aria-hidden": "true" },
    h(
      "svg",
      { width: "12", height: "12", viewBox: "0 0 24 24", fill: "currentColor" },
      h("path", { d: "M7 4v16l13-8z" }),
    ),
  );
}

function folderAnchor(folder: string): string {
  return `folder-${folder.replaceAll("/", "-")}`;
}
