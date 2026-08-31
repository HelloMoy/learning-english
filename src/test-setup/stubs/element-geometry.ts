/**
 * A single `scrollTop` assignment observed while the stub was installed.
 */
export type ScrollTopWrite = {
  element: Element;
  value: number;
};

/**
 * What {@link stubElementGeometry} hands back: the log of scroll writes and
 * the function that puts `Element.prototype` back the way it was.
 */
export type ElementGeometryStub = {
  /** Every `scrollTop` assignment made since the stub was installed, in order. */
  scrollTopWrites: ScrollTopWrite[];
  /** Restores the original `Element.prototype` descriptors. Call it in `afterEach`. */
  restore: () => void;
};

const STUBBED_PROPERTIES = [
  "scrollTop",
  "getBoundingClientRect",
  "clientHeight",
  "scrollHeight",
] as const;

const declaredPixels = (element: Element, attribute: string): number =>
  Number(element.getAttribute(attribute) ?? 0);

/**
 * Gives jsdom elements a layout they declare for themselves, and records
 * every `scrollTop` assignment.
 *
 * @remarks
 * jsdom has no layout engine: every rect and every height reads back as `0`,
 * and a `scrollTop` assignment leaves no trace. Code that measures a
 * scrollable region is therefore untestable against it without help.
 *
 * With this stub installed, an element states its own geometry through
 * `data-top`, `data-height`, and `data-scroll-height` attributes, so a test
 * declares the layout it wants in the markup it renders. Elements that
 * declare nothing behave exactly as they do in plain jsdom — all zeroes —
 * which makes the stub safe to install even when a test only cares about
 * *whether* something scrolled.
 *
 * It patches `Element.prototype` rather than the rendered nodes because the
 * code under test typically measures in a layout effect, which runs before a
 * test can reach those nodes.
 *
 * @returns The recorded writes and a `restore` function
 *
 * @example
 * ```ts
 * let geometry: ElementGeometryStub;
 * beforeEach(() => { geometry = stubElementGeometry(); });
 * afterEach(() => geometry.restore());
 *
 * render(<div data-height="600" data-scroll-height="2600">…</div>);
 * expect(geometry.scrollTopWrites).toHaveLength(1);
 * ```
 */
export function stubElementGeometry(): ElementGeometryStub {
  const originalDescriptors = STUBBED_PROPERTIES.map(
    (property) => [property, Object.getOwnPropertyDescriptor(Element.prototype, property)] as const,
  );

  const scrollTopWrites: ScrollTopWrite[] = [];
  const scrollOffsets = new WeakMap<Element, number>();

  Object.defineProperty(Element.prototype, "scrollTop", {
    configurable: true,
    get(this: Element) {
      return scrollOffsets.get(this) ?? 0;
    },
    set(this: Element, value: number) {
      scrollOffsets.set(this, value);
      scrollTopWrites.push({ element: this, value });
    },
  });

  Object.defineProperty(Element.prototype, "getBoundingClientRect", {
    configurable: true,
    value(this: Element): DOMRect {
      const top = declaredPixels(this, "data-top");
      const height = declaredPixels(this, "data-height");
      return {
        top,
        height,
        bottom: top + height,
        y: top,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        toJSON: () => ({}),
      };
    },
  });

  Object.defineProperty(Element.prototype, "clientHeight", {
    configurable: true,
    get(this: Element) {
      return declaredPixels(this, "data-height");
    },
  });

  Object.defineProperty(Element.prototype, "scrollHeight", {
    configurable: true,
    get(this: Element) {
      return declaredPixels(this, "data-scroll-height");
    },
  });

  return {
    scrollTopWrites,
    restore: () => {
      for (const [property, descriptor] of originalDescriptors) {
        if (descriptor) Object.defineProperty(Element.prototype, property, descriptor);
        else Reflect.deleteProperty(Element.prototype, property);
      }
    },
  };
}
