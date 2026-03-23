import { test, expect } from "@playwright/test";

test.describe("Movements", () => {
  test.beforeEach(async ({ page }) => {
    const email = `test-movements-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
    const password = "Password123!";
    const name = "Test User";

    await page.goto("/create-account");
    await page.waitForLoadState("networkidle");

    await page.fill('input[id="name"]', name);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/current-workout");
    
    await page.goto("/movements");
    await page.waitForLoadState("networkidle");

  });

  test.describe("create", () => {
    test("should create a new movement with a valid name", async ({ page }) => {
      const movementName = `Bench Press ${Math.random().toString(36).slice(2, 7)}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();
    });

    test("should create a body-weight movement", async ({ page }) => {
      const movementName = `Pull-ups ${Math.random().toString(36).slice(2, 7)}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('input[type="checkbox"]');
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();
      await expect(listItem.locator('span:has-text("body-weight")')).toBeVisible();
    });

    test("should clear the input after creating a movement", async ({ page }) => {
      const movementName = `Squats ${Math.random().toString(36).slice(2, 7)}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      await expect(page.locator('input[placeholder="Movement name (e.g. Bench Press)"]')).toHaveValue("");
    });
  });

  test.describe("read", () => {
    test("should display all movements on the movements page", async ({ page }) => {
      const suffix = Math.random().toString(36).slice(2, 7);
      const movements = [`Deadlift ${suffix}`, `Shoulder Press ${suffix}`];

      for (const m of movements) {
        await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', m);
        await page.click('button:has-text("Add")');
      }

      for (const m of movements) {
        await expect(page.locator(`li:has-text("${m}")`)).toBeVisible();
      }
    });

    test("should show movements sorted alphabetically", async ({ page }) => {
      const suffix = Math.random().toString(36).slice(2, 7);
      const movements = [`Z-Press ${suffix}`, `A-Squat ${suffix}`];
      
      for (const m of movements) {
        await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', m);
        await page.click('button:has-text("Add")');
      }

      await expect(page.locator(`li:has-text("${movements[0]}")`)).toBeVisible();
      await expect(page.locator(`li:has-text("${movements[1]}")`)).toBeVisible();

      const listItems = page.locator('li');
      const textContents = await listItems.allTextContents();
      
      const relevantContents = textContents.filter(t => t.includes(`Z-Press ${suffix}`) || t.includes(`A-Squat ${suffix}`));
      
      expect(relevantContents[0]).toContain(`A-Squat ${suffix}`);
      expect(relevantContents[relevantContents.length - 1]).toContain(`Z-Press ${suffix}`);
    });
  });

  test.describe("delete", () => {
    test("should delete an existing movement", async ({ page }) => {
      const movementName = `Delete Me ${Math.random().toString(36).slice(2, 7)}`;
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
      const movementName = `Remove Later ${Math.random().toString(36).slice(2, 7)}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      const listItem = page.locator(`li:has-text("${movementName}")`);
      await expect(listItem).toBeVisible();

      await listItem.getByRole('button', { name: "Delete movement" }).click();
      await page.getByRole('button', { name: "Confirm Delete" }).click();

      await expect(page.locator(`li:has-text("${movementName}")`)).not.toBeVisible();
    });

    test("should archive a movement with history and hide it from workout selection", async ({ page }) => {
      const movementName = `Bench Press History ${Math.random().toString(36).slice(2, 7)}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      // Add a set to create history
      await page.goto("/current-workout");
      await page.waitForLoadState("networkidle");
      await page.click('button:has-text("Start Workout")');
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "100");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');

      // Archive it
      await page.goto("/movements");
      await page.waitForLoadState("networkidle");
      const listItem = page.locator(`li:has-text("${movementName}")`);
      await listItem.getByRole('button', { name: "Delete movement" }).click();
      await page.getByRole('button', { name: "Confirm Delete" }).click();
      await expect(listItem).not.toBeVisible();

      // Verify it's hidden from workout selection dropdown
      await page.goto("/current-workout");
      await page.waitForLoadState("networkidle");
      const options = await page.locator('select option').allTextContents();
      expect(options).not.toContain(movementName);
    });
  });
});
