import { test, expect } from '@playwright/test';
import path from 'path';

const API_BASE_URL = 'http://localhost:3001/api/v1';

const ACCOUNTS = {
  A: {
    email: 'organizer14@example.com',
    password: 'Password123!',
  },
  B: {
    email: 'organizer15@example.com',
    password: 'Password123!',
  },
};

const FIXTURE_PDF_PATH = path.resolve(
  __dirname,
  'fixtures',
  'medical.pdf'
);

function uniqueName(prefix: string) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix}-${suffix}`;
}

async function login(page: any, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
}

async function logout(page: any) {
  const userMenuButton = page.locator('header').locator('button:has(span.rounded-full)').first();
  if (await userMenuButton.isVisible().catch(() => false)) {
    await userMenuButton.click();
    await page.getByText('Logout').click();
    await page.waitForURL(/auth\/login/, { timeout: 15000 });
  }
}

async function selectLocationByPlaceholder(page: any, placeholder: string, query: string) {
  const input = page.locator(`input[placeholder="${placeholder}"]`).first();
  await input.fill(query);
  await page.waitForTimeout(500);
  const container = input.locator('..').locator('..');
  const firstOption = container.locator('ul li').first();
  await expect(firstOption).toBeVisible({ timeout: 10000 });
  await firstOption.click();
}

async function createClub(page: any, clubName: string) {
  await page.goto('/dashboard/clubs/create');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="name"]', clubName);
  await page.fill('textarea[name="description"]', 'Automated club created for E2E cross-account flow.');

  await selectLocationByPlaceholder(page, 'Search for city or address...', 'Bucharest');

  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard\/clubs\/[\w-]+/, { timeout: 15000 });
  await expect(page.locator('h1')).toContainText(/club/i);
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function publishTournament(page: any, request: any, tournamentId: string) {
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((cookie: any) => cookie.name === 'accessToken')?.value;
  expect(accessToken, 'Expected access token cookie for publishing tournament.').toBeTruthy();

  const response = await request.post(`${API_BASE_URL}/tournaments/${tournamentId}/publish`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  expect(response.ok(), `Publish tournament failed with status ${response.status()}.`).toBeTruthy();
}

async function createTournament(page: any, request: any, tournamentName: string) {
  await page.goto('/dashboard/tournaments/create');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="name"]', tournamentName);
  await page.fill('textarea[name="description"]', 'Automated tournament created for cross-account registration flow.');

  await selectLocationByPlaceholder(page, 'Search for city or venue...', 'Bucharest');

  const now = new Date();
  const registrationStart = new Date(now);
  const registrationEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);

  await page.fill('input[name="registrationStartDate"]', toDateInputValue(registrationStart));
  await page.fill('input[name="registrationEndDate"]', toDateInputValue(registrationEnd));
  await page.fill('input[name="startDate"]', toDateInputValue(startDate));
  await page.fill('input[name="endDate"]', toDateInputValue(endDate));

  await page.getByRole('button', { name: /add category/i }).click();

  await page.click('button[type="submit"]');
  await page.waitForURL(/\/main\/tournaments\/[\w-]+/, { timeout: 20000 });

  const tournamentUrl = page.url();
  const tournamentId = new URL(tournamentUrl).pathname.split('/').pop();
  expect(tournamentId).toBeTruthy();

  await publishTournament(page, request, tournamentId!);

  return { tournamentId: tournamentId!, tournamentUrl };
}

async function registerForTournament(page: any, tournamentUrl: string, clubName: string) {
  await page.goto(tournamentUrl);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: /register/i }).click();

  await expect(page.getByText('Tournament Registration')).toBeVisible({ timeout: 15000 });

  const clubRadio = page.getByRole('radio', { name: clubName });
  await clubRadio.check();
  await page.getByRole('button', { name: /^next$/i }).click();

  const medicalSection = page.locator('label', { hasText: 'Medical Declaration' }).locator('..');
  const uploadInput = medicalSection.locator('input[type="file"]');
  await uploadInput.setInputFiles(FIXTURE_PDF_PATH);

  await expect(medicalSection.getByText(/uploaded successfully/i)).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /^next$/i }).click();

  const fitnessCheckbox = page.locator('input[type="checkbox"]').first();
  await fitnessCheckbox.check();

  await page.getByRole('button', { name: /submit registration/i }).click();

  await expect(
    page.getByText('Your registration has been submitted successfully!')
  ).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: /^done$/i }).click();
  await expect(page.getByText('Tournament Registration')).toBeHidden({ timeout: 15000 });
}

test.describe.serial('Cross-account tournament registration flow', () => {
  test('create clubs, create tournaments, and register across accounts', async ({ page, request }) => {
    const clubA = uniqueName('Club-A');
    const clubB = uniqueName('Club-B');
    const tournamentA = uniqueName('Tournament-A');
    const tournamentB = uniqueName('Tournament-B');

    await login(page, ACCOUNTS.A.email, ACCOUNTS.A.password);
    await createClub(page, clubA);
    const tournamentAData = await createTournament(page, request, tournamentA);
    await logout(page);

    await login(page, ACCOUNTS.B.email, ACCOUNTS.B.password);
    await createClub(page, clubB);
    const tournamentBData = await createTournament(page, request, tournamentB);
    await logout(page);

    await login(page, ACCOUNTS.A.email, ACCOUNTS.A.password);
    await registerForTournament(page, tournamentBData.tournamentUrl, clubA);
    await logout(page);

    await login(page, ACCOUNTS.B.email, ACCOUNTS.B.password);
    await registerForTournament(page, tournamentAData.tournamentUrl, clubB);
  });
});
