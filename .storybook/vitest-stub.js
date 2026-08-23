// Stub for the real `vitest` package, aliased in `.storybook/main.ts`.
//
// Storybook 10 ships its Component tests UI in core. The preview runtime
// (storybook/dist/preview/runtime.js) initialises matchers on
// `$$jest-matchers-object-storybook`, but Vite's dep optimizer also
// pre-bundles the real `vitest` package, which initialises the same
// matchers object on its own (`$$jest-matchers-object`). When the two
// load in the wrong order, the Storybook runtime's conditional
// `Object.hasOwn(globalThis, MATCHERS_OBJECT)` guard skips its setup
// because vitest.js set the flag first — leaving
// `$$jest-matchers-object-storybook` undefined and crashing the preview
// with `Cannot read properties of undefined (reading
// 'customEqualityTesters')`.
//
// The project's `test-storybook` script is a stub ("requires vitest
// project setup") and no Vitest project is wired in `vitest.config.ts`,
// so the Component tests panel is dead UI either way. Aliasing
// `vitest` to this empty module stops Vite from pre-bundling the real
// package and lets the Storybook runtime initialise its matchers
// cleanly. The exports below cover every identifier the runtime
// imports from `vitest` (e.g. `vi`, `expect`, `describe`, `it`,
// `test`, `beforeAll`, `beforeEach`, `afterAll`, `afterEach`,
// `fn`, `mock`); each is a no-op so the runtime doesn't crash even
// though nothing actually runs. Re-add the real vitest package and a
// `storybookTest` Vitest project when the test panel is wanted.

const noop = () => {};

export const vi = {
  fn: () => () => {},
  mocked: (v) => v,
  spyOn: () => () => {},
  mock: noop,
  unmock: noop,
  doMock: noop,
  doUnmock: noop,
  clearAllMocks: noop,
  resetAllMocks: noop,
  restoreAllMocks: noop,
  advanceTimersByTime: noop,
  runAllTimers: noop,
  useFakeTimers: noop,
  useRealTimers: noop,
};

export const expect = () => ({});
export const describe = (_name, fn) => fn();
export const it = (_name, fn) => fn();
export const test = (_name, fn) => fn();
export const beforeAll = noop;
export const afterAll = noop;
export const beforeEach = noop;
export const afterEach = noop;
export const onTestFinished = noop;

const vitestStub = {
  vi,
  expect,
  describe,
  it,
  test,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  onTestFinished,
};

export default vitestStub;
