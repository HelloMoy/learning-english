import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { StructuredData } from "./structured-data";

/**
 * Guards the `search-discoverability` capability's structured-data
 * requirements — specifically the escaping, which is the reason this component
 * exists rather than each page inlining a template literal.
 */
describe("StructuredData", () => {
  test("renders exactly one linked-data script", () => {
    const { container } = render(<StructuredData data={{ "@type": "Course" }} />);

    expect(container.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  });

  test("round-trips the payload as parseable JSON", () => {
    const data = { "@context": "https://schema.org", "@type": "Course", name: "Basic Course" };

    const { container } = render(<StructuredData data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(JSON.parse(script!.textContent ?? "")).toEqual(data);
  });

  test("escapes a payload that would otherwise close the script tag", () => {
    // A course description is author-controlled text. Without escaping, this
    // value ends the <script> early and the rest becomes live markup.
    const data = { "@type": "Course", name: "Vowels </script><img src=x onerror=alert(1)>" };

    const { container } = render(<StructuredData data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');

    expect(script!.textContent).not.toContain("</script>");
    expect(container.querySelector("img")).toBeNull();
    expect(JSON.parse(script!.textContent ?? "")).toEqual(data);
  });
});
