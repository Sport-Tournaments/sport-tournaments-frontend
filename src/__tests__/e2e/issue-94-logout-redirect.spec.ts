import { test, expect, Page, APIRequestContext } from '@playwright/test';

test.describe('Issue #94 - Logout redirect to homepage', () => {
  test.setTimeout(60000);
  const TEST_USER = {
    email: 'organizer14@example.com',
    password: 'Password123!',
  };

  test('logout from dashboard redirects to homepage', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // Click user menu and logout
    await page.getByRole('button', { name: /Billie McKenzie/ }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    // Should redirect to homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Your Tournament, Simplified')).toBeVisible();
  });

  test('complete user flow: login -> create -> view -> update -> view -> logout -> homepage', async ({
    page,
    browserName,
    isMobile,
    request
  }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Flow test is validated in Chromium desktop for local environment stability.');

    const tournamentName = `E2E Logout Flow ${Date.now()}`;
    const updatedTournamentName = `${tournamentName} Updated`;

    // Login
    await loginAsTestUser(page, TEST_USER);
    await expect(page).toHaveURL(/\/dashboard/);

    // Create tournament
    const tournamentId = await createTournamentViaApi(request, await getAccessToken(page), tournamentName);

    // View tournament on public page
    await page.goto(`/main/tournaments/${tournamentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${tournamentName}`).first()).toBeVisible();

    // Update tournament
    await updateTournamentViaApi(request, await getAccessToken(page), tournamentId, updatedTournamentName);

    // Verify updated name on public view
    await page.goto(`/main/tournaments/${tournamentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${updatedTournamentName}`).first()).toBeVisible({ timeout: 10000 });

    // Logout from dashboard
    await page.getByRole('button', { name: /Billie McKenzie/ }).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();

    // Should be on homepage
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Your Tournament, Simplified')).toBeVisible();

    // Verify user is logged out (login/register buttons visible)
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });
});

async function loginAsTestUser(page: Page, user: { email: string; password: string }) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL('**/dashboard', { timeout: 20000 });
    return;
  } catch {
    const errorAlert = page.locator('[role="alert"]').first();
    if (await errorAlert.isVisible().catch(() => false)) {
      const message = await errorAlert.textContent();
      throw new Error(`Login failed: ${message}`);
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('/auth/login')) {
      throw new Error('Login did not redirect to dashboard.');
    }
  }
}

async function getAccessToken(page: Page) {
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((cookie) => cookie.name === 'accessToken')?.value;
  if (!accessToken) {
    throw new Error('Access token not found after login.');
  }
  return accessToken;
}

async function createTournamentViaApi(
  request: APIRequestContext,
  accessToken: string,
  tournamentName: string
) {
  const now = new Date();
  const startDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000);
  const registrationStart = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const registrationEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const response = await request.post('http://localhost:3001/api/v1/tournaments', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      name: tournamentName,
      description: 'Automated tournament for logout flow test',
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      registrationStartDate: formatDate(registrationStart),
      registrationEndDate: formatDate(registrationEnd),
      location: 'Test Location',
      maxTeams: 16,
      ageGroups: ['U12', 'U14'],
      format: 'KNOCKOUT',
      rules: 'Standard rules apply',
      prizes: 'Trophies for winners',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create tournament: ${response.status()} ${response.statusText()}`);
  }

  const responseData = await response.json();
  return responseData.data.id;
}

async function updateTournamentViaApi(
  request: APIRequestContext,
  accessToken: string,
  tournamentId: string,
  newName: string
) {
  const response = await request.patch(`http://localhost:3001/api/v1/tournaments/${tournamentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      name: newName,
      description: 'Updated tournament for logout flow test',
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to update tournament: ${response.status()} ${response.statusText()}`);
  }
}