import { test, expect } from './fixtures';

/**
 * E2E Test for Issues #29 & #30
 * Verifies that Browse Tournaments and Clubs pages load without network errors
 * after fixing the API base URL from port 3001 to 3010
 */

test.describe('Issues #29 & #30 - Network Error Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Monitor network failures
    page.on('requestfailed', (request) => {
      console.log('Failed request:', request.url(), request.failure()?.errorText);
    });
  });

  test('Issue #29: Browse Tournaments page should load successfully', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Click on "Browse Tournaments" button
    const browseTournamentsButton = page.getByRole('link').filter({ hasText: /browse tournaments/i });
    await expect(browseTournamentsButton).toBeVisible();
    await browseTournamentsButton.click();

    // Wait for navigation
    await page.waitForURL('**/main/tournaments');
    await page.waitForLoadState('networkidle');

    // Verify we're on the tournaments page
    await expect(page).toHaveURL(/\/main\/tournaments/);

    // Check that the page title is visible (not an error page)
    const pageTitle = page.getByRole('heading', { name: /tournaments/i }).first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Verify NO error dialog appears
    const errorDialog = page.getByText(/network error|an error occurred/i);
    await expect(errorDialog).not.toBeVisible({ timeout: 2000 });

    // Verify tournament cards are loading or empty state is shown (either cards exist or empty state)
    const hasTournamentCard = await page.getByTestId('tournament-card').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no tournaments found/i).isVisible().catch(() => false);
    expect(hasTournamentCard || hasEmptyState).toBeTruthy();

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/issue29-tournaments-page.png', fullPage: true });

    console.log('✅ Issue #29 FIXED: Browse Tournaments page loads successfully');
  });

  test('Issue #30: Clubs section should load successfully', async ({ page }) => {
    // Navigate to home page
    await page.goto('http://localhost:3000');

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    // Click on "Clubs" navigation item (check both mobile menu and desktop nav)
    const clubsLink = page.getByRole('link', { name: /^clubs$/i }).first();
    
    // If not visible, try opening mobile menu
    if (!await clubsLink.isVisible()) {
      const mobileMenuButton = page.getByRole('button', { name: /menu/i });
      if (await mobileMenuButton.isVisible()) {
        await mobileMenuButton.click();
        await page.waitForTimeout(500);
      }
    }

    await expect(clubsLink).toBeVisible();
    await clubsLink.click();

    // Wait for navigation
    await page.waitForURL('**/main/clubs');
    await page.waitForLoadState('networkidle');

    // Verify we're on the clubs page
    await expect(page).toHaveURL(/\/main\/clubs/);

    // Check that the page title is visible (not an error page)
    const pageTitle = page.getByRole('heading', { name: /clubs/i }).first();
    await expect(pageTitle).toBeVisible({ timeout: 10000 });

    // Verify NO error dialog appears
    const errorDialog = page.getByText(/network error|an error occurred/i);
    await expect(errorDialog).not.toBeVisible({ timeout: 2000 });

    // Verify clubs cards are loading or empty state is shown (either cards exist or empty state)
    const hasClubCard = await page.getByTestId('club-card').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText(/no clubs found/i).isVisible().catch(() => false);
    expect(hasClubCard || hasEmptyState).toBeTruthy();

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/issue30-clubs-page.png', fullPage: true });

    console.log('✅ Issue #30 FIXED: Clubs section loads successfully');
  });

  test('Verify API calls are made to correct port (3010)', async ({ page }) => {
    const apiRequests: string[] = [];

    // Intercept API requests
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/v1/')) {
        apiRequests.push(url);
        console.log('API Request:', url);
      }
    });

    // Navigate to tournaments page
    await page.goto('http://localhost:3000/main/tournaments');
    await page.waitForLoadState('networkidle');

    // Wait a bit for API calls
    await page.waitForTimeout(2000);

    // Verify at least one API call was made
    expect(apiRequests.length).toBeGreaterThan(0);

    // Verify all API calls use port 3010 (not 3001)
    for (const url of apiRequests) {
      expect(url).toContain('3010');
      expect(url).not.toContain('3001');
      expect(url).toContain('/api/v1/');
    }

    console.log(`✅ All ${apiRequests.length} API requests use correct port 3010`);
  });

  test('Verify backend connectivity', async ({ page }) => {
    // Test direct API call
    const response = await page.request.get('http://localhost:3010/api/v1/tournaments');
    
    // Verify successful response
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('data');

    console.log('✅ Backend API on port 3010 is responding correctly');
  });
});
