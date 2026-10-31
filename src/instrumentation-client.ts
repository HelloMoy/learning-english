import { captureInstallOffer } from "@/lib/install-offer-stash/install-offer-stash";
import { productAnalyticsOptions } from "@/lib/product-analytics-options/product-analytics-options";
import { startProductAnalytics } from "@/lib/product-analytics/product-analytics";
import { sentryInitOptions } from "@/lib/sentry-init-options/sentry-init-options";

import * as Sentry from "@sentry/nextjs";

// Browser errors; inert without a DSN, so development sends nothing.
const options = sentryInitOptions(process.env.NEXT_PUBLIC_SENTRY_DSN);
if (options) Sentry.init(options);

// Usage data; inert without a project token, so development and CI send
// nothing and show no consent banner.
const analytics = productAnalyticsOptions(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
if (analytics) void startProductAnalytics(analytics);

// Chromium fires `beforeinstallprompt` before the app hydrates and never fires
// it again, so the listener has to exist before React starts. This entry point
// is the earliest hook Next offers. See `captureInstallOffer`.
captureInstallOffer();
