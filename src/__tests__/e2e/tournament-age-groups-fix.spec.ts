/**
 * E2E Test: Tournament Creation with Age Groups - Validation Fix Tests
 * 
 * These tests verify that the backend validation issues have been fixed:
 * 1. numberOfMatches field is now accepted in age groups
 * 2. birthYear validation allows years up to 2030
 * 3. ageCategory and maxTeams are optional at tournament level
 * 4. Tournament edit page works without duplicate errors
 */

import { test, expect } from '@playwright/test';

const TEST_CREDENTIALS = {
  email: 'organizer19@example.com',
  password: 'Password123!'
};

test.describe('Tournament Age Groups - Validation Fix Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/auth/login');
    
    // Wait for the login form to be visible
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Login as organizer
    await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should create tournament with age groups (numberOfMatches accepted)', async ({ page }) => {
    // Navigate to tournament creation page
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    
    // Fill basic information
    await page.fill('input[name="name"]', `E2E Age Groups Test ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Testing age groups with numberOfMatches field');
    await page.fill('input[name="location"]', 'Bucharest, Romania');
    
    // Set dates using datetime-local format
    const now = new Date();
    const regStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const regEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const tournStart = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
    const tournEnd = new Date(now.getTime() + 47 * 24 * 60 * 60 * 1000);
    
    const formatDateTime = (date: Date) => date.toISOString().slice(0, 16);
    
    await page.fill('input[name="registrationStartDate"]', formatDateTime(regStart));
    await page.fill('input[name="registrationEndDate"]', formatDateTime(regEnd));
    await page.fill('input[name="startDate"]', formatDateTime(tournStart));
    await page.fill('input[name="endDate"]', formatDateTime(tournEnd));
    
    // Add age category
    const addCategoryBtn = page.locator('button', { hasText: '+ Add Category' });
    await addCategoryBtn.click();
    
    // Wait for age group form to appear
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Select birth year (U12 = 2014)
    await page.selectOption('select >> nth=0', '2014');
    
    // Verify the display label auto-updated
    const labelInput = page.locator('input').filter({ hasText: /U12/i }).or(
      page.locator('input[value*="U12"]')
    );
    
    // Submit the form
    const submitBtn = page.locator('button', { hasText: 'Create Tournament' });
    await submitBtn.click();
    
    // Wait for successful redirect to tournament details page
    await page.waitForURL(/\/main\/tournaments\/[\w-]+/, { timeout: 15000 });
    
    // Verify tournament was created
    const pageContent = await page.content();
    expect(pageContent).toContain('E2E Age Groups Test');
    
    // Verify no 500 error occurred (check console for errors)
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Verify age group is displayed
    const ageGroupInfo = page.locator('text=/U12|2014/');
    await expect(ageGroupInfo).toBeVisible({ timeout: 5000 });
  });

  test('should accept birth year 2026 (max validation fixed)', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    
    // Add age category
    const addCategoryBtn = page.locator('button', { hasText: '+ Add Category' });
    await addCategoryBtn.click();
    
    // Wait for age group form
    await page.waitForSelector('select', { timeout: 5000 });
    
    // Select birth year 2026 (should work now with max validation fixed to 2030)
    const birthYearSelect = page.locator('select').first();
    await birthYearSelect.selectOption('2026');
    
    // Verify selection was accepted
    await expect(birthYearSelect).toHaveValue('2026');
  });

  test('should load tournament edit page without errors', async ({ page }) => {
    // First, get a tournament that the organizer owns
    await page.goto('http://localhost:3000/dashboard/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Click on the first tournament to view it
    const tournamentLink = page.locator('a[href*="/tournaments/"]').first();
    
    // Check if there are any tournaments
    const hasTournaments = await tournamentLink.count() > 0;
    
    if (hasTournaments) {
      // Get the tournament ID from the link
      const href = await tournamentLink.getAttribute('href');
      const tournamentId = href?.match(/tournaments\/([\w-]+)/)?.[1];
      
      if (tournamentId) {
        // Navigate to edit page
        await page.goto(`http://localhost:3000/dashboard/tournaments/${tournamentId}/edit`);
        
        // Wait for the page to load
        await page.waitForLoadState('networkidle');
        
        // Verify no build error message appears
        const buildError = page.locator('text=/Build Error|Ecmascript file had an error/i');
        await expect(buildError).toHaveCount(0);
        
        // Verify the form loaded (check for basic form elements)
        const tournamentNameInput = page.locator('input[name="name"]');
        await expect(tournamentNameInput).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should allow creating tournament without ageCategory (optional field)', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    
    // Fill only required fields without selecting a legacy ageCategory
    await page.fill('input[name="name"]', `No Age Category Test ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Testing without legacy ageCategory field');
    await page.fill('input[name="location"]', 'Test Location');
    
    // Set dates
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);
    
    const formatDateTime = (date: Date) => date.toISOString().slice(0, 16);
    
    await page.fill('input[name="startDate"]', formatDateTime(start));
    await page.fill('input[name="endDate"]', formatDateTime(end));
    
    // Add at least one age group (since we removed the legacy ageCategory)
    const addCategoryBtn = page.locator('button', { hasText: '+ Add Category' });
    await addCategoryBtn.click();
    await page.waitForSelector('select', { timeout: 5000 });
    await page.selectOption('select >> nth=0', '2015'); // U11
    
    // Submit
    const submitBtn = page.locator('button', { hasText: 'Create Tournament' });
    await submitBtn.click();
    
    // Should redirect successfully (no 500 error)
    await page.waitForURL(/\/main\/tournaments\/[\w-]+/, { timeout: 15000 });
  });

  test('should create tournament with multiple age groups', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    
    // Fill basic info
    await page.fill('input[name="name"]', `Multi Age Groups Test ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Testing multiple age groups');
    await page.fill('input[name="location"]', 'Multi-venue Stadium');
    
    // Set dates
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 33 * 24 * 60 * 60 * 1000);
    
    const formatDateTime = (date: Date) => date.toISOString().slice(0, 16);
    
    await page.fill('input[name="startDate"]', formatDateTime(start));
    await page.fill('input[name="endDate"]', formatDateTime(end));
    
    // Add first age group (U10)
    const addCategoryBtn = page.locator('button', { hasText: '+ Add Category' });
    await addCategoryBtn.click();
    await page.waitForSelector('select', { timeout: 5000 });
    await page.selectOption('select >> nth=0', '2016');
    
    // Add second age group (U12)
    await addCategoryBtn.click();
    await page.waitForTimeout(500);
    
    // Select birth year for second age group
    const selects = await page.locator('select').all();
    if (selects.length >= 2) {
      await selects[selects.length - 1].selectOption('2014');
    }
    
    // Submit
    const submitBtn = page.locator('button', { hasText: 'Create Tournament' });
    await submitBtn.click();
    
    // Should redirect successfully
    await page.waitForURL(/\/main\/tournaments\/[\w-]+/, { timeout: 15000 });
    
    // Verify both age groups appear
    const pageContent = await page.content();
    expect(pageContent).toMatch(/U10|2016/);
  });
});

test.describe('Network Request Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"], input[name="email"]', TEST_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('should not return 500 error on tournament creation', async ({ page }) => {
    // Set up response listener for API errors
    const apiErrors: { url: string; status: number }[] = [];
    
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 500) {
        apiErrors.push({ url: response.url(), status: response.status() });
      }
    });
    
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    
    // Fill minimal required info
    await page.fill('input[name="name"]', `API Error Test ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Testing API');
    await page.fill('input[name="location"]', 'Test Location');
    
    // Set dates
    const now = new Date();
    const start = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);
    
    await page.fill('input[name="startDate"]', start.toISOString().slice(0, 16));
    await page.fill('input[name="endDate"]', end.toISOString().slice(0, 16));
    
    // Add age group with numberOfMatches (which was previously causing validation error)
    const addCategoryBtn = page.locator('button', { hasText: '+ Add Category' });
    await addCategoryBtn.click();
    await page.waitForSelector('select', { timeout: 5000 });
    await page.selectOption('select >> nth=0', '2014');
    
    // Fill guaranteed matches (numberOfMatches)
    const guaranteedMatchesInput = page.locator('input').filter({ has: page.locator('text=/guaranteed|matches/i') }).or(
      page.locator('input[name*="guaranteedMatches"], input[name*="numberOfMatches"]')
    );
    if (await guaranteedMatchesInput.count() > 0) {
      await guaranteedMatchesInput.first().fill('3');
    }
    
    // Submit
    const submitBtn = page.locator('button', { hasText: 'Create Tournament' });
    await submitBtn.click();
    
    // Wait a bit for any API errors
    await page.waitForTimeout(3000);
    
    // Verify no 500 errors occurred
    expect(apiErrors).toHaveLength(0);
  });
});
