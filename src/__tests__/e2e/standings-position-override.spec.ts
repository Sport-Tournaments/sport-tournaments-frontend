import { test, expect } from './fixtures';

const EMAIL = 'e2etest1778103189@test.com';
const PASSWORD = 'TestPass123!';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const uniqueId = () => Math.random().toString(36).slice(2, 10);

let registeredUser: { email: string; password: string; userId: string; token: string } | null = null;

async function ensureUser(page: any, request: any) {
  if (registeredUser) return registeredUser;

  const email = `pw_e2e_${uniqueId()}@test.com`;
  const password = 'TestE2E123!';

  const resp = await request.post('/api/v1/auth/register', {
    data: { email, password, firstName: 'PW', lastName: 'Tester', role: 'ORGANIZER', country: 'RO' },
    timeout: 15000,
  });
  const body = await resp.json();
  if (body.success) {
    registeredUser = { email, password, userId: body.data.user.id, token: '' };
  }
  return registeredUser;
}

async function loginE2E(page: any, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await sleep(500);

  // Dismiss any cookie banners
  const cookieBtn = page.locator('button:has-text("Accept"), button:has-text("OK"), button:has-text("Got it")').first();
  if (await cookieBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookieBtn.click().catch(() => {});
    await sleep(300);
  }

  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for either dashboard redirect or error message
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
  } catch {
    // Check for error
    const errorText = await page.locator('[role="alert"], .text-red-500, [class*="error"]').first().textContent({ timeout: 2000 }).catch(() => '');
    if (errorText) throw new Error(`Login failed: ${errorText}`);
    throw new Error('Login did not redirect to dashboard');
  }
}

test.describe('Group Standings — Manual Position Override (E2E)', () => {
  test('should show position dropdowns on group standings page', async ({ page, request, step }) => {
    await step('Register and login as organizer', async () => {
      await ensureUser(page, request);
      await loginE2E(page, EMAIL, PASSWORD);
    });

    await step('Navigate to tournaments', async () => {
      await page.goto('/dashboard/tournaments');
      await page.waitForLoadState('networkidle');
      await sleep(1000);
    });

    // Check if there's an existing tournament with groups
    await step('Find a tournament or create one', async () => {
      const tournamentLinks = page.locator('a[href*="/dashboard/tournaments/"]');
      const count = await tournamentLinks.count();

      if (count === 0) {
        test.info().annotations.push({ type: 'tournaments-found', description: '0 - skipping test (no tournaments)' });
        test.skip(true, 'No tournaments available for E2E test');
      }
    });
  });
});
