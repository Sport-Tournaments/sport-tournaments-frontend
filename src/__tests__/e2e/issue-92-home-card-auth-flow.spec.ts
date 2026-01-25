import { test, expect, Page, APIRequestContext } from '@playwright/test';

test.describe('Issue #92 - Homepage card auth + tournament flow', () => {
  test.setTimeout(60000);
  const TEST_USER = {
    email: 'organizer14@example.com',
    password: 'Password123!',
  };

  test('redirects unauthenticated users to login when clicking a homepage feature card', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const featureCard = page.getByRole('button', { name: /Tournament Management/i });
    await expect(featureCard).toBeVisible();
    await featureCard.click();

    await expect(page).toHaveURL(/\/auth\/login\?callbackUrl=/);
    await expect(page).toHaveURL(/callbackUrl=%2Fdashboard%2Ftournaments/);
  });

  test('create -> view, update -> view tournament flow', async ({ page, browserName, isMobile, request }) => {
    test.skip(browserName !== 'chromium' || isMobile, 'Flow test is validated in Chromium desktop for local environment stability.');
    const tournamentName = `E2E Auth Flow ${Date.now()}`;
    const updatedTournamentName = `${tournamentName} Updated`;

    await loginAsTestUser(page, TEST_USER);

    const accessToken = await getAccessToken(page);
    const tournamentId = await createTournamentViaApi(request, accessToken, tournamentName);

    await page.goto(`/main/tournaments/${tournamentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${tournamentName}`).first()).toBeVisible();

    await updateTournamentViaApi(request, accessToken, tournamentId, updatedTournamentName);

    // Verify updated name on public view
    await page.goto(`/main/tournaments/${tournamentId}`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator(`text=${updatedTournamentName}`).first()).toBeVisible({ timeout: 10000 });
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
      description: 'Automated tournament for create/view/update flow',
      location: 'Bucharest, Romania',
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      registrationStartDate: formatDate(registrationStart),
      registrationEndDate: formatDate(registrationEnd),
      ageGroups: [
        {
          birthYear: 2012,
          gameSystem: '7+1',
          teamCount: 8,
          groupsCount: 2,
          teamsPerGroup: 4,
        },
      ],
    },
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  const tournamentId = payload?.data?.id as string | undefined;

  if (!tournamentId) {
    throw new Error('Failed to create tournament via API.');
  }

  return tournamentId;
}

async function updateTournamentViaApi(
  request: APIRequestContext,
  accessToken: string,
  tournamentId: string,
  updatedName: string
) {
  const response = await request.patch(`http://localhost:3001/api/v1/tournaments/${tournamentId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data: {
      name: updatedName,
    },
  });

  expect(response.ok()).toBeTruthy();
}

async function closeMobileSidebarIfOpen(page: Page) {
  const closeButton = page.getByLabel('Close sidebar');
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
}
