import { test, expect } from './fixtures';

const UNIQUE_ID = Date.now();
const PUBLIC_NAME = `E2E-Public-${UNIQUE_ID}`;
const PRIVATE_NAME = `E2E-Private-${UNIQUE_ID}`;
const ORGANIZER_EMAIL = 'test.organizer1@sport.ro';
const ORGANIZER_PASSWORD = 'Test123!';

test.describe('Tournament privacy visibility', () => {
  let accessToken: string;

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await playwright.request.newContext({
      baseURL: 'http://localhost:8081',
    });

    const loginRes = await context.post('/api/v1/auth/login', {
      data: { email: ORGANIZER_EMAIL, password: ORGANIZER_PASSWORD },
    });
    const body = await loginRes.json();
    accessToken = body?.data?.accessToken ?? body?.accessToken;
    if (!accessToken) throw new Error('Login failed: ' + JSON.stringify(body));

    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const baseTournament = {
      name: '',
      location: 'Test City',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
    };

    const publicTournament = await context.post('/api/v1/tournaments', {
      data: { ...baseTournament, name: PUBLIC_NAME, isPrivate: false },
      headers,
    });
    expect(publicTournament.ok()).toBeTruthy();

    const privateTournament = await context.post('/api/v1/tournaments', {
      data: { ...baseTournament, name: PRIVATE_NAME, isPrivate: true },
      headers,
    });
    expect(privateTournament.ok()).toBeTruthy();

    await context.dispose();
  });

  test('public tournament is visible, private is hidden on the public listing', async ({ page, step }) => {
    await step('Navigate to tournaments page', async () => {
      await page.goto('/main/tournaments');
      await page.waitForLoadState('networkidle');
    });

    await step('Verify public tournament is visible', async () => {
      await expect(page.getByText(PUBLIC_NAME)).toBeVisible({ timeout: 10000 });
    });

    await step('Verify private tournament is NOT visible', async () => {
      await expect(page.getByText(PRIVATE_NAME)).not.toBeVisible({ timeout: 5000 });
    });
  });
});
