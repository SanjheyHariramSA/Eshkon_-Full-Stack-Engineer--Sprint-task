import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export type DemoRole = "viewer" | "editor" | "publisher";

/** WCAG tags we assert against (2.2 AA core + best practices toward AAA). */
export const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa", "best-practice"];

/** Log in through the real /login form so RBAC is exercised end to end. */
export async function login(page: Page, role: DemoRole, from = "/") {
  await page.goto(`/login?from=${encodeURIComponent(from)}`);
  await page.selectOption("#role", role);
  await page.fill("#password", role);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Run axe and return only critical/serious violations (CI-blocking set). */
export async function analyze(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  return { results, blocking };
}

/** Assert a page has no critical/serious axe violations. */
export async function expectNoSeriousA11yViolations(page: Page) {
  const { blocking } = await analyze(page);
  expect(
    blocking,
    `A11y violations:\n${blocking.map((v) => `- ${v.id}: ${v.help}`).join("\n")}`,
  ).toEqual([]);
}