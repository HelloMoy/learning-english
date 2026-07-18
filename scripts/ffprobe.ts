import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Errors thrown by `probeDurationSeconds`. Tagged so callers can distinguish
 * missing-tool from bad-input from parsing failures without string-matching.
 */
export class FfprobeNotFoundError extends Error {
  readonly #tag = "FfprobeNotFoundError";
  constructor(message: string) {
    super(message);
    this.name = "FfprobeNotFoundError";
  }
}

export class FfprobeFailedError extends Error {
  readonly #tag = "FfprobeFailedError";
  constructor(message: string) {
    super(message);
    this.name = "FfprobeFailedError";
  }
}

/**
 * Default ffprobe binary name. Override via the `FFPROBE_PATH` environment
 * variable (or the explicit `binaryPath` argument) when the binary lives
 * somewhere other than `PATH`.
 */
const DEFAULT_BINARY = "ffprobe";

/**
 * Reads `format=duration` from an audio/video file via ffprobe and returns
 * the duration as an integer number of seconds (rounded to the nearest
 * second — the domain's `VideoLesson.durationSeconds` is `int().positive()`).
 *
 * Throws:
 * - `FfprobeNotFoundError` when the binary is not on `PATH` (and `FFPROBE_PATH`
 *   is not set). The message tells the developer to install ffmpeg.
 * - `FfprobeFailedError` when ffprobe exits non-zero (corrupt file, unsupported
 *   codec, etc.) or returns output that does not parse as a positive number.
 */
export async function probeDurationSeconds(
  filePath: string,
  options: { binaryPath?: string } = {},
): Promise<number> {
  const binary = options.binaryPath ?? process.env.FFPROBE_PATH ?? DEFAULT_BINARY;

  let stdout: string;
  try {
    const result = await execFileAsync(
      binary,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        filePath,
      ],
      { timeout: 30_000 },
    );
    stdout = result.stdout;
  } catch (err) {
    if (isExecNotFound(err)) {
      throw new FfprobeNotFoundError(
        `ffprobe not found at "${binary}". Install ffmpeg (brew install ffmpeg on macOS) or set FFPROBE_PATH to the binary's location.`,
      );
    }
    throw new FfprobeFailedError(`ffprobe failed for "${filePath}": ${formatExecError(err)}`);
  }

  const seconds = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new FfprobeFailedError(
      `ffprobe returned an unparseable duration for "${filePath}": ${JSON.stringify(stdout)}`,
    );
  }
  return Math.round(seconds);
}

function isExecNotFound(err: unknown): boolean {
  if (err === null || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  return code === "ENOENT";
}

function formatExecError(err: unknown): string {
  if (err instanceof Error) {
    const stderr = (err as { stderr?: string }).stderr;
    return stderr ? `${err.message}: ${stderr.trim()}` : err.message;
  }
  return String(err);
}
