import { test, expect } from './fixtures';

type PublicRoute = {
  path: string;
  headingSelector?: string;
};

const PUBLIC_ROUTES: PublicRoute[] = [
  { path: '/' },
  { path: '/main/tournaments' },
  { path: '/main/clubs' },
  { path: '/how-it-works' },
  { path: '/pricing' },
  { path: '/help' },
  { path: '/contact' },
  { path: '/faq' },
  { path: '/terms' },
  { path: '/privacy' },
  { path: '/gdpr' },
  { path: '/cookies' },
  { path: '/auth/login' },
  { path: '/auth/register' },
  { path: '/auth/forgot-password' },
];

test.describe('Public routes flow', () => {
  test('all critical public pages render successfully', async ({ page, step }) => {
    for (const route of PUBLIC_ROUTES) {
      await step(`Load ${route.path}`, async () => {
        const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

        expect(response, `Missing response for route ${route.path}`).toBeTruthy();
        expect(response?.status(), `Unexpected status for route ${route.path}`).toBeLessThan(400);

        const mainContent = page.locator('main, body').first();
        await expect(mainContent, `Main content missing on route ${route.path}`).toBeVisible();

        const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
        expect(hasHeading, `Missing visible heading on route ${route.path}`).toBe(true);
      });
    }
  });

  // Desktop nav is `hidden lg:flex` — only run on desktop viewports
  test('desktop navigation can reach tournaments and clubs', async ({ page, step, viewport }) => {
    if (viewport && viewport.width < 1024) {
      test.skip();
      return;
    }

    await step('Open homepage', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await step('Navigate to Tournaments via header link', async () => {
      await page.locator('header a[href="/main/tournaments"]').first().click();
      await expect(page).toHaveURL(/\/main\/tournaments/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    await step('Return to homepage', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await step('Navigate to Clubs via header link', async () => {
      await page.locator('header a[href="/main/clubs"]').first().click();
      await expect(page).toHaveURL(/\/main\/clubs/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  });

  test('footer legal and support links resolve', async ({ page, step }) => {
    const footerLinks = [
      '/how-it-works',
      '/pricing',
      '/help',
      '/contact',
      '/faq',
      '/terms',
      '/privacy',
      '/gdpr',
      '/cookies',
    ];

    await step('Verify footer links exist on homepage', async () => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      for (const href of footerLinks) {
        await expect(page.locator(`footer a[href="${href}"]`).first()).toBeAttached();
      }
    });

    for (const href of footerLinks) {
      await step(`Load footer target: ${href}`, async () => {
        const response = await page.goto(href, { waitUntil: 'domcontentloaded' });
        expect(response?.status(), `Unexpected status for ${href}`).toBeLessThan(400);
        await expect(page.locator('h1, h2').first()).toBeVisible();
      });
    }
  });

  test('mobile menu opens and navigates to clubs', async ({ page, step }) => {
    await step('Open homepage at mobile viewport', async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    await step('Open mobile hamburger menu', async () => {
      const menuBtn = page.locator('header button[aria-label="Toggle menu"]');
      await expect(menuBtn).toBeVisible();
      await menuBtn.click();
    });

    await step('Click Clubs link in mobile menu', async () => {
      // Mobile menu links have class 'block rounded-lg px-3' (desktop nav links have 'inline-flex').
      const clubsLink = page.locator('a.block[href="/main/clubs"]');
      await expect(clubsLink).toBeVisible({ timeout: 7000 });
      await clubsLink.click();

      await expect(page).toHaveURL(/\/main\/clubs/);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  });
});
