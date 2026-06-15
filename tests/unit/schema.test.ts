import { describe, expect, it } from "vitest";
import { pageSchema, heroPropsSchema, REQUIRED_PROPS } from "@/core/schema";
import { validatePage, validateSection, assertFullyValidPage, PageValidationError } from "@/core/validation";

describe("schema validation (Brief §1, §6)", () => {
  const validRaw = {
    pageId: "p1",
    slug: "home",
    title: "Home",
    sections: [
      { id: "h1", type: "hero", props: { heading: "Hi", align: "center" } },
      {
        id: "f1",
        type: "featureGrid",
        props: { columns: 3, features: [{ title: "A" }] },
      },
    ],
  };

  it("accepts a structurally valid page", () => {
    const result = validatePage(validRaw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.page.sections).toHaveLength(2);
      expect(result.page.sections.every((s) => s.status === "ok")).toBe(true);
    }
  });

  it("rejects a structurally invalid page (missing slug)", () => {
    const result = validatePage({ ...validRaw, slug: "" });
    expect(result.ok).toBe(false);
  });

  it("degrades an unknown section type to unsupported (does not fail the page)", () => {
    const result = validatePage({
      ...validRaw,
      sections: [...validRaw.sections, { id: "x", type: "marquee", props: {} }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const last = result.page.sections.at(-1);
      expect(last?.status).toBe("unsupported");
      if (last?.status === "unsupported") expect(last.reason).toBe("unknown-type");
    }
  });

  it("degrades a section with invalid props to unsupported", () => {
    const section = validateSection({ id: "h", type: "hero", props: { align: "center" } });
    expect(section.status).toBe("unsupported");
    if (section.status === "unsupported") expect(section.reason).toBe("invalid-props");
  });

  it("strips unknown props via .strict()", () => {
    const parsed = heroPropsSchema.safeParse({ heading: "Hi", bogus: 1 });
    expect(parsed.success).toBe(false);
  });

  it("derives the required-prop table from the Zod shape", () => {
    expect(REQUIRED_PROPS.hero).toContain("heading");
    expect(REQUIRED_PROPS.cta).toEqual(expect.arrayContaining(["heading", "label", "href"]));
    expect(REQUIRED_PROPS.hero).not.toContain("subheading");
  });

  it("assertFullyValidPage throws on a page with an unsupported section", () => {
    expect(() =>
      assertFullyValidPage({
        ...validRaw,
        sections: [{ id: "x", type: "marquee", props: {} }],
      }),
    ).toThrow(PageValidationError);
  });

  it("pageSchema parses a clean page object directly", () => {
    const parsed = pageSchema.safeParse({
      pageId: "p",
      slug: "s",
      title: "t",
      sections: [{ id: "c", type: "cta", props: { heading: "H", label: "L", href: "/x" } }],
    });
    expect(parsed.success).toBe(true);
  });
});
