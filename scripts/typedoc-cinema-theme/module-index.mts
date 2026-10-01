/**
 * A ring of the hexagonal architecture the reference's home page opens with.
 */
export type HexagonLayer = {
  /** Module-path prefix the layer's modules live under, e.g. `domain/ports`. */
  folder: string;
  title: string;
  blurb: string;
};

/**
 * A folder of the module index and the modules listed under it.
 */
export type ModuleGroup<T> = {
  folder: string;
  modules: T[];
};

type NamedModule = { name: string };

/** Folder label for modules that sit directly under `src/`. */
export const ROOT_FOLDER = "src";

/** The layers the home page shows as posters, from the domain outwards. */
export const HEXAGON_LAYERS: readonly HexagonLayer[] = [
  {
    folder: "domain/use-cases",
    title: "Use cases",
    blurb: "Factories that take ports and return a ResultAsync.",
  },
  {
    folder: "domain/ports",
    title: "Ports",
    blurb: "The repository, Clock and IdGenerator contracts.",
  },
  {
    folder: "domain/entities",
    title: "Entities",
    blurb: "Course, module, lesson and learner shapes.",
  },
  {
    folder: "adapters",
    title: "Adapters",
    blurb: "Turso, in-memory, local filesystem and SMTP.",
  },
  {
    folder: "hooks",
    title: "Hooks",
    blurb: "Playback, progress, install prompts and forms.",
  },
  {
    folder: "components",
    title: "Components",
    blurb: "Cinema primitives, views and shadcn/ui.",
  },
];

const PATH_SEPARATOR = "/";
const DOMAIN_FOLDER = "domain";

/**
 * Shorten a module path whose file repeats its folder's name, the shape the
 * folder-per-entity rule produces.
 *
 * @example
 * ```ts
 * displayModuleName("lib/format-duration/format-duration"); // "lib/format-duration"
 * ```
 */
export function displayModuleName(name: string): string {
  const segments = name.split(PATH_SEPARATOR);
  const [leaf, folder] = segments.slice(-2).reverse();
  return leaf === folder ? segments.slice(0, -1).join(PATH_SEPARATOR) : name;
}

/**
 * The index folder a module is listed under: its first path segment, or the
 * first two under `domain/`, whose sub-folders are layers of their own.
 */
export function folderOf(name: string): string {
  const segments = name.split(PATH_SEPARATOR);
  if (segments.length === 1) return ROOT_FOLDER;
  const depth = segments[0] === DOMAIN_FOLDER ? 2 : 1;
  return segments.slice(0, depth).join(PATH_SEPARATOR);
}

/**
 * Group modules by {@link folderOf}. Hexagon layers come first, in
 * {@link HEXAGON_LAYERS} order; the other folders follow alphabetically.
 * Modules keep their incoming order within a group.
 */
export function groupModulesByFolder<T extends NamedModule>(
  modules: readonly T[],
): ModuleGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const namedModule of modules) {
    const folder = folderOf(namedModule.name);
    groups.set(folder, [...(groups.get(folder) ?? []), namedModule]);
  }
  return [...groups.keys()]
    .sort(byLayerThenName)
    .map((folder) => ({ folder, modules: groups.get(folder) ?? [] }));
}

/** How many modules live under a layer's folder. */
export function countModulesInLayer(modules: readonly NamedModule[], folder: string): number {
  const prefix = folder + PATH_SEPARATOR;
  return modules.filter((namedModule) => namedModule.name.startsWith(prefix)).length;
}

function byLayerThenName(left: string, right: string): number {
  return layerRank(left) - layerRank(right) || left.localeCompare(right);
}

function layerRank(folder: string): number {
  const rank = HEXAGON_LAYERS.findIndex((layer) => layer.folder === folder);
  return rank === -1 ? HEXAGON_LAYERS.length : rank;
}
