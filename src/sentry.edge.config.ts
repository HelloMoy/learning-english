import { sentryInitOptions } from "@/lib/sentry-init-options/sentry-init-options";

import * as Sentry from "@sentry/nextjs";

// Loaded by instrumentation.ts in the edge runtime; inert without a DSN.
const options = sentryInitOptions(process.env.SENTRY_DSN);
if (options) Sentry.init(options);
