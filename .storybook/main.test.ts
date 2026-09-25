import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Plugin } from "vite";
import { describe, expect, it, vi } from "vitest";

import main from "./main";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));

const REAL_ACTIONS_MODULE = path.resolve(storybookDir, "../src/app/[locale]/actions.ts");
const STUB_MODULE = path.resolve(storybookDir, "actions-stub.ts");

async function resolvedConfig() {
  return main.viteFinal!({}, { configType: "DEVELOPMENT" } as never);
}

describe("the Storybook Vite config", () => {
  it("installs the server-action stubbing plugin ahead of Vite's own resolver", async () => {
    const { plugins } = await resolvedConfig();

    expect((plugins?.[0] as Plugin).name).toBe("storybook:stub-server-actions");
    expect((plugins?.[0] as Plugin).enforce).toBe("pre");
  });

  it("redirects the [locale]/actions server module to its browser-safe stub", async () => {
    const { plugins } = await resolvedConfig();
    const plugin = plugins?.[0] as Plugin;
    const context = { resolve: vi.fn().mockResolvedValue({ id: REAL_ACTIONS_MODULE }) };

    const redirected = await (
      plugin.resolveId as (this: unknown, ...args: unknown[]) => Promise<string | null>
    ).call(context, "./actions", `${storybookDir}/../src/app/[locale]/x.ts`, {});

    expect(redirected).toBe(STUB_MODULE);
  });

  it("keeps the learner-actions alias ahead of the bare @ alias", async () => {
    const { resolve } = await resolvedConfig();
    const specifiers = Object.keys(resolve?.alias as Record<string, string>);

    expect(specifiers.indexOf("@/app/[locale]/learner-actions")).toBeLessThan(
      specifiers.indexOf("@"),
    );
  });
});

describe("the Storybook main config", () => {
  it("turns off the backgrounds picker, whose swatches would paint over the cinema backdrop", () => {
    expect(main.features?.backgrounds).toBe(false);
  });

  it("collects the workshop's own docs pages from .storybook/docs", () => {
    expect(main.stories).toContain("./docs/*.mdx");
  });
});
