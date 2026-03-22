import { test, expect } from "@playwright/test";

test.describe("Sets", () => {
  const email = `test-sets-${Date.now()}@example.com`;
  const password = "Password123!";
  const name = "Test User";
  const movementName = "Bench Press";

  test.beforeEach(async ({ page }) => {
    await page.goto("/create-account");
    await page.fill('input[id="name"]', name);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/current-workout");

    await page.goto("/movements");
    await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
    await page.click('button:has-text("Add")');
    await expect(page.locator(`li:has-text("${movementName}")`)).toBeVisible();

    await page.goto("/current-workout");

    const startButton = page.locator('button:has-text("Start Workout")');
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test.describe("create", () => {
    test("should add a set to the current workout", async ({ page }) => {
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "135");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');

      const setItem = page.locator(`li:has-text("${movementName}")`);
      await expect(setItem).toBeVisible();
      await expect(setItem).toContainText("10 reps");
      await expect(setItem).toContainText("135 lbs");
    });

    test("should require movement, weight, and reps to add a set", async ({ page }) => {
      const addBtn = page.locator('button:has-text("Add")');
      
      await expect(addBtn).toBeDisabled();

      await page.selectOption('select', { label: movementName });
      await expect(addBtn).toBeDisabled();

      await page.fill('input[placeholder="Weight"]', "135");
      await expect(addBtn).toBeDisabled();

      await page.fill('input[placeholder="Reps"]', "10");
      await expect(addBtn).not.toBeDisabled();
    });

    test("should display the new set in the workout", async ({ page }) => {
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "225");
      await page.fill('input[placeholder="Reps"]', "5");
      await page.click('button:has-text("Add")');

      const setItem = page.locator(`li:has-text("${movementName}")`);
      await expect(setItem).toBeVisible();
      await expect(setItem).toContainText("225 lbs");
      await expect(setItem).toContainText("5 reps");
    });
  });

  test.describe("read", () => {
    test("should display sets with movement name, weight, and reps", async ({ page }) => {
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "100");
      await page.fill('input[placeholder="Reps"]', "12");
      await page.click('button:has-text("Add")');

      const setItem = page.locator(`li:has-text("${movementName}")`).first();
      await expect(setItem).toBeVisible();
      await expect(setItem.locator('span.font-medium')).toHaveText(movementName);
      await expect(setItem.locator('span.text-slate-500')).toHaveText("12 reps × 100 lbs");
    });

    test("should show sets in the order they were added", async ({ page }) => {
      const set1 = { weight: "100", reps: "10" };
      const set2 = { weight: "120", reps: "8" };

      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', set1.weight);
      await page.fill('input[placeholder="Reps"]', set1.reps);
      await page.click('button:has-text("Add")');

      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', set2.weight);
      await page.fill('input[placeholder="Reps"]', set2.reps);
      await page.click('button:has-text("Add")');

      await expect(page.locator('ul li')).toHaveCount(2);
      
      const setList = page.locator('ul li');
      const firstSet = setList.nth(0);
      const secondSet = setList.nth(1);

      await expect(firstSet).toContainText(`${set1.weight} lbs`);
      await expect(secondSet).toContainText(`${set2.weight} lbs`);
    });
  });

  test.describe("delete", () => {
    test("should remove a set from the current workout", async ({ page }) => {
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "150");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');

      const setItem = page.locator(`li:has-text("${movementName}")`);
      await expect(setItem).toBeVisible();

      await setItem.locator('button.text-slate-400').click();

      await expect(setItem).not.toBeVisible();
    });

    test("should update the sets list after deletion", async ({ page }) => {
      for (const w of ["100", "200"]) {
        await page.selectOption('select', { label: movementName });
        await page.fill('input[placeholder="Weight"]', w);
        await page.fill('input[placeholder="Reps"]', "10");
        await page.click('button:has-text("Add")');
      }

      await expect(page.locator('ul li')).toHaveCount(2);

      await page.locator('ul li').first().locator('button.text-slate-400').click();

      await expect(page.locator('ul li')).toHaveCount(1);
      await expect(page.locator('ul li')).toContainText("200 lbs");
    });
  });
});
