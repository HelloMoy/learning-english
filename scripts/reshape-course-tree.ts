/**
 * Brings an imported course folder to the canonical on-disk shape the seed
 * generator walks: `<content-root>/<course>/<module>/<lesson>/<files>`, notes
 * in `readme.md`, resources beside the media rather than below it.
 *
 * @remarks
 * A one-time migration, not a standing step. Content exported from a course
 * platform arrives in whatever shape that platform used; the generator knows
 * exactly one shape, and widening it would fork every guarantee that hangs off
 * "a content key is the path" — the key existence check, the normalizer, the
 * rename manifest, `verify-content`, `materialize-content-assets`.
 *
 * Safety model, mirroring `normalize-content-disk.ts`:
 *  - Dry-run by default: prints the `old → new` plan and mutates nothing.
 *    `apply: true` performs the moves.
 *  - Plan-driven: a course folder with no {@link CoursePlan} is never touched,
 *    so running this can never disturb a course that is already canonical.
 *  - Idempotent: re-running against a reshaped tree finds nothing to do.
 *  - Collision-guarded: a move onto an existing path throws BEFORE anything in
 *    that directory is mutated.
 *  - Moves with `rename`, never a copy, so a 15 GB tree reshapes in place.
 *
 * Run this BEFORE `normalize-content-disk.ts`: the plan names folders by their
 * raw on-disk names, which normalization would already have rewritten.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
  type Dirent,
} from "node:fs";
import path from "node:path";

/**
 * The longest a first line may be and still be read as a lesson title.
 *
 * @remarks
 * The exported notes open with the lesson's name — except where the author
 * skipped it and began with body text. A title is short; the longest real one
 * in the imported course is 72 characters, while the shortest offending body
 * paragraph is over 200. The gap is wide enough that one number separates them.
 */
const MAX_TITLE_LENGTH = 120;

/**
 * Rewrites an exported `description.md` body as a canonical `readme.md`.
 *
 * @remarks
 * The exported files carry, in order: the lesson's title, the owning module's
 * name, then the Spanish and English bodies. Three variations occur — a leading
 * blank line, a missing title line, and a first line that is body text — so the
 * title is identified rather than assumed.
 *
 * The language bodies are left exactly as written. They mark their boundary
 * three different ways across the course (a blank line, a `-----` rule, and in
 * one lesson not at all), so inserting `## Español` / `## English` markers would
 * mean guessing, and a wrong guess labels Spanish text as English.
 *
 * @param source - Raw contents of the exported notes file
 * @param moduleDisplayName - The owning module's name as the export writes it,
 *   used to recognize and drop the redundant module line
 * @returns The notes as Markdown, with the title promoted to a `#` heading when
 *   one is present
 */
export function toNotesMarkdown(source: string, moduleDisplayName: string): string {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  while (lines.length > 0 && (lines[0] as string).trim().length === 0) lines.shift();

  const first = (lines[0] ?? "").trim();
  if (first.startsWith("#")) return lines.join("\n").trimEnd();
  // The module name where a title belongs means the export skipped the title:
  // the line is redundant either way, so it goes and the body stands alone.
  if (first === moduleDisplayName) return lines.slice(1).join("\n").trim();
  if (first.length > MAX_TITLE_LENGTH) return lines.join("\n").trimEnd();

  const body = lines.slice(1);
  if ((body[0] ?? "").trim() === moduleDisplayName) body.shift();

  const rest = body.join("\n").trim();
  return rest.length > 0 ? `# ${first}\n\n${rest}` : `# ${first}`;
}

/** One move: `from` and `to` are paths relative to the content root. */
export type Move = { from: string; to: string };

/**
 * What one imported course needs done to it.
 *
 * @remarks
 * Written as data rather than as code so the whole migration can be read,
 * reviewed and printed as a dry run before a byte moves.
 */
export type CoursePlan = {
  /** Course folder under the content root, by its raw on-disk name. */
  folder: string;
  /**
   * Module folders whose children are themselves modules. Each child is
   * promoted to a sibling of its parent under the name given here, and the
   * emptied parent — a grouping the domain has no way to represent — goes.
   */
  promotions: ReadonlyArray<{ parent: string; child: string; to: string }>;
  /** Module folders renumbered to make room for the promoted ones. */
  renames: ReadonlyArray<Move>;
  /**
   * Module folders holding a lesson's files directly. The files move into a
   * new lesson folder of the given name, so a module holds lessons only.
   */
  lessonWraps: ReadonlyArray<{ moduleFolder: string; lesson: string }>;
  /** Subfolder inside a lesson whose files belong beside the media. */
  resourcesFolder: string;
  /** Notes filename the export used, adopted as `readme.md`. */
  notesFile: string;
  /** Files to delete wherever they appear under the course. */
  strayFiles: ReadonlyArray<string>;
};

/** The notes filename every canonical course uses. */
const CANONICAL_NOTES_FILE = "readme.md";

export type ReshapeResult = {
  /** Every move performed — or, in a dry run, that would be. Root-relative. */
  moves: Move[];
  /** Notes files rewritten in place, root-relative. */
  rewritten: string[];
  /** Emptied folders and stray files removed, root-relative. */
  removed: string[];
  applied: boolean;
};

/**
 * Reshapes the courses named by `plans` under `rootDir`.
 *
 * @param args - Content root, the plans to apply, and whether to mutate
 * @returns What was moved, rewritten and removed
 * @throws if a move would land on a path that already exists
 */
export function reshapeCourseTree(args: {
  rootDir: string;
  plans: ReadonlyArray<CoursePlan>;
  apply?: boolean;
}): ReshapeResult {
  const { rootDir, plans, apply = false } = args;
  const result: ReshapeResult = { moves: [], rewritten: [], removed: [], applied: apply };

  for (const plan of plans) {
    const courseDir = path.join(rootDir, plan.folder);
    if (!isDirectory(courseDir)) continue;
    reshapeCourse({ rootDir, courseDir, plan, apply }, result);
  }
  return result;
}

/** One course being reshaped, plus the plan that governs it. */
type CourseRun = { rootDir: string; courseDir: string; plan: CoursePlan; apply: boolean };

function reshapeCourse(run: CourseRun, result: ReshapeResult): void {
  removeStrayFiles(run, result);
  // Projected BEFORE anything moves, so a dry run enumerates the same lessons
  // an apply would — including the ones that only exist once the promotions
  // and wraps have landed. A plan that under-reports is not a plan.
  const lessons = planLessons(run);

  promoteNestedModules(run, result);
  renumberModules(run, result);
  wrapLooseLessonFiles(run, result);

  for (const lesson of lessons) {
    const lessonDir = run.apply ? path.join(run.rootDir, lesson.finalRel) : lesson.currentDir;
    hoistResources(run, lesson, lessonDir, result);
    adoptCanonicalNotes(run, lesson, lessonDir, result);
  }
}

/** A module as it is now on disk, and the folder name it ends up under. */
type PlannedModule = { sourceDir: string; sourceFolder: string; finalFolder: string };

/**
 * A lesson's directory as it is now, and the root-relative path it ends up at.
 *
 * @remarks
 * The two differ for the whole of a dry run, and for a wrapped lesson they
 * differ even in the moment before the wrap: its files are still loose in the
 * module folder. Reporting `finalRel` and reading `currentDir` is what lets one
 * pass serve both modes.
 */
type PlannedLesson = { currentDir: string; finalRel: string; moduleFolder: string };

/** Every module of the course, paired with where the plan puts it. */
function planModules(run: CourseRun): PlannedModule[] {
  const { plan, courseDir } = run;
  const promoted = plan.promotions.map(({ parent, child, to }) => ({
    sourceDir: path.join(courseDir, parent, child),
    sourceFolder: child,
    finalFolder: to,
  }));
  const renamed = plan.renames.map(({ from, to }) => ({
    sourceDir: path.join(courseDir, from),
    sourceFolder: from,
    finalFolder: to,
  }));

  const dissolved = new Set(plan.promotions.map((promotion) => promotion.parent));
  const moved = new Set(plan.renames.map((rename) => rename.from));
  const untouched = listDirectories(courseDir)
    .filter((folder) => !dissolved.has(folder) && !moved.has(folder))
    .map((folder) => ({
      sourceDir: path.join(courseDir, folder),
      sourceFolder: folder,
      finalFolder: folder,
    }));

  return [...promoted, ...renamed, ...untouched].filter((entry) => isDirectory(entry.sourceDir));
}

/** Every lesson of the course, paired with where the plan puts it. */
function planLessons(run: CourseRun): PlannedLesson[] {
  const lessons: PlannedLesson[] = [];
  for (const planned of planModules(run)) {
    const moduleRel = `${run.plan.folder}/${planned.finalFolder}`;
    const wrap = run.plan.lessonWraps.find(
      (candidate) => candidate.moduleFolder === planned.sourceFolder,
    );

    if (wrap && listFiles(planned.sourceDir).length > 0) {
      lessons.push({
        currentDir: planned.sourceDir,
        finalRel: `${moduleRel}/${wrap.lesson}`,
        moduleFolder: planned.finalFolder,
      });
      continue;
    }
    for (const lessonFolder of listDirectories(planned.sourceDir)) {
      lessons.push({
        currentDir: path.join(planned.sourceDir, lessonFolder),
        finalRel: `${moduleRel}/${lessonFolder}`,
        moduleFolder: planned.finalFolder,
      });
    }
  }
  return lessons;
}

/** Lifts each planned child module out of its parent, then drops the parent. */
function promoteNestedModules(run: CourseRun, result: ReshapeResult): void {
  for (const { parent, child, to } of run.plan.promotions) {
    const from = path.join(run.courseDir, parent, child);
    if (!isDirectory(from)) continue;
    move(run, from, path.join(run.courseDir, to), result);
  }
  for (const parent of new Set(run.plan.promotions.map((promotion) => promotion.parent))) {
    const parentDir = path.join(run.courseDir, parent);
    if (isDirectory(parentDir) && (!run.apply || isEmpty(parentDir))) {
      removeEmptied(run, parentDir, result);
    }
  }
}

/** Renumbers the modules the promoted ones displace. */
function renumberModules(run: CourseRun, result: ReshapeResult): void {
  for (const { from, to } of run.plan.renames) {
    const fromDir = path.join(run.courseDir, from);
    if (!isDirectory(fromDir)) continue;
    move(run, fromDir, path.join(run.courseDir, to), result);
  }
}

/** Wraps a module's loose files in a lesson folder, so modules hold lessons. */
function wrapLooseLessonFiles(run: CourseRun, result: ReshapeResult): void {
  for (const { moduleFolder, lesson } of run.plan.lessonWraps) {
    const moduleDir = path.join(run.courseDir, moduleFolder);
    const loose = listFiles(moduleDir);
    if (loose.length === 0) continue;

    const lessonDir = path.join(moduleDir, lesson);
    for (const file of loose) {
      move(run, path.join(moduleDir, file), path.join(lessonDir, file), result);
    }
  }
}

/** Moves a lesson's `resources/*` up beside its media and drops the folder. */
function hoistResources(
  run: CourseRun,
  lesson: PlannedLesson,
  lessonDir: string,
  result: ReshapeResult,
): void {
  const resourcesDir = path.join(lessonDir, run.plan.resourcesFolder);
  if (!isDirectory(resourcesDir)) return;

  for (const file of listFiles(resourcesDir)) {
    moveWithin(run, {
      from: path.join(resourcesDir, file),
      to: path.join(lessonDir, file),
      reportedFrom: `${lesson.finalRel}/${run.plan.resourcesFolder}/${file}`,
      reportedTo: `${lesson.finalRel}/${file}`,
      result,
    });
  }
  if (!run.apply || isEmpty(resourcesDir)) {
    result.removed.push(`${lesson.finalRel}/${run.plan.resourcesFolder}`);
    if (run.apply) rmSync(resourcesDir, { recursive: true });
  }
}

/** Adopts the exported notes as `readme.md`, rewriting the body as it goes. */
function adoptCanonicalNotes(
  run: CourseRun,
  lesson: PlannedLesson,
  lessonDir: string,
  result: ReshapeResult,
): void {
  const notesPath = path.join(lessonDir, run.plan.notesFile);
  if (run.plan.notesFile === CANONICAL_NOTES_FILE || !existsSync(notesPath)) return;

  const target = path.join(lessonDir, CANONICAL_NOTES_FILE);
  assertVacant(target);
  result.moves.push({
    from: `${lesson.finalRel}/${run.plan.notesFile}`,
    to: `${lesson.finalRel}/${CANONICAL_NOTES_FILE}`,
  });
  result.rewritten.push(`${lesson.finalRel}/${CANONICAL_NOTES_FILE}`);
  if (!run.apply) return;

  const markdown = toNotesMarkdown(
    readFileSync(notesPath, "utf8"),
    moduleDisplayName(lesson.moduleFolder),
  );
  writeFileSync(target, `${markdown}\n`, "utf8");
  rmSync(notesPath);
}

/**
 * The module's name as the export writes it inside a notes file: the folder
 * name without the numeric prefix the platform added for ordering.
 */
function moduleDisplayName(moduleFolder: string): string {
  return moduleFolder.replace(/^\d+\s+/, "").trim();
}

/** Deletes the export's leftovers — `.DS_Store`, placeholder `index.html`. */
function removeStrayFiles(run: CourseRun, result: ReshapeResult): void {
  const walk = (dir: string): void => {
    for (const name of listAllFiles(dir)) {
      if (!run.plan.strayFiles.includes(name)) continue;
      const abs = path.join(dir, name);
      result.removed.push(toRootRelative(run.rootDir, abs));
      if (run.apply) rmSync(abs);
    }
    for (const child of listDirectories(dir)) walk(path.join(dir, child));
  };
  walk(run.courseDir);
}

function move(run: CourseRun, from: string, to: string, result: ReshapeResult): void {
  assertVacant(to);
  result.moves.push(relativeMove(run.rootDir, from, to));
  if (!run.apply) return;
  mkdirSync(path.dirname(to), { recursive: true });
  renameSync(from, to);
}

/**
 * A move whose reported paths are stated rather than derived, for the phases
 * that act inside a lesson: on disk the lesson may not have reached its final
 * home yet, but the plan must always name where the file ends up.
 */
function moveWithin(
  run: CourseRun,
  args: {
    from: string;
    to: string;
    reportedFrom: string;
    reportedTo: string;
    result: ReshapeResult;
  },
): void {
  assertVacant(args.to);
  args.result.moves.push({ from: args.reportedFrom, to: args.reportedTo });
  if (!run.apply) return;
  renameSync(args.from, args.to);
}

function removeEmptied(run: CourseRun, dir: string, result: ReshapeResult): void {
  result.removed.push(toRootRelative(run.rootDir, dir));
  if (run.apply) rmSync(dir, { recursive: true });
}

/**
 * A move never overwrites. Throwing here, before the `rename`, is what keeps a
 * half-applied directory from ever existing.
 */
function assertVacant(target: string): void {
  if (existsSync(target)) {
    throw new Error(`Refusing to move onto an existing path: ${target}`);
  }
}

function relativeMove(rootDir: string, from: string, to: string): Move {
  return { from: toRootRelative(rootDir, from), to: toRootRelative(rootDir, to) };
}

function toRootRelative(rootDir: string, abs: string): string {
  return path.relative(rootDir, abs).split(path.sep).join("/");
}

function isDirectory(candidate: string): boolean {
  return existsSync(candidate) && statSync(candidate).isDirectory();
}

function isEmpty(dir: string): boolean {
  return readdirSync(dir).length === 0;
}

function listDirectories(dir: string): string[] {
  return namesIn(dir, (entry) => entry.isDirectory());
}

/** Files a walk should act on — dotfiles excluded, as elsewhere in the tooling. */
function listFiles(dir: string): string[] {
  return namesIn(dir, (entry) => entry.isFile() && !entry.name.startsWith("."));
}

/** Every file, dotfiles included — stray-file removal must see `.DS_Store`. */
function listAllFiles(dir: string): string[] {
  return namesIn(dir, (entry) => entry.isFile());
}

function namesIn(dir: string, keep: (entry: Dirent) => boolean): string[] {
  if (!isDirectory(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(keep)
    .map((entry) => entry.name)
    .sort();
}

/**
 * The migration for the imported beginner course.
 *
 * @remarks
 * The export nested `Vowels` and `Consonants` under one grouping folder, left
 * the Introduction lesson's files loose at module level, named its notes
 * `description.md` and kept every PDF under `resources/`. Promoting the two
 * groups to modules pushes the two that followed down a rung, which is why the
 * renames are here: module order comes from the numeric prefix.
 */
export const BASIC_COURSE_PLAN: CoursePlan = {
  folder: "basic-course",
  promotions: [
    { parent: "2 American vowel & consonant sounds", child: "1 Vowels", to: "2 Vowels" },
    { parent: "2 American vowel & consonant sounds", child: "2 Consonants", to: "3 Consonants" },
  ],
  renames: [
    {
      from: "3 Ejercicios para dominar el ritmo en Inglés",
      to: "4 Ejercicios para dominar el ritmo en Inglés",
    },
    { from: "4 Fluidez y Velocidad", to: "5 Fluidez y Velocidad" },
  ],
  lessonWraps: [{ moduleFolder: "1 Introduction", lesson: "1 Introduction" }],
  resourcesFolder: "resources",
  notesFile: "description.md",
  strayFiles: [".DS_Store", "index.html"],
};

/** Every course this script knows how to reshape. */
export const COURSE_PLANS: ReadonlyArray<CoursePlan> = [BASIC_COURSE_PLAN];

// ── CLI ──────────────────────────────────────────────────────────────────

type Args = { source: string; apply: boolean; help: boolean };

function parseArgs(argv: ReadonlyArray<string>): Args {
  let source = "public/local-filesystem-lesson";
  let apply = false;
  let help = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") help = true;
    else if (arg === "--apply") apply = true;
    else if (arg === "--source" && argv[i + 1]) {
      source = argv[i + 1] as string;
      i++;
    }
  }
  return { source, apply, help };
}

const HELP_TEXT = `Usage: tsx scripts/reshape-course-tree.ts [options]

Brings each planned course folder under <source> to the canonical
course/module/lesson layout the seed generator walks. Run BEFORE
scripts/normalize-content-disk.ts.

Options:
  --source <dir>   Content root (default: public/local-filesystem-lesson)
  --apply          Perform the moves. Without this flag, runs in DRY-RUN.
  --help, -h       Show this help
`;

function run(): void {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }
  try {
    const result = reshapeCourseTree({
      rootDir: path.resolve(args.source),
      plans: COURSE_PLANS,
      apply: args.apply,
    });
    if (result.moves.length === 0 && result.removed.length === 0) {
      console.log("[reshape] Nothing to do — every planned course is already canonical.");
      return;
    }
    if (args.apply) {
      console.log(
        `[reshape] Moved ${result.moves.length} entries, rewrote ${result.rewritten.length} notes files, removed ${result.removed.length}.`,
      );
      return;
    }
    console.log(`[reshape] DRY-RUN — ${result.moves.length} entries would move:`);
    for (const { from, to } of result.moves) console.log(`  ${from}  →  ${to}`);
    console.log(`\n[reshape] ${result.rewritten.length} notes files would be rewritten.`);
    console.log(`[reshape] ${result.removed.length} entries would be removed:`);
    for (const removed of result.removed) console.log(`  ${removed}`);
    console.log("\n[reshape] Re-run with --apply to perform these moves.");
  } catch (err) {
    console.error("[reshape] FAILED:", err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith("reshape-course-tree.ts")) {
  run();
}
