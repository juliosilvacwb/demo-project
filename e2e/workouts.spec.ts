import { test, expect } from "@playwright/test";

test.describe("Workouts", () => {
  const email = `test-workouts-${Date.now()}@example.com`;
  const password = "Password123!";
  const name = "Test User";

  test.beforeEach(async ({ page }) => {
    await page.goto("/create-account");
    await page.fill('input[id="name"]', name);
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/current-workout");
  });

  test.describe("create", () => {
    test("should start a new workout from the current workout page", async ({ page }) => {
      await page.goto("/current-workout");
      
      const startBtn = page.locator('button:has-text("Start Workout")');
      await expect(startBtn).toBeVisible();
      await startBtn.click();

      await expect(startBtn).not.toBeVisible();
      await expect(page.locator('h1:has-text("Current Workout")')).toBeVisible();
    });

    test("should show the workout date after starting", async ({ page }) => {
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');

      const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      await expect(page.locator(`h3:has-text("${today}")`)).toBeVisible();
    });
  });

  test.describe("read", () => {
    test("should display the current active workout", async ({ page }) => {
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      
      await expect(page.locator('button:has-text("Complete Workout")')).toBeVisible();
    });

    test("should show 'No active workout' when none exists", async ({ page }) => {
      await page.goto("/current-workout");
      await expect(page.locator('p:has-text("No active workout")')).toBeVisible();
    });

    test("should display completed workouts in workout history", async ({ page }) => {
      await page.goto("/movements");
      const movementName = "Bench Press";
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "100");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');

      await page.click('button:has-text("Complete Workout")');

      await page.goto("/workout-history");
      await expect(page.locator('h1:has-text("Workout History")')).toBeVisible();
      
      const rows = page.locator('table tbody tr');
      await expect(rows).toHaveCount(1);
      await expect(rows).toContainText("100 lbs / 10 reps / 1 sets");
    });
  });

  test.describe("complete", () => {
    test("should mark the current workout as completed", async ({ page }) => {
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await page.click('button:has-text("Complete Workout")');

      await expect(page.locator('p:has-text("No active workout")')).toBeVisible();
    });

    test("should move completed workout to history", async ({ page }) => {
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await page.click('button:has-text("Complete Workout")');

      await page.goto("/workout-history");
      await expect(page.locator('table tbody tr')).toHaveCount(1);
    });
  });

  test.describe("delete", () => {
    test("should delete selected workouts from history", async ({ page }) => {
      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await page.click('button:has-text("Complete Workout")');
      await page.goto("/workout-history");
      await page.click('table tbody tr input[type="checkbox"]');
      await page.click('button:has-text("Delete Selected")');

      await expect(page.locator('p:has-text("No completed workouts yet.")')).toBeVisible();
    });

    test("should allow selecting multiple workouts for deletion", async ({ page }) => {
      for (let i = 0; i < 2; i++) {
        await page.goto("/current-workout");
        await page.click('button:has-text("Start Workout")');
        await page.click('button:has-text("Complete Workout")');
      }

      await page.goto("/workout-history");
      await expect(page.locator('table tbody tr')).toHaveCount(2);

      await page.click('table thead input[type="checkbox"]');
      await expect(page.locator('button:has-text("Delete Selected (2)")')).toBeVisible();
      
      await page.click('button:has-text("Delete Selected")');
      await expect(page.locator('p:has-text("No completed workouts yet.")')).toBeVisible();
    });
  });

  test.describe("progression chart", () => {
    test("should display the progression chart when multiple workouts exist", async ({ page }) => {
      await page.goto("/movements");
      const movementName = `Chart Movement ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      for (let i = 1; i <= 2; i++) {
        await page.goto("/current-workout");
        await page.click('button:has-text("Start Workout")');
        
        await page.waitForTimeout(500);
        await page.selectOption('select', { label: movementName });
        await page.fill('input[placeholder="Weight"]', (100 + i * 10).toString());
        await page.fill('input[placeholder="Reps"]', (8 + i).toString());
        await page.click('button:has-text("Add")');

        await page.click('button:has-text("Complete Workout")');
      }

      await page.goto("/workout-history");
      await expect(page.locator('h1:has-text("Workout History")')).toBeVisible();
      
      await expect(page.locator('text=Progression Visualizer')).toBeVisible();

      await expect(page.locator('.recharts-surface')).toBeVisible();
      
      const maxWeightBtn = page.locator('button[title="Max Weight"]');
      const totalRepsBtn = page.locator('button[title="Total Reps"]');
      const totalVolumeBtn = page.locator('button[title="Total Volume"]');

      await expect(maxWeightBtn).toBeVisible();
      await expect(totalRepsBtn).toBeVisible();
      await expect(totalVolumeBtn).toBeVisible();

      await expect(page.locator('text=Maximum Weight (lbs)')).toBeVisible();

      await totalRepsBtn.click();
      await expect(page.locator('text=Total Repetitions')).toBeVisible();
      await totalVolumeBtn.click();
      await expect(page.locator('text=Total Volume (Weight * Reps)')).toBeVisible();
    });

    test("should show empty state when only one workout exists", async ({ page }) => {
      await page.goto("/movements");
      const movementName = `Empty Chart ${Date.now()}`;
      await page.fill('input[placeholder="Movement name (e.g. Bench Press)"]', movementName);
      await page.click('button:has-text("Add")');

      await page.goto("/current-workout");
      await page.click('button:has-text("Start Workout")');
      await page.selectOption('select', { label: movementName });
      await page.fill('input[placeholder="Weight"]', "100");
      await page.fill('input[placeholder="Reps"]', "10");
      await page.click('button:has-text("Add")');
      await page.click('button:has-text("Complete Workout")');

      await page.goto("/workout-history");
      await expect(page.locator('text=At least two sessions needed to track progression.')).toBeVisible();
    });
  });
});
