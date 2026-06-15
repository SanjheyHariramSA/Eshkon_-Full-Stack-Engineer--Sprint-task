import { describe, expect, it } from "vitest";
import type { Page } from "@/core/schema";
import { publishPage } from "@/server/publish/publish-service";
import { MemoryReleaseStore } from "@/server/releases/memory-release-store";
import { ImmutableReleaseError } from "@/server/releases/release-store";

function page(heading: string, extra: Page["sections"] = []): Page {
  return {
    pageId: "p",
    slug: "home",
    title: "Home",
    sections: [
      { id: "h", type: "hero", props: { heading, align: "center" } },
      ...extra,
    ],
  };
}

/** Monotonic clock so MemoryReleaseStore can order releases deterministically. */
function makeClock() {
  let t = Date.parse("2026-01-01T00:00:00Z");
  return () => new Date((t += 1000));
}

describe("publish service (Brief §5)", () => {
  it("creates 1.0.0 on first publish", async () => {
    const store = new MemoryReleaseStore();
    const res = await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now: makeClock() });
    expect(res.version).toBe("1.0.0");
    expect(res.idempotent).toBe(false);
  });

  it("is idempotent: identical draft ⇒ no new version", async () => {
    const store = new MemoryReleaseStore();
    const now = makeClock();
    const first = await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now });
    const second = await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now });

    expect(second.idempotent).toBe(true);
    expect(second.version).toBe(first.version);
    expect((await store.list("home")).releases).toHaveLength(1);
  });

  it("bumps PATCH on a text change", async () => {
    const store = new MemoryReleaseStore();
    const now = makeClock();
    await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now });
    const res = await publishPage(page("Hello world"), { store, publishedBy: "p@x.io", now });
    expect(res.version).toBe("1.0.1");
  });

  it("bumps MINOR on a section add and MAJOR on a section remove", async () => {
    const store = new MemoryReleaseStore();
    const now = makeClock();
    const extra: Page["sections"] = [
      { id: "c", type: "cta", props: { heading: "H", label: "Go", href: "/x" } },
    ];
    await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now }); // 1.0.0
    const minor = await publishPage(page("Hello", extra), { store, publishedBy: "p@x.io", now });
    expect(minor.version).toBe("1.1.0");
    const major = await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now });
    expect(major.version).toBe("2.0.0");
  });

  it("stores an immutable snapshot that cannot be overwritten", async () => {
    const store = new MemoryReleaseStore();
    const now = makeClock();
    const res = await publishPage(page("Hello"), { store, publishedBy: "p@x.io", now });
    const snapshot = await store.getVersion("home", res.version);
    expect(snapshot).not.toBeNull();
    await expect(store.save(snapshot!)).rejects.toBeInstanceOf(ImmutableReleaseError);
  });
});