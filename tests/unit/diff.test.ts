import { describe, expect, it } from "vitest";
import type { Page } from "@/core/schema";
import {
  applyBump,
  diffPages,
  formatVersion,
  hashPage,
  parseVersion,
} from "@/core/semver/diff";

/** Minimal page builder for deterministic tests. */
function page(sections: Page["sections"]): Page {
  return { pageId: "p", slug: "home", title: "Home", sections };
}
const hero = (id: string, heading = "Hello", extra: Record<string, unknown> = {}) =>
  ({ id, type: "hero", props: { heading, align: "center", ...extra } }) as Page["sections"][number];
const cta = (id: string) =>
  ({ id, type: "cta", props: { heading: "H", label: "Go", href: "/x" } }) as Page["sections"][number];

describe("SemVer diff (Brief §5)", () => {
  it("initial release → MAJOR with initial-release change", () => {
    const result = diffPages(null, page([hero("a")]));
    expect(result.bump).toBe("major");
    expect(result.changes[0]?.kind).toBe("initial-release");
  });

  it("identical pages → bump none (idempotent)", () => {
    const p = page([hero("a"), cta("b")]);
    const result = diffPages(p, structuredClone(p));
    expect(result.bump).toBe("none");
    expect(result.changes).toHaveLength(0);
  });

  it("text/prop change → PATCH", () => {
    const before = page([hero("a", "Hello")]);
    const after = page([hero("a", "Hello world")]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("patch");
    expect(result.changes[0]?.kind).toBe("prop-changed");
  });

  it("optional prop added (new key) → MINOR", () => {
    const before = page([hero("a", "Hello")]);
    const after = page([hero("a", "Hello", { subheading: "New sub" })]);
    expect(diffPages(before, after).bump).toBe("minor");
  });

  it("filling a previously-empty prop value → PATCH (text/prop change)", () => {
    const before = page([hero("a", "Hello", { subheading: "" })]);
    const after = page([hero("a", "Hello", { subheading: "Now set" })]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("patch");
    expect(result.changes[0]?.kind).toBe("prop-changed");
  });

  it("clearing an optional prop value → PATCH", () => {
    const before = page([hero("a", "Hello", { subheading: "set" })]);
    const after = page([hero("a", "Hello", { subheading: "" })]);
    expect(diffPages(before, after).bump).toBe("patch");
  });

  it("emptying a required prop value (key present) → MAJOR", () => {
    const before = page([hero("a", "Hello")]);
    const after = page([hero("a", "")]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("major");
    expect(result.changes.some((c) => c.kind === "required-prop-broken")).toBe(true);
  });

  it("section added → MINOR", () => {
    const before = page([hero("a")]);
    const after = page([hero("a"), cta("b")]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("minor");
    expect(result.changes.some((c) => c.kind === "section-added")).toBe(true);
  });

  it("section removed → MAJOR", () => {
    const before = page([hero("a"), cta("b")]);
    const after = page([hero("a")]);
    expect(diffPages(before, after).bump).toBe("major");
  });

  it("section type changed → MAJOR", () => {
    const before = page([hero("a")]);
    const after = page([cta("a")]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("major");
    expect(result.changes.some((c) => c.kind === "section-type-changed")).toBe(true);
  });

  it("required prop broken → MAJOR", () => {
    const before = page([hero("a", "Hello")]);
    const after = page([{ id: "a", type: "hero", props: { align: "center" } } as Page["sections"][number]]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("major");
    expect(result.changes.some((c) => c.kind === "required-prop-broken")).toBe(true);
  });

  it("reorder only → PATCH", () => {
    const before = page([hero("a"), cta("b")]);
    const after = page([cta("b"), hero("a")]);
    const result = diffPages(before, after);
    expect(result.bump).toBe("patch");
    expect(result.changes.some((c) => c.kind === "section-reordered")).toBe(true);
  });

  it("takes the MAX severity across multiple changes", () => {
    const before = page([hero("a", "Hi"), cta("b")]);
    // patch (text) + major (remove cta)
    const after = page([hero("a", "Changed")]);
    expect(diffPages(before, after).bump).toBe("major");
  });

  it("is deterministic: same input ⇒ same output", () => {
    const before = page([hero("a", "Hi")]);
    const after = page([hero("a", "Bye"), cta("b")]);
    expect(JSON.stringify(diffPages(before, after))).toEqual(
      JSON.stringify(diffPages(before, after)),
    );
  });
});

describe("version arithmetic", () => {
  it("applies bumps with correct resets", () => {
    expect(formatVersion(applyBump(parseVersion("1.2.3"), "major"))).toBe("2.0.0");
    expect(formatVersion(applyBump(parseVersion("1.2.3"), "minor"))).toBe("1.3.0");
    expect(formatVersion(applyBump(parseVersion("1.2.3"), "patch"))).toBe("1.2.4");
    expect(formatVersion(applyBump(parseVersion("1.2.3"), "none"))).toBe("1.2.3");
  });

  it("rejects malformed versions", () => {
    expect(() => parseVersion("1.2")).toThrow();
  });
});

describe("content hash", () => {
  it("is stable across key ordering", () => {
    const a = page([hero("a", "Hi", { subheading: "s", eyebrow: "e" })]);
    const b: Page = {
      slug: "home",
      title: "Home",
      pageId: "p",
      sections: [{ id: "a", type: "hero", props: { eyebrow: "e", align: "center", subheading: "s", heading: "Hi" } }],
    };
    expect(hashPage(a)).toEqual(hashPage(b));
  });

  it("changes when content changes", () => {
    expect(hashPage(page([hero("a", "X")]))).not.toEqual(hashPage(page([hero("a", "Y")])));
  });
});
