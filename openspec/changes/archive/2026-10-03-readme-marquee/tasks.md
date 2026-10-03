## 1. Guard test

- [x] 1.1 (TDD: test → impl) `src/deployment/readme.test.ts`: the three environment addresses are image links in order (live, develop, docs) and text links in the Environments table; the develop row mentions Vercel sign-in; `create-next-app` is gone — red against the current README
- [x] 1.2 (TDD: test → impl) Same file: every repository-path image exists and has alt text; each button's SVG and alt text contain its link's host
- [x] 1.3 (TDD: test → impl) Same file: every `pnpm <script>` the README names exists in `package.json`; every relative link target exists

## 2. Images

- [x] 2.1 `.github/assets/readme/banner.svg`: wordmark, eyebrow, three-line headline, _ship / sheep_ card, in the Immersion Cinema tokens, with system font stacks and a `<title>`
- [x] 2.2 `.github/assets/readme/button-live.svg`, `button-develop.svg`, `button-docs.svg`: 260 px wide, label plus address, the live one filled gold

## 3. README

- [x] 3.1 Rewrite `README.md`: banner, buttons, badges, _What this is_, _Environments_, _Stack_, _Run it locally_, _How we work_ — turns 1.1–1.3 green

## 4. Verification

- [x] 4.1 Render the README with GitHub's Markdown renderer and screenshot it in a browser at desktop and phone widths, in light and dark; fix what the screenshots show
- [x] 4.2 `pnpm test:run` for `src/deployment/readme.test.ts`, then `pnpm verify`
