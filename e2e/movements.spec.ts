import { test, expect } from "@playwright/test";

test.describe("Movements", () => {
  const email = `test-movements-${Date.now()}@example.com`;
  const password = "Password123!";
  const name = "Test User";

  test.beforeEach(async ({ page }) => {

    await page.goto("/create-account");
    await page.fill('input[id="name"]', name);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/current-workout");
    await page.goto("/movements");

  });

  test.describe("create", () => {
    test("should create a new movement with a valid name", async ({ page }) => {
      const movementName = "Bench Press";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();
    });

    test("should create a body-weight movement", async ({ page }) => {
      const movementName = "Pull-ups";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('input[type="checkbox"]');
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();
      await expect(listItem.locator('span:has-text("body-weight")')).toBeVisible();
    });

    test("should clear the input after creating a movement", async ({ page }) => {
      const movementName = "Squats";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      const inputValue = await page.inputValue('input[placeholder="Movement name (e.g. Bench Press)"]');
      expect(inputValue).toBe("");
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ page }) => {
      const movements = ["Deadlift", "Shoulder Press"];

      for (const m of movements) {
        await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', m);
        await page.click('button:has-text("Add")');
      }

      for (const m of movements) {
        await expect(page.locator(`li:has-text("${m}")`)).toBeVisible();
      }
    });

    test("should show movements sorted alphabetically", async ({ page }) => {
      const movements = ["Z-Press", "A-Squat"];
      
      for (const m of movements) {
        await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', m);
        await page.click('button:has-text("Add")');
      }

      const listItems = page.locator('li');
      const textContents = await listItems.allTextContents();
      
      const relevantContents = textContents.filter(t => t.includes("Z-Press") || t.includes("A-Squat"));
      
      expect(relevantContents[0]).toContain("A-Squat");
      expect(relevantContents[relevantContents.length - 1]).toContain("Z-Press");
    });
  });

  test.describe("delete", () => {
    test.skip("should delete an existing movement", async ({ page }) => {
      // Feature not yet implemented in the UI
    });

    test.skip("should remove the movement from the list after deletion", async ({ page }) => {
      // Feature not yet implemented in the UI
    });
  });
});
