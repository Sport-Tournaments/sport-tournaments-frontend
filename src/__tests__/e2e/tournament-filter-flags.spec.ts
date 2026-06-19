import { test, expect } from './fixtures';

const UNIQUE_ID = Date.now();
const BASE_NAME = `FilterTest-${UNIQUE_ID}`;
const ORG_EMAIL = 'test.organizer1@sport.ro';
const ORG_PASSWORD = 'Test123!';

test.describe('Tournament filter suite', () => {
  let accessToken: string;

  test.beforeAll(async ({ playwright }) => {
    const ctx = await playwright.request.newContext({ baseURL: 'http://localhost:8081' });
    const loginRes = await ctx.post('/api/v1/auth/login', {
      data: { email: ORG_EMAIL, password: ORG_PASSWORD },
    });
    const body = await loginRes.json();
    accessToken = body?.data?.accessToken ?? body?.accessToken;
    if (!accessToken) throw new Error('Login failed');

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const baseT = { location: 'Test City', startDate: '2026-09-01', endDate: '2026-09-02' };

    // Create: normal, premium, featured, premium+featured
    await ctx.post('/api/v1/tournaments', { data: { ...baseT, name: `${BASE_NAME}-normal` }, headers });
    await ctx.post('/api/v1/tournaments', { data: { ...baseT, name: `${BASE_NAME}-premium`, isPremium: true }, headers });
    await ctx.post('/api/v1/tournaments', { data: { ...baseT, name: `${BASE_NAME}-featured`, isFeatured: true }, headers });
    await ctx.post('/api/v1/tournaments', { data: { ...baseT, name: `${BASE_NAME}-premium-featured`, isPremium: true, isFeatured: true }, headers });
    await ctx.dispose();
  });

  async function openAdvancedFilters(page: any) {
    const btn = page.locator('button').filter({ hasText: /more filters/i });
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(500);
    }
  }

  test('isPremium filter shows only premium tournaments', async ({ page, step }) => {
    await step('Navigate to tournaments page and open filters', async () => {
      await page.goto('/main/tournaments');
      await page.waitForLoadState('networkidle');
      await openAdvancedFilters(page);
    });

    await step('Toggle premium checkbox', async () => {
      const checkbox = page.locator('label').filter({ hasText: /premium/i }).locator('input[type="checkbox"]');
      await checkbox.check();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    });

    await step('Verify premium tournament is visible', async () => {
      await expect(page.getByRole('heading', { name: `${BASE_NAME}-premium`, exact: true })).toBeVisible({ timeout: 10000 });
    });

    await step('Verify premium+featured tournament is visible', async () => {
      await expect(page.getByRole('heading', { name: `${BASE_NAME}-premium-featured`, exact: true })).toBeVisible({ timeout: 5000 });
    });

    await step('Verify normal tournament is hidden', async () => {
      await expect(page.getByRole('heading', { name: `${BASE_NAME}-normal`, exact: true })).not.toBeVisible({ timeout: 5000 });
    });
  });

  test('isFeatured filter shows only featured tournaments', async ({ page, step }) => {
    await step('Navigate to tournaments page and open filters', async () => {
      await page.goto('/main/tournaments');
      await page.waitForLoadState('networkidle');
      await openAdvancedFilters(page);
    });

    await step('Toggle featured checkbox', async () => {
      const checkbox = page.locator('label').filter({ hasText: /featured/i }).locator('input[type="checkbox"]');
      await checkbox.check();
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
    });

    await step('Verify featured tournament is visible', async () => {
      await expect(page.getByRole('heading', { name: `${BASE_NAME}-featured`, exact: true })).toBeVisible({ timeout: 10000 });
    });

    await step('Verify premium+featured tournament is visible', async () => {
      await expect(page.getByRole('heading', { name: `${BASE_NAME}-premium-featured`, exact: true })).toBeVisible({ timeout: 5000 });
    });

    await step('Verify normal tournament is hidden', async () => {
      await expect(page.getByRole('heading', { name: `${BASE_NAME}-normal`, exact: true })).not.toBeVisible({ timeout: 5000 });
    });
  });
});
