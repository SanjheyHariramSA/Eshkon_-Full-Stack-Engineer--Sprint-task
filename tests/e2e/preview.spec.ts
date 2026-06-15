import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations, login } from "./helpers";

test.describe("Preview (Brief §1, §6)", () => {
  test("renders Contentful/fixture sections via the schema-driven renderer", async ({ page }) => {
    await login(page, "viewer");
    await page.goto("/preview/home");

    // Hero heading from the fixture renders.
    await expect(
      page.getByRole("heading", { name: /build landing pages that ship themselves/i }),
    ).toBeVisible();

    // Feature grid renders as a list.
    await expect(page.getByRole("heading", { name: /engineered for correctness/i })).toBeVisible();
  });

  test("unknown section type degrades to UnsupportedSection (no crash)", async ({ page }) => {
    await login(page, "viewer");
    await page.goto("/preview/home");
    await expect(page.getByText(/unsupported section type: "marquee"/i)).toBeVisible();
  });

  test("CTA interaction navigates to its href", async ({ page }) => {
    await login(page, "editor");
    await page.goto("/preview/home");
    const cta = page.getByRole("link", { name: /get started/i }).first();
    await expect(cta).toBeVisible();
    await cta.click();
    await expect(page).toHaveURL(/\/studio\/home/);
  });

  test("has no critical/serious accessibility violations", async ({ page }) => {
    await login(page, "viewer");
    await page.goto("/preview/home");
    await expectNoSeriousA11yViolations(page);
  });
});