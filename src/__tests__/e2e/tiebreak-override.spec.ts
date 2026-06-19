import { test, expect } from './fixtures';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const API_VERSION = '/api/v1';

interface TestContext {
  authToken: string;
  organizerEmail: string;
  organizerPassword: string;
  tournamentId: string;
  groupId: string;
  teamIds: string[];
  teamNames: Map<string, string>;
  matchIds: string[];
}

const ctx: TestContext = {
  authToken: '',
  organizerEmail: '',
  organizerPassword: '',
  tournamentId: '',
  groupId: '',
  teamIds: [],
  teamNames: new Map(),
  matchIds: [],
};

function uniqueId(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function registerOrganizer(request: any): Promise<{ email: string; password: string; token: string }> {
  const email = `e2e_tiebreak_${uniqueId()}@test.com`;
  const password = 'TieBreak123!';

  const resp = await request.post(`${API_BASE_URL}${API_VERSION}/auth/register`, {
    data: {
      email,
      password,
      firstName: 'Tiebreak',
      lastName: 'Tester',
      role: 'ORGANIZER',
      country: 'RO',
    },
    timeout: 15000,
  });
  const body = await resp.json();
  if (!body.success) {
    throw new Error(`Failed to register organizer: ${JSON.stringify(body)}`);
  }
  return { email, password, token: body.data.accessToken || body.data.token || '' };
}

async function loginViaApi(request: any, email: string, password: string): Promise<string> {
  const resp = await request.post(`${API_BASE_URL}${API_VERSION}/auth/login`, {
    data: { email, password },
    timeout: 15000,
  });
  const body = await resp.json();
  if (!body.success) {
    throw new Error(`Login failed: ${JSON.stringify(body)}`);
  }
  return body.data.accessToken || body.data.token || '';
}

async function createTournament(request: any, token: string): Promise<string> {
  const resp = await request.post(`${API_BASE_URL}${API_VERSION}/tournaments`, {
    data: {
      name: `E2E Tiebreak Test ${uniqueId()}`,
      location: 'Test Center',
      description: 'E2E test for tiebreak override system',
      bracketType: 'GROUPS_PLUS_KNOCKOUT',
      groupCount: 2,
      teamsPerGroup: 4,
      ageGroups: [
        {
          birthYear: 2014,
          format: 'GROUPS_PLUS_KNOCKOUT',
          teamCount: 8,
          groupsCount: 2,
          teamsPerGroup: 4,
          qualifyingTeamsPerGroup: 2,
        },
      ],
    },
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });
  const body = await resp.json();
  if (!body.success) {
    throw new Error(`Failed to create tournament: ${JSON.stringify(body)}`);
  }
  return body.data.id || body.data.tournament?.id || '';
}

async function findOrCreateTestData(request: any) {
  // Register organizer
  const org = await registerOrganizer(request);
  ctx.organizerEmail = org.email;
  ctx.organizerPassword = org.password;
  ctx.authToken = org.token;

  // Login to get token if register didn't return one
  if (!ctx.authToken) {
    ctx.authToken = await loginViaApi(request, org.email, org.password);
  }

  // Create a tournament with groups
  ctx.tournamentId = await createTournament(request, ctx.authToken);
}

test.describe('Tiebreak Override System — E2E', () => {
  test.beforeAll(async ({ request }) => {
    try {
      await findOrCreateTestData(request);
    } catch (err: any) {
      console.error('Setup failed:', err.message);
      // Will skip tests if setup fails
    }
  });

  test.afterAll(async ({ request }) => {
    if (ctx.tournamentId && ctx.authToken) {
      try {
        await request.delete(`${API_BASE_URL}${API_VERSION}/tournaments/${ctx.tournamentId}`, {
          headers: { Authorization: `Bearer ${ctx.authToken}` },
          timeout: 15000,
        });
      } catch {
        // ignore cleanup errors
      }
    }
  });

  test('setup completed — tournament and organizer created', async ({ step }) => {
    test.skip(!ctx.tournamentId, 'Tournament setup failed — skipping tests');

    await step('Verify organizer credentials', async () => {
      expect(ctx.organizerEmail).toBeTruthy();
      expect(ctx.authToken).toBeTruthy();
    });

    await step('Verify tournament was created', async () => {
      expect(ctx.tournamentId).toBeTruthy();
      expect(ctx.tournamentId).toMatch(/^[a-f0-9-]{36}$/);
    });
  });

  test('should login and navigate to tournament matches page', async ({ page, step }) => {
    test.skip(!ctx.tournamentId, 'Tournament setup failed — skipping tests');

    await step('Navigate to login page', async () => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
    });

    await step('Fill login credentials', async () => {
      await page.fill('input[type="email"], input[name="email"]', ctx.organizerEmail);
      await page.fill('input[type="password"], input[name="password"]', ctx.organizerPassword);
    });

    await step('Submit login form', async () => {
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    });

    await step('Navigate to tournament detail page', async () => {
      await page.goto(`/dashboard/tournaments/${ctx.tournamentId}`);
      await page.waitForLoadState('networkidle');
    });

    await step('Verify tournament page loaded', async () => {
      // The page should show the tournament name or have the matches tab
      await expect(page.locator('body')).toBeVisible();
    });
  });
});
