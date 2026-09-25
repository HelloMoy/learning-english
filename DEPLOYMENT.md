# Deployment

How to take this app to production on Vercel, once. Only the project owner can do these
steps: they create accounts, DNS records and secrets. Do them **in this order**. Each
step produces values that a later step needs.

There is one environment besides local development: **production**. There are no preview
deployments. The published course lives in git, and its videos are YouTube embeds, so no
content bucket is involved. The draft course is hidden in production builds.

Every variable named below is validated at runtime by `src/lib/server-env`. A missing or
malformed one fails with its name. A test keeps this file listing all of them.

## 0. Decide the region and the host

The site is served from **`www.english-course.online`**. The apex domain answers with a 308
redirect to `www`, so every URL you give an external service in the steps below carries
`www`. `https://<your-domain>` always means `https://www.english-course.online`. Google in
particular compares its redirect URI string for string, and the apex form fails.

The domain is registered with GoDaddy, which is also its DNS provider. The account includes no
email forwarding, which is why step 2 needs ImprovMX.

Pick one region and use it twice: the **Turso primary location** and the **Vercel function
region** must be the same, or every request pays a cross-region round trip to the database.
For a Spanish- and Portuguese-speaking audience, a US East region (Turso `aws-us-east-1`,
Vercel `iad1`) or a São Paulo region (Turso `aws-sa-east-1` if offered, Vercel `gru1`) are
the natural candidates.

## 1. Turso: the database

1. Create the database: `turso db create english-course --location <location>`.
2. Get its URL: `turso db show english-course --url`. It starts with `libsql://`.
   → `TURSO_DATABASE_URL`
3. Create a token: `turso db tokens create english-course`.
   → `TURSO_AUTH_TOKEN` (required for any `libsql://` URL)

You don't apply migrations by hand. Every Vercel build runs `vercel-build`
(`drizzle-kit migrate && next build`), so the schema is migrated before the code that needs
it is built.

## 2. Email: Resend sends, ImprovMX receives

### Sending: Resend

1. Add the sending domain in Resend, and add the DNS records it lists (SPF, DKIM, and the
   return-path MX) at your DNS provider. Wait until Resend shows the domain as verified.
2. Create an API key with sending access.
3. Account emails go through Resend's SMTP relay:
   - `SMTP_HOST` = `smtp.resend.com`
   - `SMTP_PORT` = `465`
   - `SMTP_SECURE` = `true`
   - `SMTP_USER` = `resend`
   - `SMTP_PASSWORD` = the API key
   - `EMAIL_FROM` = an address on the verified domain, e.g.
     `English Course <no-reply@english-course.online>`
4. Keep a DMARC record at `_dmarc`. The live one is
   `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`. That
   `rua` is GoDaddy's default mailbox, so the aggregate reports never reach the owner. To read
   them, point `rua` at an address you receive, such as an ImprovMX alias.

### Receiving: ImprovMX

Resend only sends mail. The privacy policy and the terms give `privacy@english-course.online`
as the contact address, and without an MX record on the apex domain every message sent to it
bounces. ImprovMX's free plan forwards it to a real inbox.

1. Add the domain in ImprovMX, and create a `privacy` alias that forwards to the owner's inbox.
2. At your DNS provider, add the two MX records ImprovMX lists on the apex domain:
   `mx1.improvmx.com` and `mx2.improvmx.com`.
3. Do **not** add the SPF record ImprovMX suggests for the apex. It leaves out Amazon SES,
   which Resend sends through, so publishing it would contradict the Resend setup, which
   already passes.
4. From an outside address, send a message to `privacy@` and confirm that it arrives.
5. Optional: to reply as `privacy@`, add it in Gmail under **Send mail as**, using the same
   Resend SMTP relay and API key as above.

## 3. Google: sign-in

1. In Google Cloud Console, open **APIs & Services → Credentials**. Create an **OAuth client ID**
   of type **Web application**.
2. Authorized JavaScript origin: `https://<your-domain>`.
3. Authorized redirect URI: `https://<your-domain>/api/auth/callback/google`.
   → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
4. Fill in the OAuth consent screen: add `english-course.online` as an authorized domain, and
   give the privacy policy and terms URLs (`https://<your-domain>/en/privacy` and
   `https://<your-domain>/en/terms`). Don't publish it yet. Google fetches the privacy URL
   before it publishes, and that page only goes live in step 6.

## 4. Cloudflare Turnstile: bot protection

1. Create a Turnstile widget in **Managed** mode, with both hostnames: `www.english-course.online`
   and `english-course.online`. Don't use Invisible mode: the widget reserves visible space in
   the forms.
   → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public) and `TURNSTILE_SECRET_KEY`

Never ship the always-pass test keys from `.env.example` to production.

## 5. Sentry: error reporting (optional)

Sentry stays off until a DSN is set. Without one, nothing is sent.

1. Create a Next.js project in Sentry.
   → `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (the same DSN, for server and browser)
2. For readable stack traces, create an auth token that can upload source maps.
   → `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`
   Without the token, the build skips the upload and still succeeds.

Do **not** run `npx @sentry/wizard`. The integration already exists: the four `src/instrumentation*.ts`
and `src/sentry.*.config.ts` files, `src/app/global-error.tsx`, and the `withSentryConfig`
wrapper in `next.config.ts`. The wizard overwrites them.

Only errors are reported: there is no tracing and no session replay. Handled failures, such as
an email that could not be sent or a learner write the server refused, are reported with
email addresses and message bodies stripped.

## 6. Vercel: the app

1. Import the repository into Vercel as a Next.js project. Leave the build command at its
   default: Vercel runs `vercel-build` automatically.
2. **Settings → Functions → Function Region**: the region chosen in step 0.
3. **Settings → Environment Variables**, scope **Production**:

   | Variable                         | Value                                                           |
   | -------------------------------- | --------------------------------------------------------------- |
   | `TURSO_DATABASE_URL`             | step 1                                                          |
   | `TURSO_AUTH_TOKEN`               | step 1                                                          |
   | `BETTER_AUTH_SECRET`             | `openssl rand -base64 32` (at least 32 characters, never reuse) |
   | `BETTER_AUTH_URL`                | `https://<your-domain>`                                         |
   | `GOOGLE_CLIENT_ID`               | step 3                                                          |
   | `GOOGLE_CLIENT_SECRET`           | step 3                                                          |
   | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | step 4                                                          |
   | `TURNSTILE_SECRET_KEY`           | step 4                                                          |
   | `SMTP_HOST`                      | step 2                                                          |
   | `SMTP_PORT`                      | step 2                                                          |
   | `SMTP_SECURE`                    | step 2                                                          |
   | `SMTP_USER`                      | step 2                                                          |
   | `SMTP_PASSWORD`                  | step 2                                                          |
   | `EMAIL_FROM`                     | step 2                                                          |
   | `SENTRY_DSN`                     | step 5 (optional)                                               |
   | `NEXT_PUBLIC_SENTRY_DSN`         | step 5 (optional)                                               |
   | `SENTRY_ORG`                     | step 5 (optional)                                               |
   | `SENTRY_PROJECT`                 | step 5 (optional)                                               |
   | `SENTRY_AUTH_TOKEN`              | step 5 (optional)                                               |

   If you load them with the CLI instead, two things differ from the dashboard.
   `vercel env add` refuses a `NEXT_PUBLIC_*` name unless you pass
   `--type config --value <value> --yes`. And a Secret never reads back: `vercel env pull`
   shows it as `[SENSITIVE]`. The check that a secret was stored correctly is the deploy
   itself, because `serverEnv()` names any variable that is missing or malformed.

4. Add both domains: `www.english-course.online` as the primary one, and the apex redirecting
   to it (step 0). Then push to `main` to trigger the first production build.
5. Once `https://<your-domain>/en/privacy` loads, publish the OAuth consent screen from step 3,
   so that it is not left in Testing.
6. Check the deployment: sign up with a real address, confirm that the verification email
   arrives, sign in with Google, and confirm that a message sent to `privacy@` arrives.

Do **not** set `AUTH_RATE_LIMIT` in production. It only exists so that CI can switch off the
auth rate limit, which production builds apply by default, for its end-to-end run.

`NEXT_PUBLIC_SITE_URL` is not needed on Vercel: the site origin falls back to
`VERCEL_PROJECT_PRODUCTION_URL`.

## Rollback

Use Vercel's **Instant Rollback** to the previous deployment. It is safe because migrations
are additive: they only add tables and columns, so the previous build still runs against the
newer schema. Never write a migration that drops or renames something in the same release that
stops using it. Ship the code change first, and the removal in a later release.
