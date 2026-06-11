import { test, expect } from './fixtures';
import type { APIRequestContext, Page } from './fixtures';

const ORGANIZER = {
  email: process.env.PLAYWRIGHT_ORGANIZER_EMAIL ?? 'organizer14@turnee-sportive.ro',
  password: process.env.PLAYWRIGHT_ORGANIZER_PASSWORD ?? 'Password123!',
};

const API_BASE_URL = resolveApiBaseUrl();
const TEAMS_IN_TOURNAMENT = 32;
const NUMBER_OF_POTS = 8;
const NUMBER_OF_GROUPS = 4;

test.describe('Pot draw — 8 pots / 32 teams', () => {
  test.setTimeout(8 * 60_000);

  test('creates a tournament, assigns 32 teams across 8 pots, and executes draw into 4 groups', async ({
    page,
    request,
    step,
  }) => {
    const flowId = uniqueSuffix();
    let accessToken = '';
    let tournamentId = '';
    let ageGroupId = '';

    const ageGroupSeed = '2010';
    const registrationIds: string[] = [];

    await step('Login as organizer and capture auth token', async () => {
      await login(page, ORGANIZER.email, ORGANIZER.password);
      accessToken = await getAccessToken(page);
      await expect(page).toHaveURL(/\/dashboard/);
    });

    await step('Create one tournament with one age group (8 teams per group, 4 groups)', async () => {
      const tournamentName = `E2E Pot Draw 8x32 ${flowId}`;
      const result = await createTournamentViaApi(request, accessToken, tournamentName, ageGroupSeed);
      tournamentId = result.tournamentId;
      ageGroupId = result.ageGroupId;
      expect(tournamentId).toBeTruthy();
      expect(ageGroupId).toBeTruthy();
    });

    await step(`Create ${TEAMS_IN_TOURNAMENT} clubs + teams and register them`, async () => {
      for (let i = 0; i < TEAMS_IN_TOURNAMENT; i++) {
        const idx = i + 1;
        const clubName = `E2E Club ${flowId} ${idx}`;
        const teamName = `E2E Team ${flowId} ${idx}`;
        const clubId = await createClubViaApi(request, accessToken, clubName);
        const teamId = await createTeamViaApi(request, accessToken, clubId, teamName, Number(ageGroupSeed));

        const registrationId = await registerForTournament(
          request,
          accessToken,
          tournamentId,
          clubId,
          teamId,
          ageGroupId,
        );
        registrationIds.push(registrationId);
      }

      expect(registrationIds, `Expected ${TEAMS_IN_TOURNAMENT} registrations`).toHaveLength(
        TEAMS_IN_TOURNAMENT,
      );
    });

    await step('Approve all pending registrations', async () => {
      const pending = await getTournamentRegistrations(request, accessToken, tournamentId, 'PENDING');
      expect(pending.length, 'Expected 32 pending registrations before approval').toBe(TEAMS_IN_TOURNAMENT);
      await bulkApproveRegistrations(request, accessToken, tournamentId, pending.map((reg) => reg.id));

      const approved = await getTournamentRegistrations(request, accessToken, tournamentId, 'APPROVED');
      expect(approved.length, 'Expected 32 approved registrations').toBe(TEAMS_IN_TOURNAMENT);
    });

    await step('Close registration so pots management can be performed', async () => {
      const response = await request.patch(`${API_BASE_URL}/tournaments/${tournamentId}`, {
        headers: authHeaders(accessToken),
        data: { isRegistrationClosed: true },
      });
      expect(response.ok(), `Failed to close registration: ${await response.text()}`).toBeTruthy();
    });

    await step('Assign all approved registrations evenly to 8 pots', async () => {
      const approved = await getTournamentRegistrations(request, accessToken, tournamentId, 'APPROVED');
      const assignments = approved.map((registration, index) => ({
        registrationId: registration.id,
        potNumber: (index % NUMBER_OF_POTS) + 1,
      }));

      const response = await request.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/pots/bulk-assign`,
        {
          headers: authHeaders(accessToken),
          data: { assignments },
        },
      );
      expect(
        response.ok(),
        `Bulk assign to pots failed: ${await response.text()}`,
      ).toBeTruthy();
    });

    await step('Open pot management, set 8 pots, and verify team assignment counters', async () => {
      await page.goto(`/dashboard/tournaments/${tournamentId}/pots?ageGroupId=${ageGroupId}`);
      await expect(page.getByRole('heading', { name: 'Pot Management' })).toBeVisible({ timeout: 20_000 });

      await expect(page.getByText('Teams Assigned')).toBeVisible({ timeout: 20_000 });

      const potSelect = page
        .locator('label', { hasText: /^number of pots$/i })
        .locator('..')
        .locator('select');
      await expect(potSelect, 'Number of Pots select should be visible').toBeVisible();
      await potSelect.selectOption(String(NUMBER_OF_POTS));

      await expect(page.getByText('32 / 32')).toBeVisible({ timeout: 20_000 });

      for (let potNumber = 1; potNumber <= NUMBER_OF_POTS; potNumber += 1) {
        await expect(page.locator(`text=Pot ${potNumber}`).first()).toBeVisible({ timeout: 5_000 });
      }

      await expect(
        page.getByRole('button', { name: /^execute draw$/i }),
      ).toBeEnabled({ timeout: 5_000 });
    });

    await step('Execute draw and verify 4 groups are created', async () => {
      await page.getByRole('button', { name: /^execute draw$/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole('dialog').getByText(/create 4 groups/i)).toBeVisible();

      await page
        .getByRole('dialog')
        .getByRole('button', { name: /^execute draw$/i })
        .click();

      await expect(page.getByText('Draw Completed Successfully!')).toBeVisible({ timeout: 20_000 });
    });

    await step('Validate generated groups are 4 (not 8)', async () => {
      const response = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups?ageGroupId=${ageGroupId}`,
        { headers: authHeaders(accessToken) },
      );
      expect(response.ok(), `Unable to read groups: ${await response.text()}`).toBeTruthy();

      const body = await response.json();
      const groups = extractList(body);

      expect(groups.length, 'Expected exactly 4 groups from ageGroup.groupsCount').toBe(
        NUMBER_OF_GROUPS,
      );

      for (const group of groups) {
        expect(group.teams?.length, 'Each group should contain 8 teams').toBe(8);
      }
    });
  });
});

function resolveApiBaseUrl() {
  const raw =
    process.env.PLAYWRIGHT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api/v1';
  const normalized = raw.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? `${normalized}/v1` : normalized;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  } as const;
}

function normalizeDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(baseDate: Date, days: number) {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + days);
  return date;
}

function unwrapPayload(body: unknown) {
  if (typeof body === 'object' && body !== null && 'success' in body && 'data' in body) {
    return (body as { data: unknown }).data;
  }

  return body;
}

function extractList<T = { id: string }>(body: unknown): T[] {
  const payload = unwrapPayload(body) as { data?: T[]; items?: T[]; [key: string]: unknown } | T[];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as { data?: T[] }).data)) return (payload as { data?: T[] }).data as T[];
  if (Array.isArray((payload as { items?: T[] }).items)) return (payload as { items?: T[] }).items as T[];
  return [];
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await page.getByRole('button', { name: /sign in|login|log in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 25_000 });
}

async function getAccessToken(page: Page) {
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((cookie) => cookie.name === 'accessToken')?.value;
  if (!accessToken) {
    throw new Error('Access token missing after login.');
  }
  return accessToken;
}

async function createClubViaApi(
  request: APIRequestContext,
  accessToken: string,
  clubName: string,
) {
  const response = await request.post(`${API_BASE_URL}/clubs`, {
    headers: authHeaders(accessToken),
    data: {
      name: clubName,
      country: 'Romania',
      city: 'Bucharest',
      latitude: 44.4268,
      longitude: 26.1025,
      description: 'Auto-created club for Playwright pot draw scenario.',
    },
  });
  expect(response.ok(), `Create club failed: ${clubName}`).toBeTruthy();
  const body = await response.json();
  const payload = unwrapPayload(body) as { id?: string };
  expect(payload.id, `No club ID returned for ${clubName}`).toBeTruthy();
  return payload.id as string;
}

async function createTeamViaApi(
  request: APIRequestContext,
  accessToken: string,
  clubId: string,
  teamName: string,
  birthYear: number,
) {
  const response = await request.post(`${API_BASE_URL}/teams`, {
    headers: authHeaders(accessToken),
    data: {
      clubId,
      name: teamName,
      ageCategory: 'SENIOR',
      birthyear: birthYear,
      coach: `Coach ${teamName}`,
      coachPhone: '+40700000000',
    },
  });
  expect(response.ok(), `Create team failed: ${teamName}`).toBeTruthy();
  const body = await response.json();
  const payload = unwrapPayload(body) as { id?: string };
  expect(payload.id, `No team ID returned for ${teamName}`).toBeTruthy();
  return payload.id as string;
}

async function createTournamentViaApi(
  request: APIRequestContext,
  accessToken: string,
  tournamentName: string,
  ageGroupSeed: string,
) {
  const now = new Date();
  const response = await request.post(`${API_BASE_URL}/tournaments`, {
    headers: authHeaders(accessToken),
    data: {
      name: tournamentName,
      description:
        'Playwright E2E scenario for pot draw with 8 pots and 32 teams.',
      location: 'Bucharest',
      maxTeams: TEAMS_IN_TOURNAMENT,
      format: 'GROUPS_PLUS_KNOCKOUT',
      startDate: normalizeDate(addDays(now, 15)),
      endDate: normalizeDate(addDays(now, 18)),
      registrationStartDate: normalizeDate(addDays(now, 1)),
      registrationEndDate: normalizeDate(addDays(now, 10)),
      ageGroups: [
        {
          birthYear: Number(ageGroupSeed),
          displayLabel: `Seniors ${ageGroupSeed}`,
          format: 'GROUPS_PLUS_KNOCKOUT',
          groupsCount: NUMBER_OF_GROUPS,
          teamsPerGroup: TEAMS_IN_TOURNAMENT / NUMBER_OF_GROUPS,
          maxTeams: TEAMS_IN_TOURNAMENT,
          registrationStartDate: normalizeDate(addDays(now, 1)),
          registrationEndDate: normalizeDate(addDays(now, 10)),
          startDate: normalizeDate(addDays(now, 15)),
          endDate: normalizeDate(addDays(now, 18)),
        },
      ],
    },
  });

  expect(response.ok(), `Create tournament failed: ${await response.text()}`).toBeTruthy();
  const body = await response.json();
  const payload = unwrapPayload(body) as { id?: string; ageGroups?: Array<{ id?: string }> };
  const tournamentId = payload.id;

  if (!tournamentId) {
    const detail = `Tournament create response missing id: ${JSON.stringify(body)}`;
    throw new Error(detail);
  }

  const ageGroupId = payload.ageGroups?.[0]?.id;
  if (!ageGroupId) {
    throw new Error(`Tournament ${tournamentId} missing age group id in response: ${JSON.stringify(payload)}`);
  }

  return { tournamentId, ageGroupId };
}

async function registerForTournament(
  request: APIRequestContext,
  accessToken: string,
  tournamentId: string,
  clubId: string,
  teamId: string,
  ageGroupId: string,
) {
  const response = await request.post(`${API_BASE_URL}/tournaments/${tournamentId}/register`, {
    headers: authHeaders(accessToken),
    data: {
      clubId,
      teamId,
      ageGroupId,
    },
  });

  expect(response.ok(), `Registration failed for team ${teamId}: ${await response.text()}`).toBeTruthy();
  const body = await response.json();
  const payload = unwrapPayload(body) as { id?: string };
  expect(payload.id, `Registration response missing id for team ${teamId}`).toBeTruthy();
  return payload.id as string;
}

async function getTournamentRegistrations(
  request: APIRequestContext,
  accessToken: string,
  tournamentId: string,
  status: 'PENDING' | 'APPROVED',
) {
  const params = new URLSearchParams({
    page: '1',
    pageSize: '200',
    status,
  });
  const response = await request.get(
    `${API_BASE_URL}/tournaments/${tournamentId}/registrations?${params.toString()}`,
    { headers: authHeaders(accessToken) },
  );
  expect(response.ok(), `Get registrations failed: ${await response.text()}`).toBeTruthy();
  const body = await response.json();
  return extractList<{ id: string }>(body);
}

async function bulkApproveRegistrations(
  request: APIRequestContext,
  accessToken: string,
  tournamentId: string,
  registrationIds: string[],
) {
  const response = await request.post(`${API_BASE_URL}/tournaments/${tournamentId}/registrations/bulk-approve`, {
    headers: authHeaders(accessToken),
    data: {
      registrationIds,
      reviewNotes: 'Playwright setup auto-approve',
    },
  });
  expect(response.ok(), `Bulk approve failed: ${await response.text()}`).toBeTruthy();
}
