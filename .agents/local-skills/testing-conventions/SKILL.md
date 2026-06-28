---
name: testing-conventions
description: Writing conventions for Vitest unit tests, React Testing Library component tests, and Playwright e2e tests in this project. This skill MUST be consulted whenever generating, reviewing, or modifying any test file (`*.test.ts`, `*.test.tsx`, `*.spec.ts`). Triggers on requests mentioning "write a test", "add tests", "cover this", "test this component/function/feature", or any task involving `vitest`, `@testing-library`, `user-event`, `playwright`, or `faker`.
license: MIT
metadata:
  author: learning-english
  version: "0.7.0"
---

# Testing Conventions — Writing Patterns

Conventions for writing tests in this project. Use these patterns when generating or editing test files. They ensure tests are readable, maintainable, and consistent across the codebase.

## Where tests live

| Type                       | Tool                      | Location            |
| -------------------------- | ------------------------- | ------------------- |
| Pure functions / utilities | Vitest                    | `src/**/*.test.ts`  |
| React components           | Vitest + RTL + user-event | `src/**/*.test.tsx` |
| Browser flows              | Playwright                | `e2e/*.spec.ts`     |

Never colocate e2e tests inside `src/`. Never use Playwright for unit or component tests.

## Imports — what to import from where

```ts
// Vitest globals — always import explicitly, never rely on globals config

// @faker-js/faker for arbitrary inputs
import { faker } from "@faker-js/faker";
// @testing-library/react for component rendering & queries
import { render, screen, within } from "@testing-library/react";
// @testing-library/user-event for user interactions — never use fireEvent
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

// The system under test — relative, no alias
import { MyComponent } from "./my-component";
```

For Playwright e2e tests, the imports differ — see the [Playwright e2e tests](#playwright-e2e-tests) section.

**Don't import from `@/` for the unit under test** — use the relative path. Aliases are for cross-cutting imports (`@/lib/...`, `@/components/ui/...`).

**Always use `test`, never `it`.** Vitest exposes both `it` and `test` as aliases (they behave identically), but this project standardizes on `test`. Mixing `it` and `test` in the same codebase makes reviews harder for no benefit.

## Structure — Arrange / Act / Assert with explicit comments

Every test follows the AAA pattern. **Every block is marked with an explicit comment** — no exceptions, even for one-line tests. The full pattern is: outer `describe` (unit under test) → inner `describe("GIVEN <context>")` (precondition) → `test("WHEN <action> THEN <outcome>")` (action + outcome):

```ts
describe("SignupForm", () => {
  describe("GIVEN a user on the signup form", () => {
    test("WHEN the user submits an invalid email THEN an error message is shown", async () => {
      // Arrange
      const user = userEvent.setup();
      const invalidEmail = faker.lorem.word();
      render(<SignupForm />);

      // Act
      await user.type(screen.getByRole("textbox", { name: /email/i }), invalidEmail);
      await user.click(screen.getByRole("button", { name: /submit/i }));

      // Assert
      expect(await screen.findByRole("alert")).toHaveTextContent(/invalid email/i);
    });
  });
});
```

For pure functions the blocks may collapse to one line each, but the comments are still mandatory:

```ts
describe("validateEmail", () => {
  describe("GIVEN a value without @", () => {
    test("WHEN validating THEN returns false", () => {
      // Arrange
      const value = faker.lorem.word();

      // Act
      const result = validateEmail(value);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("GIVEN a valid email", () => {
    test("WHEN validating THEN returns true", () => {
      // Arrange
      const email = faker.internet.email();

      // Act
      const result = validateEmail(email);

      // Assert
      expect(result).toBe(true);
    });
  });
});
```

If a test needs more than one Act step (e.g., several user interactions) they stay under the same `// Act` block. If a test needs multiple Asserts for the same Act, group them under the same `// Assert` block.

## Naming — Gherkin syntax, keywords in UPPERCASE

Every test name follows **Gherkin syntax**: `GIVEN <precondition> WHEN <action> THEN <expected outcome>`. The Gherkin keywords (`GIVEN`, `WHEN`, `THEN`, `AND`, `BUT`) are **always written in UPPERCASE** — they act as visual anchors so the structure of the test is readable at a glance.

```ts
describe("Gherkin naming", () => {
  describe("GIVEN a name that follows the convention (correct examples)", () => {
    test("WHEN the user reads it THEN the Gherkin keywords stand out in UPPERCASE");
    test("WHEN the user reads it THEN the precondition → action → outcome flow is obvious");
    test("WHEN multiple outcomes share a THEN THEN AND chains them naturally");

    // NOT inside the body is allowed — only the Gherkin keywords must be uppercase
    test(
      "WHEN the user clicks a disabled button THEN the form is NOT submitted AND no request is fired",
    );
  });

  describe("GIVEN a name that violates the convention (wrong examples to avoid)", () => {
    // ❌ Wrong — keywords not uppercase
    test(
      "Given a signup form when the user submits an invalid email then an error message is shown",
    );

    // ❌ Wrong — free-form sentence with no Gherkin structure
    test("shows an error when the email is invalid");
  });
});
```

Use `AND` to chain additional outcomes under the same `THEN`. Use `BUT` to express exceptions or negative cases. Uppercase `NOT` inside the body is fine — only the Gherkin keywords must be uppercase.

`describe` blocks follow a **two-level structure**: the outer one names the **unit under test** (function name, component name, or feature name), the inner one sets the **precondition** (the `GIVEN` clause of the nested tests):

```ts
describe("SignupForm", () => {
  describe("GIVEN a user on the signup form", () => {
    test("WHEN the user submits an invalid email THEN an error message is shown", ...);
  });
});

describe("validateEmail", () => {
  describe("GIVEN a valid email", () => {
    test("WHEN validating THEN returns true", ...);
  });
});
```

## Test data — always prefer faker over hardcoded strings

**Whenever faker can produce a value of the right shape, use faker.** Hardcoding strings is the exception, not the default. Random values make tests catch bugs that hand-picked examples miss.

```ts
// ✅ Default — faker for any user-facing string
const name = faker.person.fullName();
const email = faker.internet.email();
const url = faker.image.url();
const description = faker.lorem.sentence();
const word = faker.lorem.word();
```

Hardcode a string **only** when the test verifies behavior tied to the exact form of the input — and even then, prefer the smallest, most targeted literal:

```ts
// ✅ Hardcoded because we test Tailwind class merging — these are domain tokens, not user data
expect(cn("px-2", "px-4")).toBe("px-4");

// ✅ Hardcoded because we test falsy filtering — the literals ARE the system under test
expect(cn(word, false, null, undefined, 0, "")).toBe(word);
```

### Faker seed — only when strictly necessary

**The default is always random data, no seed.** Each test run should generate different values to maximize the chance of catching bugs. Before adding a `faker.seed(N)`, ask yourself: is it really necessary here?

Use `faker.seed(N)` **only** when one of these conditions holds:

- **Debugging a specific failure** — you need to reproduce exactly the value that broke the test to investigate the bug.
- **Snapshot test stability** — the snapshot depends on the exact generated value.
- **The test verifies a property tied to the concrete value** — e.g., asserting that `validateEmail(faker.internet.email())` returns `true` requires the value to contain `@`; in that case use `faker.internet.email()` directly, not `faker.lorem.word()` with a seed.

```ts
// ❌ Wrong — seeding "just in case" defeats the purpose of random data
faker.seed(42);
const name = faker.person.fullName();
render(<Greeting name={name} />);

// ✅ Correct — random by default; no seed
const name = faker.person.fullName();
render(<Greeting name={name} />);

// ✅ Acceptable — seed only when there is a concrete reason (e.g. debugging)
faker.seed(42);
const email = faker.internet.email(); // reproducing a concrete case
```

**Don't copy seeds from other tests or from documentation.** If your test needs a value with a specific shape, find the faker helper that produces that shape directly (`faker.internet.email()`, `faker.string.uuid()`, `faker.lorem.word()`, etc.) instead of seeding and hoping.

## Grouping tests — nested describes for variants

When a unit has multiple scenarios that share setup, nest `describe` blocks. The outer `describe` names the **unit under test**, the inner `describe` sets a context that becomes the `GIVEN` clause of the nested tests:

```ts
describe("formatPrice", () => {
  describe("GIVEN a USD currency", () => {
    test("WHEN formatting an amount THEN the result is prefixed with $", () => {
      // Arrange
      const amount = faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });

      // Act
      const result = formatPrice(amount, "USD");

      // Assert
      expect(result).toMatch(/^\$/);
    });

    test("WHEN formatting an amount THEN the result rounds to two decimals", () => {
      // Arrange
      const amount = faker.number.float({ min: 0, max: 1000, fractionDigits: 4 });

      // Act
      const result = formatPrice(amount, "USD");

      // Assert
      expect(result).toMatch(/^\$\d+\.\d{2}$/);
    });
  });

  describe("GIVEN a EUR currency", () => {
    test("WHEN formatting an amount THEN the result is prefixed with €", () => {
      // Arrange
      const amount = faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });

      // Act
      const result = formatPrice(amount, "EUR");

      // Assert
      expect(result).toMatch(/^€/);
    });

    test("WHEN formatting an amount THEN the result uses comma as decimal separator", () => {
      // Arrange
      const amount = faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });

      // Act
      const result = formatPrice(amount, "EUR");

      // Assert
      expect(result).toMatch(/^€\d+,\d{2}$/);
    });
  });
});
```

Keep nesting to **two levels**. Three or more levels means the unit is doing too much — split it into smaller units.

## Component tests — query priority

Use the **Testing Library query priority** order — the query that most closely reflects how a user (or assistive tech) would find the element:

1. `getByRole("button", { name: /submit/i })` — accessible to everyone
2. `getByLabelText("Email")` — for form fields
3. `getByPlaceholderText("you@example.com")` — only if no label exists
4. `getByText(/welcome/i)` — for non-interactive text
5. `getByDisplayValue("current value")` — for filled-in form values
6. `getByAltText("profile photo")` — for images
7. `getByTitle("close")` — last resort for semantic queries
8. `getByTestId("...")` — only when no other query fits

**Never use `container.querySelector` or class-based selectors.** If you can't find a query that works, the component probably needs better accessibility — fix it.

## Component tests — user interactions

Always use `@testing-library/user-event`, never `fireEvent`:

```ts
describe("Button", () => {
  describe("GIVEN a button with a click handler", () => {
    test("WHEN the user clicks it THEN the click handler is invoked", async () => {
      // Arrange
      const user = userEvent.setup();
      const handler = vi.fn();
      render(<Button onClick={handler}>Click me</Button>);

      // Act
      await user.click(screen.getByRole("button", { name: /click me/i }));

      // Assert
      expect(handler).toHaveBeenCalledOnce();
    });
  });
});
```

Always call `userEvent.setup()` at the start of the test — never reuse the default exported instance across tests.

## Async UI updates — `findBy*` and `waitFor`

Use `findBy*` queries (which return a Promise) for elements that appear **after** an async operation:

```ts
describe("UserProfile", () => {
  describe("GIVEN a user id", () => {
    test("WHEN the profile mounts THEN the user's name is displayed", async () => {
      // Arrange
      const userId = faker.string.uuid();
      render(<UserProfile userId={userId} />);

      // Act
      const greeting = await screen.findByText(/hello,/i);

      // Assert
      expect(greeting).toBeInTheDocument();
    });
  });
});
```

Use `waitFor` only when the assertion isn't tied to an element appearing (e.g., checking that a mock was called):

```ts
describe("EditForm", () => {
  describe("GIVEN a save action", () => {
    test("WHEN the user submits THEN the save handler is called with the form data", async () => {
      // Arrange
      const user = userEvent.setup();
      const name = faker.person.fullName();
      const mockSave = vi.fn();
      render(<EditForm onSave={mockSave} />);

      // Act
      await user.type(screen.getByRole("textbox", { name: /name/i }), name);
      await user.click(screen.getByRole("button", { name: /save/i }));

      // Assert
      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({ name });
      });
    });
  });
});
```

Don't combine `getBy*` with `waitFor` — that's what `findBy*` is for.

## Setup and teardown

Use `beforeEach` for **per-test** setup, `beforeAll` for **once-per-suite** setup:

```ts
describe("TodoList", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    render(<TodoList />);
  });

  describe("GIVEN an empty input", () => {
    test("WHEN the user types a todo and clicks add THEN the todo appears in the list", async () => {
      // Arrange
      const todoText = faker.lorem.words(3);

      // Act
      await user.type(screen.getByRole("textbox"), todoText);
      await user.click(screen.getByRole("button", { name: /add/i }));

      // Assert
      expect(await screen.findByText(todoText)).toBeInTheDocument();
    });
  });
});
```

`cleanup()` already runs automatically after each test (configured in `src/test-setup/cleanup.ts`) — don't call it manually.

## Playwright e2e tests

Playwright (`@playwright/test`) applies the same writing conventions as Vitest — Gherkin names with UPPERCASE keywords, AAA comments, faker over hardcoded strings — but its API is namespaced under `test` and it has a few framework-specific quirks:

```ts
import { expect, test } from "@playwright/test";

test.describe("Login page", () => {
  test.describe("GIVEN an anonymous user on the login form", () => {
    test("WHEN they submit valid credentials THEN they are redirected to the dashboard", async ({
      page,
    }) => {
      // Arrange
      const email = faker.internet.email();
      const password = faker.internet.password();

      // Act
      await page.goto("/login");
      await page.getByLabel("Email").fill(email);
      await page.getByLabel("Password").fill(password);
      await page.getByRole("button", { name: /sign in/i }).click();

      // Assert
      await expect(page).toHaveURL(/\/dashboard$/);
    });
  });
});
```

**Key differences from Vitest:**

- **Import**: `from "@playwright/test"`, not `from "vitest"`.
- **Grouping**: `test.describe(...)`, not `describe(...)`. Hooks are also namespaced: `test.beforeEach(...)`, `test.beforeAll(...)`.
- **Fixtures**: the test callback receives fixtures like `page`, `context`, `request`. Always destructure what you need: `async ({ page }) => { ... }`.
- **`it` does not exist**: `@playwright/test` only exposes `test`. The rule "always use `test`, never `it`" is a **framework requirement** here, not just a project convention — `it` would throw at import time.
- **Query like a user**: prefer `page.getByRole(...)`, `page.getByLabel(...)`, `page.getByText(...)` over CSS/XPath selectors. Same accessibility-first priority as RTL.
- **Web-first assertions**: prefer `await expect(page).toHaveURL(...)` over `expect(page.url()).toBe(...)` — web-first assertions auto-retry until they pass or time out, so you rarely need manual `waitFor`.
