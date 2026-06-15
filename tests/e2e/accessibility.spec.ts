import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { analyze, AXE_TAGS, login } from "./helpers";

/**
 * Generates the `a11y-report.json` artefact (Brief §6) and enforces the gate:
 * CI fails on any critical OR serious violation. The report aggregates results
 * across the key surfaces so reviewers have evidence of coverage.
 */
const SURFACES: Array<{ name: string; path: string; as: "viewer" | "editor" }> = [
  { name: "login", path: "/login", as: "viewer" },
  { name: "home", path: "/", as: "viewer" },
  { name: "preview", path: "/preview/home", as: "viewer" },
  { name: "studio", path: "/studio/home", as: "editor" },
];

test("a11y sweep produces a report and passes the threshold", async ({ page }) => {
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    tags: AXE_TAGS,
    threshold: "no critical or serious violations",
    surfaces: {},
  };
  const allBlocking: string[] = [];

  for (const surface of SURFACES) {
    if (surface.path === "/login") {
      await page.goto(surface.path);
    } else {
      await login(page, surface.as, surface.path);
      await page.goto(surface.path);
    }

    const { results, blocking } = await analyze(page);
    (report.surfaces as Record<string, unknown>)[surface.name] = {
      path: surface.path,
      total: results.violations.length,
      blocking: blocking.length,
      violations: results.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.map((n) => ({ target: n.target, html: n.html.slice(0, 160) })),
      })),
    };
    blocking.forEach((v) => allBlocking.push(`${surface.name}: ${v.id} (${v.impact})`));
  }

  writeFileSync("a11y-report.json", JSON.stringify(report, null, 2));

  expect(allBlocking, `Blocking a11y violations:\n${allBlocking.join("\n")}`).toEqual([]);
});