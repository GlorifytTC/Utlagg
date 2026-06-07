import { test, expect } from "@playwright/test";

/**
 * E2E template (requires `npm install -D @playwright/test && npx playwright install`
 * and a running app with a seeded test user). Not run in CI until configured.
 */
test.describe("auth + dashboard", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: /logga in/i })).toBeVisible();
  });

  test("dashboard redirects when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
