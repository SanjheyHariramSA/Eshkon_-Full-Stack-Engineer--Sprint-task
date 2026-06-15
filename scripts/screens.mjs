import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

async function login(ctx, role) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.selectOption("#role", role);
  await page.fill("#password", role);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  await page.close();
}

async function shot(ctx, path, file, width = 1440, dark = false) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width, height: 900 });
  if (dark) await page.emulateMedia({ colorScheme: "dark" });
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `screenshots/${file}.png` });
  await page.close();
}

const ctx = await browser.newContext();
await login(ctx, "publisher");

await shot(ctx, "/", "home-light");
await shot(ctx, "/", "home-dark", 1440, true);
await shot(ctx, "/preview/home", "preview-light");
await shot(ctx, "/studio/home", "studio-light");
await shot(ctx, "/studio/home", "studio-dark", 1440, true);
await shot(ctx, "/login", "login-light", 1440);
await shot(ctx, "/", "home-mobile", 390);
await shot(ctx, "/preview/home", "preview-mobile", 390);

await browser.close();
console.log("done");
