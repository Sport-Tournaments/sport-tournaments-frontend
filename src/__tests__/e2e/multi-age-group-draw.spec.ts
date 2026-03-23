import { test, expect } from './fixtures';
import type { APIRequestContext, Page } from './fixtures';

/**
 * E2E Tests for Multi-Age-Group Draw Isolation (BE#144, BE#146, BE#147, BE#148, FE#264)
 *
 * Root cause: the `groups` table had no `age_group_id` column, so groups from
 * different age groups were mixed together under the same `tournament_id`. A
 * single `tournament.drawCompleted` flag also prevented executing draws for
 * multiple age groups sequentially.
 *
 * This test verifies:
 *  1. Draw for age group A executes successfully and produces groups tagged with
 *     that age group's ID.
 *  2. Draw for age group B can be executed independently — the age-group-level
 *     `drawCompleted` flag does NOT block the second draw.
 *  3. Groups returned by GET /groups?ageGroupId=<id> are scoped correctly.
 *  4. Resetting the draw for one age group does not affect the other.
 */

const ORGANIZER = {
  email: process.env.PLAYWRIGHT_ORGANIZER_EMAIL ?? 'organizator14@turnee-sportive.ro',
  password: process.env.PLAYWRIGHT_ORGANIZER_PASSWORD ?? 'Password123!',
};

const API_BASE_URL = resolveApiBaseUrl();

// Use 2 groups × 2 teams per age group for a quick but realistic test.
const TEAMS_PER_AGE_GROUP = 4;

test.describe.serial('Multi-age-group draw isolation (BE#144 / BE#146-148 / FE#264)', () => {
  test.setTimeout(10 * 60_000);

  test('draws for two age groups are isolated and independently gated', async ({
    page,
    request,
    step,
    browserName,
    isMobile,
  }) => {
    test.skip(
      browserName !== 'chromium' || isMobile,
      'Validated in Chromium desktop only — multi-step UI automation.',
    );

    const flowId = uniqueSuffix();
    const tournamentName = `Multi-AgeGroup Draw ${flowId}`;
    const ageGroupLabelA = `U12 Flow ${flowId}`;
    const ageGroupLabelB = `U14 Flow ${flowId}`;

    let tournamentId = '';
    let accessToken = '';
    let ageGroupIdA = '';
    let ageGroupIdB = '';

    const clubsA: Array<{ clubId: string; clubName: string; teamName: string }> = [];
    const clubsB: Array<{ clubId: string; clubName: string; teamName: string }> = [];

    // ── Step 1: Login ────────────────────────────────────────────────────────
    await step('Login as organizer', async () => {
      await login(page, ORGANIZER.email, ORGANIZER.password);
      accessToken = await getAccessToken(page);
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);
    });

    // ── Step 2: Create clubs + teams for both age groups ─────────────────────
    await step('Create clubs and teams for age group A and B', async () => {
      for (let i = 0; i < TEAMS_PER_AGE_GROUP; i++) {
        const clubName = `AGA Club ${i + 1} ${flowId}`;
        const teamName = `AGA Team ${i + 1} ${flowId}`;
        const clubId = await createClubViaApi(request, accessToken, clubName);
        await createTeamViaApi(request, accessToken, clubId, teamName, 2012);
        clubsA.push({ clubId, clubName, teamName });
      }
      for (let i = 0; i < TEAMS_PER_AGE_GROUP; i++) {
        const clubName = `AGB Club ${i + 1} ${flowId}`;
        const teamName = `AGB Team ${i + 1} ${flowId}`;
        const clubId = await createClubViaApi(request, accessToken, clubName);
        await createTeamViaApi(request, accessToken, clubId, teamName, 2010);
        clubsB.push({ clubId, clubName, teamName });
      }
    });

    // ── Step 3: Create tournament with 2 age groups ──────────────────────────
    await step('Create a GROUPS_PLUS_KNOCKOUT tournament with 2 age groups', async () => {
      await page.goto('/dashboard/tournaments/create');
      await page.waitForLoadState('domcontentloaded');

      const draftDiscard = page.getByRole('button', { name: /discard/i });
      if (await draftDiscard.isVisible().catch(() => false)) {
        await draftDiscard.click();
      }

      await page.locator('input[name="name"]').fill(tournamentName);
      await page.locator('textarea[name="description"]').fill(
        'Automated E2E test for multi-age-group draw isolation (BE#144, BE#146-148).',
      );

      await selectLocation(page, 'Search for city or venue...', 'Bucuresti');

      const dates = buildTournamentDates();

      // Add age group A (U12)
      await page.getByRole('button', { name: /add age category|add category/i }).click();
      const cardA = page.locator('div.rounded-lg.border.border-gray-200.bg-white').last();
      await expect(cardA).toBeVisible({ timeout: 10_000 });
      await cardA.locator('select').nth(0).selectOption('2012');
      await cardA.locator('input[type="text"]').nth(0).fill(ageGroupLabelA);
      await cardA.locator('input[type="date"]').nth(0).fill(dates.registrationStart);
      await cardA.locator('input[type="date"]').nth(1).fill(dates.registrationEnd);
      await cardA.locator('input[type="date"]').nth(2).fill(dates.startDate);
      await cardA.locator('input[type="date"]').nth(3).fill(dates.endDate);

      // Add age group B (U14)
      await page.getByRole('button', { name: /add age category|add category/i }).click();
      const cardB = page.locator('div.rounded-lg.border.border-gray-200.bg-white').last();
      await expect(cardB).toBeVisible({ timeout: 10_000 });
      await cardB.locator('select').nth(0).selectOption('2010');
      await cardB.locator('input[type="text"]').nth(0).fill(ageGroupLabelB);
      await cardB.locator('input[type="date"]').nth(0).fill(dates.registrationStart);
      await cardB.locator('input[type="date"]').nth(1).fill(dates.registrationEnd);
      await cardB.locator('input[type="date"]').nth(2).fill(dates.startDate);
      await cardB.locator('input[type="date"]').nth(3).fill(dates.endDate);

      await page.getByRole('button', { name: /create tournament/i }).click();
      await page.waitForURL(/\/main\/tournaments\//, { timeout: 20_000 });

      tournamentId = new URL(page.url()).pathname.split('/').pop() || '';
      expect(tournamentId, 'Tournament ID must be non-empty after creation').toBeTruthy();
    });

    // ── Step 4: Fetch age group IDs from the API ─────────────────────────────
    await step('Fetch age group IDs for A and B from the tournament API', async () => {
      const resp = await request.get(`${API_BASE_URL}/tournaments/${tournamentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      expect(resp.ok(), 'Tournament fetch should succeed').toBeTruthy();
      const body = await resp.json();
      const ageGroups: Array<{ id: string; label: string }> =
        body?.data?.ageGroups ?? body?.ageGroups ?? [];

      const agA = ageGroups.find((ag) => ag.label === ageGroupLabelA || ag.label?.includes('U12'));
      const agB = ageGroups.find((ag) => ag.label === ageGroupLabelB || ag.label?.includes('U14'));

      expect(agA, 'Age group A must exist').toBeTruthy();
      expect(agB, 'Age group B must exist').toBeTruthy();

      ageGroupIdA = agA!.id;
      ageGroupIdB = agB!.id;
    });

    // ── Step 5: Register clubs for both age groups ───────────────────────────
    await step('Register clubs for age group A', async () => {
      const tournamentUrl = `/main/tournaments/${tournamentId}`;
      for (const { clubName, teamName } of clubsA) {
        await registerClubViaUi(page, tournamentUrl, clubName, teamName, ageGroupLabelA);
      }
    });

    await step('Register clubs for age group B', async () => {
      const tournamentUrl = `/main/tournaments/${tournamentId}`;
      for (const { clubName, teamName } of clubsB) {
        await registerClubViaUi(page, tournamentUrl, clubName, teamName, ageGroupLabelB);
      }
    });

    // ── Step 6: Approve all registrations via dashboard ──────────────────────
    await step('Approve all registrations', async () => {
      await page.goto(`/dashboard/tournaments/${tournamentId}?tab=registrations`);
      await page.waitForLoadState('domcontentloaded');

      const allClubs = [...clubsA, ...clubsB];
      for (const { clubName } of allClubs) {
        const row = page.locator('tr').filter({ hasText: clubName }).first();
        await expect(row).toBeVisible({ timeout: 15_000 });
        await row.getByRole('button', { name: /approve \(unpaid\)/i }).click();
      }

      await expect(page.getByText(/approved/i).first()).toBeVisible();
    });

    // ── Step 7: Execute draw for age group A ─────────────────────────────────
    await step('Execute draw for age group A via API', async () => {
      const resp = await request.post(
        `${API_BASE_URL}/tournaments/${tournamentId}/draw`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            numberOfGroups: 2,
            ageGroupId: ageGroupIdA,
          },
        },
      );
      expect(resp.ok(), `Draw for age group A failed: ${await resp.text()}`).toBeTruthy();
    });

    // ── Step 8: Verify groups for age group A are scoped ────────────────────
    await step('Verify groups for age group A are scoped by ageGroupId', async () => {
      const resp = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups?ageGroupId=${ageGroupIdA}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      const groups: Array<{ ageGroupId: string; groupLetter: string; teams: string[] }> =
        body?.data ?? body;

      expect(groups.length, 'Age group A must have 2 groups').toBe(2);
      for (const group of groups) {
        expect(group.ageGroupId, 'Each group must carry ageGroupId A').toBe(ageGroupIdA);
        expect(group.teams.length, 'Each group must have 2 teams').toBe(2);
      }
    });

    // ── Step 9: Verify age group B groups are NOT returned when scoped to A ──
    await step('Verify age group B has no groups yet (scoped query returns empty)', async () => {
      const resp = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups?ageGroupId=${ageGroupIdB}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      const groups: unknown[] = body?.data ?? body;
      expect(groups.length, 'Age group B must have 0 groups before its draw').toBe(0);
    });

    // ── Step 10: Execute draw for age group B (BE#144 fix: must not be blocked) ──
    await step(
      'Execute draw for age group B – must not be blocked by age group A drawCompleted flag',
      async () => {
        const resp = await request.post(
          `${API_BASE_URL}/tournaments/${tournamentId}/draw`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            data: {
              numberOfGroups: 2,
              ageGroupId: ageGroupIdB,
            },
          },
        );
        expect(
          resp.ok(),
          `Draw for age group B was wrongly blocked by age group A drawCompleted: ${await resp.text()}`,
        ).toBeTruthy();
      },
    );

    // ── Step 11: Verify groups for age group B are scoped ────────────────────
    await step('Verify groups for age group B are scoped by ageGroupId', async () => {
      const resp = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups?ageGroupId=${ageGroupIdB}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      const groups: Array<{ ageGroupId: string; groupLetter: string; teams: string[] }> =
        body?.data ?? body;

      expect(groups.length, 'Age group B must have 2 groups').toBe(2);
      for (const group of groups) {
        expect(group.ageGroupId, 'Each group must carry ageGroupId B').toBe(ageGroupIdB);
      }
    });

    // ── Step 12: Verify unscoped query returns groups from BOTH age groups ───
    await step('Unscoped GET /groups returns groups from both age groups', async () => {
      const resp = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(resp.ok()).toBeTruthy();
      const body = await resp.json();
      const groups: Array<{ ageGroupId: string }> = body?.data ?? body;
      expect(groups.length, 'Unscoped query must return 4 groups total').toBe(4);

      const ageGroupIds = new Set(groups.map((g) => g.ageGroupId));
      expect(ageGroupIds.has(ageGroupIdA), 'Must include age group A groups').toBe(true);
      expect(ageGroupIds.has(ageGroupIdB), 'Must include age group B groups').toBe(true);
    });

    // ── Step 13: Reset draw for age group A only ─────────────────────────────
    await step('Reset draw for age group A does NOT remove age group B groups', async () => {
      const resetResp = await request.delete(
        `${API_BASE_URL}/tournaments/${tournamentId}/draw?ageGroupId=${ageGroupIdA}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      expect(resetResp.ok(), `Reset draw for age group A failed: ${await resetResp.text()}`).toBeTruthy();

      // Age group A should now have 0 groups
      const respA = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups?ageGroupId=${ageGroupIdA}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const bodyA = await respA.json();
      const groupsA: unknown[] = bodyA?.data ?? bodyA;
      expect(groupsA.length, 'Age group A must have 0 groups after reset').toBe(0);

      // Age group B must still have 2 groups
      const respB = await request.get(
        `${API_BASE_URL}/tournaments/${tournamentId}/groups?ageGroupId=${ageGroupIdB}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const bodyB = await respB.json();
      const groupsB: Array<{ ageGroupId: string }> = bodyB?.data ?? bodyB;
      expect(groupsB.length, 'Age group B groups must survive the age group A reset').toBe(2);
      for (const group of groupsB) {
        expect(group.ageGroupId).toBe(ageGroupIdB);
      }
    });

    // ── Step 14: UI smoke check — groups tab shows age group filter ──────────
    await step('UI: groups tab shows correct groups after draw', async () => {
      await page.goto(`/dashboard/tournaments/${tournamentId}?tab=groups`);
      await page.waitForLoadState('domcontentloaded');

      // Both group letters should appear for age group B (the one still drawn)
      await expect(
        page.getByText(/group [AB]/i).first(),
      ).toBeVisible({ timeout: 10_000 });
    });
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveApiBaseUrl() {
  const raw =
    process.env.PLAYWRIGHT_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api/v1';
  const normalized = raw.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? `${normalized}/v1` : normalized;
}

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildTournamentDates() {
  const now = new Date();
  const add = (days: number) => {
    const d = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  };
  return {
    registrationStart: add(1),
    registrationEnd: add(6),
    startDate: add(10),
    endDate: add(11),
  };
}

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.waitForLoadState('domcontentloaded');
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[name="password"]').fill(password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

async function getAccessToken(page: Page) {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === 'accessToken')?.value;
  if (!token) throw new Error('Access token not found after login.');
  return token;
}

async function selectLocation(page: Page, placeholder: string, query: string) {
  const input = page.locator(`input[placeholder="${placeholder}"]`).first();
  await input.fill(query);
  await page.waitForTimeout(2_000);
  const option = page.locator('li[role="listitem"]').first();
  if (await option.isVisible().catch(() => false)) {
    await option.click();
  }
}

async function createClubViaApi(
  request: APIRequestContext,
  accessToken: string,
  clubName: string,
) {
  const resp = await request.post(`${API_BASE_URL}/clubs`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    data: {
      name: clubName,
      country: 'Romania',
      city: 'Bucharest',
      latitude: 44.4268,
      longitude: 26.1025,
      description: 'Auto-created for multi-age-group draw E2E test.',
    },
  });
  expect(resp.ok(), `Club creation failed: ${clubName}`).toBeTruthy();
  const body = await resp.json();
  const clubId = body?.data?.id ?? body?.id;
  if (!clubId) throw new Error(`No club id returned for ${clubName}`);
  return clubId as string;
}

async function createTeamViaApi(
  request: APIRequestContext,
  accessToken: string,
  clubId: string,
  teamName: string,
  birthyear: number,
) {
  const ageCategory = birthyear === 2012 ? 'U12' : 'U14';
  const resp = await request.post(`${API_BASE_URL}/teams`, {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    data: {
      clubId,
      name: teamName,
      ageCategory,
      birthyear,
      coach: `Coach ${teamName}`,
      coachPhone: '+40700000000',
    },
  });
  expect(resp.ok(), `Team creation failed: ${teamName}`).toBeTruthy();
}

async function registerClubViaUi(
  page: Page,
  tournamentUrl: string,
  clubName: string,
  teamName: string,
  ageGroupLabel: string,
) {
  await page.goto(tournamentUrl);
  await page.waitForLoadState('domcontentloaded');

  await page.getByRole('button', { name: /^register$/i }).click();
  await expect(page.getByText(/tournament registration/i)).toBeVisible({ timeout: 15_000 });

  const ageGroupRadio = page.getByRole('radio', { name: new RegExp(ageGroupLabel, 'i') });
  if (await ageGroupRadio.isVisible().catch(() => false)) {
    await ageGroupRadio.check();
  }

  await page.getByRole('radio', { name: new RegExp(clubName, 'i') }).check();
  await page.getByLabel(/team/i).selectOption({ label: teamName });
  await page.getByRole('button', { name: /^next$/i }).click();

  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', { name: /submit registration/i }).click();
  await expect(
    page.getByText(/your registration has been submitted successfully/i),
  ).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: /^done$/i }).click();
  await expect(page.getByText(/tournament registration/i)).toBeHidden({ timeout: 15_000 });
}
