# learning-english

A [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

> **First-time setup:** before running anything, install the AI agent skills this repo declares in `skills-lock.json`:
>
> ```bash
> npx skills install
> ```
>
> This populates `.agents/skills/` with the skills the project relies on (shadcn, vercel-react-best-practices, frontend-design, storybook-story-writing, etc.) and is required for AI assistants to follow the conventions documented in `AGENTS.md` and the per-skill `SKILL.md` files.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Component development — Storybook

Storybook runs an isolated dev server for developing and reviewing components in isolation, with a locale switcher (🌐) for testing translations and a theme switcher for light/dark mode.

```bash
pnpm storybook
```

Opens at [http://localhost:6006](http://localhost:6006).

```bash
pnpm build-storybook   # produce a static build (./storybook-static/) for Chromatic or static hosting
```

Storybook conventions and rules for writing stories live in `AGENTS.md § Component development — Storybook`.

## API documentation — TypeDoc

The project's API reference is generated from JSDoc comments using [TypeDoc](https://typedoc.org/). Output is a static site that documents every exported, JSDoc-commented symbol in `src/`.

```bash
pnpm docs          # generate the static site in ./docs/
pnpm docs:watch    # regenerate on file changes
pnpm docs:serve    # serve ./docs/ at http://localhost:8080
```

The generated `./docs/` directory is gitignored — regenerate locally or in CI, never commit. When to add JSDoc and which tags TypeDoc supports are documented in `AGENTS.md § API documentation — TypeDoc`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
