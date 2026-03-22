import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  const email = `test-${Date.now()}@example.com`;
  const password = "Password123!";
  const name = "Test User";

  test("should redirect to sign-in when accessing protected route unauthenticated", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/sign-in");
    expect(page.url()).toContain("/sign-in");
  });

  test("should create a new account", async ({ page }) => {
    await page.goto("/create-account");

    await page.fill('input[id="name"]', name);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);

    await page.click('button[type="submit"]');

    // After creation should redirect to dashboard (which redirects to current-workout)
    await page.waitForURL("**/current-workout");
    expect(page.url()).toContain("/current-workout");
  });

  test("should be able to logout and then login", async ({ page }) => {
    const localEmail = `login-test-${Date.now()}@example.com`;

    await page.goto("/create-account");
    await page.fill('input[id="name"]', name);
    await page.fill('input[id="email"]', localEmail);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/current-workout");

    await page.goto("/logout");
    await page.waitForURL("**/sign-in");

    await page.fill('input[id="email"]', localEmail);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/current-workout");
    expect(page.url()).toContain("/current-workout");
  });

  test("should show error on invalid login", async ({ page }) => {
    await page.goto("/sign-in");

    await page.fill('input[id="email"]', "wrong@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    const error = page.locator('div:has-text("Invalid email or password")');
    await expect(error).toBeVisible();
  });
});
