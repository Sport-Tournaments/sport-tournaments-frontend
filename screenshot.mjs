import { firefox } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:4000';
const NOTES_DIR = '/home/gion/Distros/fedora-core/Dev/Sport-Tournaments/notes';

async function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await firefox.launch({
    args: [],
    headless: true,
    firefoxUserPrefs: {
      'media.ffmpeg.enabled': false,
    },
  });

  // ─── FE-03: Tournament Cards line-clamp ────────────────────────────────────
  console.log('\n[FE-03] Tournament cards line-clamp...');
  await ensureDir(`${NOTES_DIR}/FE-03`);

  // Desktop
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  let page = await ctx.newPage();
  await page.goto(`${BASE_URL}/main/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);
  await page.screenshot({ path: `${NOTES_DIR}/FE-03/desktop.png`, fullPage: false });
  console.log('  ✓ desktop.png saved');
  await ctx.close();

  // Mobile
  ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  page = await ctx.newPage();
  await page.goto(`${BASE_URL}/main/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);
  await page.screenshot({ path: `${NOTES_DIR}/FE-03/mobile.png`, fullPage: false });
  console.log('  ✓ mobile.png saved');
  await ctx.close();

  // ─── FE-02: Calendar null-date fallback ────────────────────────────────────
  console.log('\n[FE-02] Calendar null startDate...');
  await ensureDir(`${NOTES_DIR}/FE-02`);

  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();
  await page.goto(`${BASE_URL}/main/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);

  // Try clicking the Calendar tab
  const calendarTab = page.getByRole('tab', { name: /calendar/i });
  const calendarTabCount = await calendarTab.count();
  if (calendarTabCount > 0) {
    await calendarTab.first().click();
    await sleep(1500);
  } else {
    // look for any button that hints calendar
    const btn = page.locator('button, [role="tab"]').filter({ hasText: /calendar|calend/i });
    if (await btn.count() > 0) await btn.first().click();
    await sleep(1500);
  }
  await page.screenshot({ path: `${NOTES_DIR}/FE-02/desktop-calendar.png`, fullPage: false });
  console.log('  ✓ desktop-calendar.png saved');
  await ctx.close();

  // ─── FE-01: Dashboard DRAFT badge ──────────────────────────────────────────
  console.log('\n[FE-01] Dashboard DRAFT badge...');
  await ensureDir(`${NOTES_DIR}/FE-01`);

  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();

  // Login
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await sleep(1000);
  await page.fill('input[type="email"], input[name="email"]', 'cahangeorge@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'Hello1m$');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await sleep(2000);
  await page.screenshot({ path: `${NOTES_DIR}/FE-01/after-login.png` });
  console.log('  ✓ after-login.png saved');

  // Navigate to dashboard tournaments
  await page.goto(`${BASE_URL}/dashboard/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);
  await page.screenshot({ path: `${NOTES_DIR}/FE-01/dashboard-tournaments.png`, fullPage: false });
  console.log('  ✓ dashboard-tournaments.png saved');
  // Full page too
  await page.screenshot({ path: `${NOTES_DIR}/FE-01/dashboard-tournaments-full.png`, fullPage: true });
  console.log('  ✓ dashboard-tournaments-full.png saved');
  await ctx.close();

  // ─── FE-05: Registration wizard emergencyContact ───────────────────────────
  console.log('\n[FE-05] Registration wizard emergencyContact...');
  await ensureDir(`${NOTES_DIR}/FE-05`);

  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();

  // Re-login
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await sleep(1000);
  await page.fill('input[type="email"], input[name="email"]', 'cahangeorge@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'Hello1m$');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await sleep(2000);

  // Find a published tournament and click Register
  await page.goto(`${BASE_URL}/main/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);
  // Try to click a register button
  const registerBtn = page.locator('a, button').filter({ hasText: /register|înregistr/i });
  const regCount = await registerBtn.count();
  console.log(`  Found ${regCount} register button(s)`);

  if (regCount > 0) {
    await registerBtn.first().click();
    await sleep(2000);
    await page.screenshot({ path: `${NOTES_DIR}/FE-05/registration-step1.png` });
    console.log('  ✓ registration-step1.png saved');

    // Try to proceed to step 2 (club selection)
    const nextBtn = page.locator('button').filter({ hasText: /next|următor|continue/i });
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await sleep(1500);
    }

    // Select first club if available
    const clubOption = page.locator('[data-value], option, [role="option"]').first();
    if (await clubOption.count() > 0) {
      await clubOption.click();
      await sleep(1500);
    }

    await page.screenshot({ path: `${NOTES_DIR}/FE-05/registration-step2-emergency.png` });
    console.log('  ✓ registration-step2-emergency.png saved');
  } else {
    // take a screenshot of the tournaments list anyway
    await page.screenshot({ path: `${NOTES_DIR}/FE-05/tournaments-no-register-btn.png` });
    console.log('  ✓ tournaments-no-register-btn.png saved (no register button visible)');
  }
  await ctx.close();

  // ─── Tournament detail page (/tournaments/:id) ─────────────────────────────
  console.log('\n[Tournament Detail] testing /main/tournaments/:id ...');
  await ensureDir(`${NOTES_DIR}/FE-01`);

  // Find a tournament ID from the listing
  ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await ctx.newPage();
  await page.goto(`${BASE_URL}/main/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);

  // Click first tournament card link
  const tournamentLinks = page.locator('a[href*="/tournaments/"]');
  const linkCount = await tournamentLinks.count();
  console.log(`  Found ${linkCount} tournament link(s)`);

  if (linkCount > 0) {
    const href = await tournamentLinks.first().getAttribute('href');
    console.log(`  Navigating to: ${href}`);

    // Public (logged out) view
    const publicCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const publicPage = await publicCtx.newPage();
    await publicPage.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
    await sleep(2000);
    await publicPage.screenshot({ path: `${NOTES_DIR}/FE-01/tournament-detail-public.png`, fullPage: true });
    console.log('  ✓ tournament-detail-public.png saved');
    await publicCtx.close();
  }

  // Logged-in detail view
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle' });
  await sleep(1000);
  await page.fill('input[type="email"], input[name="email"]', 'cahangeorge@gmail.com');
  await page.fill('input[type="password"], input[name="password"]', 'Hello1m$');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
  await sleep(2000);

  await page.goto(`${BASE_URL}/main/tournaments`, { waitUntil: 'networkidle' });
  await sleep(2000);
  const loggedLinks = page.locator('a[href*="/tournaments/"]');
  if (await loggedLinks.count() > 0) {
    const href = await loggedLinks.first().getAttribute('href');
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle' });
    await sleep(2000);
    await page.screenshot({ path: `${NOTES_DIR}/FE-01/tournament-detail-loggedin.png`, fullPage: true });
    console.log('  ✓ tournament-detail-loggedin.png saved');
  }
  await ctx.close();

  await browser.close();
  console.log('\n✅ All screenshots done!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
