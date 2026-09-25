import { captureInstallOffer } from "@/lib/install-offer-stash/install-offer-stash";
import { sentryInitOptions } from "@/lib/sentry-init-options/sentry-init-options";

import * as Sentry from "@sentry/nextjs";

// Browser errors; inert without a DSN, so development sends nothing.
const options = sentryInitOptions(process.env.NEXT_PUBLIC_SENTRY_DSN);
if (options) Sentry.init(options);

// Chromium fires `beforeinstallprompt` before the app hydrates and never fires
// it again, so the listener has to exist before React starts. This entry point
// is the earliest hook Next offers. See `captureInstallOffer`.
captureInstallOffer();
