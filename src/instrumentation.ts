import * as Sentry from "@sentry/nextjs";

/** Starts Sentry in whichever server runtime Next.js is booting. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./sentry.server.config");
  if (process.env.NEXT_RUNTIME === "edge") await import("./sentry.edge.config");
}

// Errors thrown by Server Components, route handlers and the proxy.
export const onRequestError = Sentry.captureRequestError;
