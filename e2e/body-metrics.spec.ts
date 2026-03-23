import { test, expect } from "@playwright/test";

test.describe("Body Metrics", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/create-account");
    await page.waitForLoadState("networkidle");

    const email = `body-metrics-test-${Date.now()}@example.com`;
    await page.fill('input[id="name"]', "Test User");
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', "Password123!");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/current-workout");

    await page.click('a:has-text("Body Metrics")');
    await page.waitForURL("**/body-metrics");
  });

  test("should log a body weight entry and see it in the list", async ({ page }) => {
    await expect(page.locator("text=No logs yet.")).toBeVisible();
    await expect(page.locator("text=Log at least two weight entries to see progress.")).toBeVisible();

    await page.fill('input[placeholder="e.g. 185.5"]', "180.5");
    await page.click('button:has-text("Log Weight")');
    await expect(page.locator("text=180.5 lbs")).toBeVisible();
    await expect(page.locator("text=No logs yet.")).not.toBeVisible();
    await page.fill('input[placeholder="e.g. 185.5"]', "178.2");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    await page.fill('input[type="date"]', yesterdayStr);

    await page.click('button:has-text("Log Weight")');

    await expect(page.locator("text=180.5 lbs")).toBeVisible();
    await expect(page.locator("text=178.2 lbs")).toBeVisible();
    await expect(page.locator("svg.recharts-surface")).toBeVisible();
    await expect(page.locator("text=Log at least two weight entries to see progress.")).not.toBeVisible();
  });
});
