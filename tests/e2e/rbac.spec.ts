import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("RBAC enforcement (Brief §4)", () => {
  test("unauthenticated user is redirected from /studio to /login", async ({ page }) => {
    await page.goto("/studio/home");
    await expect(page).toHaveURL(/\/login/);
  });

  test("viewer cannot access /studio (redirected to /denied)", async ({ page }) => {
    await login(page, "viewer");
    await page.goto("/studio/home");
    await expect(page).toHaveURL(/\/denied/);
    await expect(page.getByRole("heading", { name: /access denied/i })).toBeVisible();
  });

  test("editor can open /studio but cannot publish (button disabled)", async ({ page }) => {
    await login(page, "editor");
    await page.goto("/studio/home");
    await expect(page.getByRole("button", { name: /^publish$/i })).toBeDisabled();
  });

  test("non-publisher is rejected by the publish API even via direct request", async ({ page }) => {
    await login(page, "editor");
    // page.request shares the authenticated browser context's cookies, so this
    // is an authenticated-but-under-privileged request → expect 403 (forbidden).
    const res = await page.request.post("/api/publish", {
      data: { page: { pageId: "p", slug: "home", title: "Home", sections: [] } },
    });
    expect(res.status()).toBe(403);
  });
});