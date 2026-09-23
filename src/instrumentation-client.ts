import { sentryInitOptions } from "@/lib/sentry-init-options/sentry-init-options";

import * as Sentry from "@sentry/nextjs";

// Browser errors; inert without a DSN, so development sends nothing.
const options = sentryInitOptions(process.env.NEXT_PUBLIC_SENTRY_DSN);
if (options) Sentry.init(options);
