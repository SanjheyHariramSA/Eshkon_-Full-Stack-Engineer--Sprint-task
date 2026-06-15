import { expect, test } from "@playwright/test";
import { expectNoSeriousA11yViolations, login } from "./helpers";

test.describe("Studio editor (Brief §3, §5)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "publisher");
    await page.goto("/studio/home");
    await expect(page.getByRole("region", { name: /live preview/i })).toBeVisible();
  });

  test("editing a prop updates the live preview (Redux-driven)", async ({ page }) => {
    // Select the first (hero) section.
    await page.getByTestId("section-select").first().click();
    await expect(page.getByRole("heading", { name: /hero properties/i })).toBeVisible();

    const headline = "Edited in the Studio";
    await page.fill("#heading", headline);

    await expect(
      page.getByRole("region", { name: /live preview/i }).getByText(headline),
    ).toBeVisible();
  });

  test("adds a section via the palette", async ({ page }) => {
    const before = await page.getByTestId("section-select").count();
    await page.getByRole("button", { name: /^add$/i }).click();
    await page.getByRole("dialog").getByRole("button", { name: /call to action/i }).click();
    await expect(page.getByTestId("section-select")).toHaveCount(before + 1);
  });

  test("reorders sections with the move-down control", async ({ page }) => {
    const first = page.getByTestId("section-select").first();
    const originalLabel = (await first.innerText()).trim();
    await page.getByRole("button", { name: /move section down/i }).first().click();
    const newLabel = (await page.getByTestId("section-select").first().innerText()).trim();
    expect(newLabel).not.toEqual(originalLabel);
  });

  test("publishes an immutable, versioned release", async ({ page }) => {
    await page.getByTestId("section-select").first().click();
    await page.fill("#heading", `Release ${Date.now()}`);

    await page.getByRole("button", { name: /^publish$/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/next version/i)).toBeVisible();
    await dialog.getByRole("button", { name: /publish release/i }).click();

    await expect(page.getByText(/published v\d+\.\d+\.\d+/i)).toBeVisible();
  });

  test("has no critical/serious accessibility violations", async ({ page }) => {
    await expectNoSeriousA11yViolations(page);
  });
});
