import { test, expect } from "@playwright/test";

test.describe("Movements", () => {
  test.beforeEach(async ({ page }) => {
    const email = `test-movements-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
    const password = "Password123!";
    const name = "Test User";

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
    test("should delete an existing movement", async ({ page }) => {
      const movementName = "Delete Me";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();

      // Click trash icon to init delete flow
      await listItem.getByRole('button', { name: "Delete movement" }).click();
      
      // Confirm deletion in dialog/UI
      await page.getByRole('button', { name: "Confirm Delete" }).click();

      await expect(listItem).not.toBeVisible();
    });

    test("should remove the movement from the list after deletion", async ({ page }) => {
      const movementName = "Remove Later";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();

      await listItem.getByRole('button', { name: "Delete movement" }).click();
      await page.getByRole('button', { name: "Confirm Delete" }).click();

      await expect(page.locator(`li:has-text("${movementName}")`)).not.toBeVisible();
    });

    test("should archive a movement with history and hide it from workout selection", async ({ page }) => {
      const movementName = "Bench Press History";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      // Add a set to create history
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "100");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');

      // Archive it
      await page.goto("/movements");
      const listItem = page.locator(`li:has-text("${movementName}")`);
      await listItem.getByRole('button', { name: "Delete movement" }).click();
      await page.getByRole('button', { name: "Confirm Delete" }).click();
      await expect(listItem).not.toBeVisible();

      // Verify it's hidden from workout selection dropdown
      await page.goto("/current-workout");
      const options = await page.locator('select option').allTextContents();
      expect(options).not.toContain(movementName);
    });
  });
});
