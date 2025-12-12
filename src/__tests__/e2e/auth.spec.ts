import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/login');

    // Check page title/heading (uses 'Welcome back!' as title)
    await expect(page.locator('h1, h2').first()).toContainText(/welcome|login|sign in/i);

    // Check form elements exist
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check links exist
    await expect(page.locator('a[href*="register"]')).toBeVisible();
    await expect(page.locator('a[href*="forgot-password"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/login');

    // Click submit without filling form
    await page.click('button[type="submit"]');

    // Check for validation errors (adjust selectors based on your implementation)
    await expect(page.locator('text=/email.*required|please enter.*email/i').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill in invalid credentials
    await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message (Alert component with role="alert")
    const errorLocator = page.locator('[role="alert"]').or(page.locator('.error')).or(page.getByText(/invalid|incorrect|failed/i));
    await expect(errorLocator.first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/login');

    await page.click('a[href*="register"]');
    await expect(page).toHaveURL(/register/);
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.goto('/auth/login');

    await page.click('a[href*="forgot-password"]');
    await expect(page).toHaveURL(/forgot-password/);
  });

  test('should display register page correctly', async ({ page }) => {
    await page.goto('/auth/register');

    // Check form elements
    await expect(page.locator('input[name="firstName"], input[placeholder*="first"]').first()).toBeVisible();
    await expect(page.locator('input[name="lastName"], input[placeholder*="last"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display forgot password page correctly', async ({ page }) => {
    await page.goto('/auth/forgot-password');

    await expect(page.locator('h1, h2').first()).toContainText(/forgot|reset|password/i);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});
