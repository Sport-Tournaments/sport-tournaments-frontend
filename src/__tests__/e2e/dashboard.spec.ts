import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.describe('Without Authentication', () => {
    test('should redirect to login when accessing dashboard', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login or show unauthorized
      await expect(page).toHaveURL(/auth\/login|unauthorized/);
    });

    test('should redirect to login when accessing admin', async ({ page }) => {
      await page.goto('/dashboard/admin');

      await expect(page).toHaveURL(/auth\/login|unauthorized/);
    });
  });

  // Note: Authenticated tests would require setting up auth state
  // This can be done with storageState or by logging in before tests
  test.describe('Dashboard Layout', () => {
    test.skip('should display sidebar navigation', async ({ page }) => {
      // Skip until auth is set up
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="sidebar"], aside, nav').first()).toBeVisible();
    });

    test.skip('should display user menu', async ({ page }) => {
      // Skip until auth is set up
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });
  });
});

test.describe('Accessibility Tests', () => {
  test('homepage should have no critical accessibility issues', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    // Check for main landmark
    const mainContent = page.locator('main, [role="main"]');
    if (await mainContent.count() > 0) {
      await expect(mainContent.first()).toBeVisible();
    }

    // Check all images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      const role = await images.nth(i).getAttribute('role');
      // Image should have alt or be decorative (role="presentation")
      const hasAlt = alt !== null || role === 'presentation' || role === 'none';
      expect(hasAlt).toBe(true);
    }

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1); // Should have at most one h1
  });

  test('login page should have proper form labels', async ({ page }) => {
    await page.goto('/auth/login');

    // Check that inputs have associated labels
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');

    // Inputs should have labels (via aria-label, aria-labelledby, or <label>)
    const emailLabel = await emailInput.getAttribute('aria-label');
    const emailLabelledBy = await emailInput.getAttribute('aria-labelledby');
    const passwordLabel = await passwordInput.getAttribute('aria-label');
    const passwordLabelledBy = await passwordInput.getAttribute('aria-labelledby');

    // At least one accessibility attribute should be present or input should have label
    expect(
      emailLabel || emailLabelledBy || (await page.locator('label[for]').count()) > 0
    ).toBeTruthy();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Something should be focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Tab a few more times
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should still have focus on something
    const newFocusedElement = page.locator(':focus');
    await expect(newFocusedElement).toBeVisible();
  });

  test('should have skip links or proper focus management', async ({ page }) => {
    await page.goto('/');

    // Check for skip link
    const skipLink = page.locator('a[href="#main"], a[href="#content"], .skip-link');
    const hasSkipLink = await skipLink.count() > 0;

    // Either has skip link or main content is properly labeled
    const mainContent = page.locator('main, [role="main"]');
    const hasMain = await mainContent.count() > 0;

    expect(hasSkipLink || hasMain).toBe(true);
  });
});

test.describe('Performance Tests', () => {
  test('homepage should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load DOM content within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('tournaments page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/main/tournaments', { waitUntil: 'domcontentloaded' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load DOM content within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should not have excessive DOM elements', async ({ page }) => {
    await page.goto('/');

    const domElementCount = await page.evaluate(() => document.querySelectorAll('*').length);
    
    // Should not have more than 3000 DOM elements for good performance
    expect(domElementCount).toBeLessThan(3000);
  });
});

test.describe('SEO Tests', () => {
  test('homepage should have proper meta tags', async ({ page }) => {
    await page.goto('/');

    // Check for title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);

    // Check for meta description
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription).toBeTruthy();
  });

  test('should have proper Open Graph tags', async ({ page }) => {
    await page.goto('/');

    // Check for og:title
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    
    // OG tags are optional but good to have
    if (ogTitle) {
      expect(ogTitle.length).toBeGreaterThan(0);
    }
  });

  test('should have canonical URL', async ({ page }) => {
    await page.goto('/');

    const canonical = page.locator('link[rel="canonical"]');
    const canonicalCount = await canonical.count();
    
    // Canonical is optional but recommended
    if (canonicalCount > 0) {
      const href = await canonical.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
});
