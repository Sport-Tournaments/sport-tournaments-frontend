/**
 * E2E Test: Tournament Creation with Age Groups Only
 * Tests the new simplified form where Format & Settings section is removed
 * and only Age Categories configuration remains.
 * 
 * Uses Playwright with Chrome DevTools MCP for advanced debugging
 */

import { test, expect } from '@playwright/test';

test.describe('Tournament Creation - Age Groups Only', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000/auth/login');
    
    // Login as organizer (adjust credentials based on your seed data)
    await page.fill('input[type="email"]', 'organizer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Navigate to tournament creation page
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
  });

  test('should NOT show Format & Settings section', async ({ page }) => {
    // Verify Format & Settings section is NOT present
    const formatSectionExists = await page.locator('text=Format & Settings').count();
    expect(formatSectionExists).toBe(0);
    
    // Verify these old fields do NOT exist
    const ageCategorySelect = await page.locator('select[name="ageCategory"]').count();
    const maxTeamsInput = await page.locator('input[name="maxTeams"]').count();
    const minTeamsInput = await page.locator('input[name="minTeams"]').count();
    const registrationFeeInput = await page.locator('input[name="registrationFee"]').count();
    const formatSelect = await page.locator('select[name="format"]').count();
    
    expect(ageCategorySelect).toBe(0);
    expect(maxTeamsInput).toBe(0);
    expect(minTeamsInput).toBe(0);
    expect(registrationFeeInput).toBe(0);
    expect(formatSelect).toBe(0);
  });

  test('should show Age Categories section', async ({ page }) => {
    // Verify Age Categories section exists
    const ageCategoriesSection = page.locator('text=Age Categories');
    await expect(ageCategoriesSection).toBeVisible();
    
    // Verify Add Category button exists
    const addCategoryBtn = page.locator('button', { hasText: '+ Add Category' });
    await expect(addCategoryBtn).toBeVisible();
  });

  test('should create tournament with age groups successfully', async ({ page }) => {
    // Fill basic information
    await page.fill('input[name="name"]', 'Test Youth Tournament 2026');
    await page.fill('textarea[name="description"]', 'A comprehensive test tournament for youth football with multiple age categories');
    await page.fill('input[name="location"]', 'Barcelona, Spain');
    
    // Set dates
    const startDate = '2026-07-01';
    const endDate = '2026-07-05';
    const registrationEndDate = '2026-06-20';
    
    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', endDate);
    await page.fill('input[name="registrationEndDate"]', registrationEndDate);

    // Add first age category (U12)
    await page.click('button:has-text("+ Add Category")');
    
    // Wait for the age group form to appear
    await page.waitForSelector('select:has-text("2012")', { timeout: 5000 });
    
    // Fill U12 category details
    await page.selectOption('select[name*="birthYear"]', '2014'); // U12 = 2026 - 12 = 2014
    await page.fill('input[name*="displayLabel"]', 'U12');
    await page.selectOption('select[name*="gameSystem"]', '5+1 (6-a-side)');
    await page.fill('input[name*="maxTeams"]', '16');
    await page.fill('input[name*="minTeams"]', '8');
    await page.fill('input[name*="participationFee"]', '250');
    await page.fill('input[name*="guaranteedMatches"]', '3');
    
    // Add second age category (U14)
    await page.click('button:has-text("+ Add Category")');
    await page.waitForTimeout(500); // Wait for UI to update
    
    // Fill U14 category details (select the second age group inputs)
    const ageGroupSections = await page.locator('[data-testid="age-group"]').all();
    if (ageGroupSections.length >= 2) {
      const secondAgeGroup = ageGroupSections[1];
      await secondAgeGroup.locator('select[name*="birthYear"]').selectOption('2012'); // U14 = 2026 - 14 = 2012
      await secondAgeGroup.locator('input[name*="displayLabel"]').fill('U14');
      await secondAgeGroup.locator('select[name*="gameSystem"]').selectOption('7+1 (8-a-side)');
      await secondAgeGroup.locator('input[name*="maxTeams"]').fill('16');
      await secondAgeGroup.locator('input[name*="minTeams"]').fill('8');
      await secondAgeGroup.locator('input[name*="participationFee"]').fill('300');
    }

    // Intercept the API request to verify payload
    await page.route('**/api/tournaments', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();
      
      // Verify that old fields are NOT sent
      expect(postData.ageCategory).toBeUndefined();
      expect(postData.maxTeams).toBeUndefined();
      expect(postData.format).toBeUndefined();
      expect(postData.numberOfGroups).toBeUndefined();
      expect(postData.teamsPerGroup).toBeUndefined();
      
      // Verify that ageGroups array IS sent
      expect(postData.ageGroups).toBeDefined();
      expect(Array.isArray(postData.ageGroups)).toBe(true);
      expect(postData.ageGroups.length).toBeGreaterThan(0);
      
      // Continue with the request
      await route.continue();
    });

    // Submit the form
    await page.click('button[type="submit"]:has-text("Create Tournament")');
    
    // Wait for success (redirect or success message)
    await page.waitForURL('**/dashboard/tournaments/**', { timeout: 10000 }).catch(() => {
      // If redirect doesn't happen, check for success message
      return page.waitForSelector('text=Tournament created successfully', { timeout: 5000 });
    });
  });

  test('should validate that at least one age group is required', async ({ page }) => {
    // Fill only basic information without adding age groups
    await page.fill('input[name="name"]', 'Test Tournament No Age Groups');
    await page.fill('textarea[name="description"]', 'This should fail validation');
    await page.fill('input[name="location"]', 'Madrid, Spain');
    await page.fill('input[name="startDate"]', '2026-08-01');
    await page.fill('input[name="endDate"]', '2026-08-05');
    await page.fill('input[name="registrationEndDate"]', '2026-07-20');

    // Submit without adding age groups
    await page.click('button[type="submit"]:has-text("Create Tournament")');
    
    // Should show validation error
    const errorMessage = page.locator('text=Please add at least one age category');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });
  });

  // ⚠️ SKIPPED - Location autocomplete excluded (Backend issue #15)
  test.skip('should allow location autocomplete and device location', async ({ page }) => {
    // Test location autocomplete exists
    const locationAutocomplete = page.locator('input[placeholder*="Search for"]');
    await expect(locationAutocomplete).toBeVisible();

    // Test device location button exists
    const useMyLocationBtn = page.locator('button:has-text("Use My Location")');
    await expect(useMyLocationBtn).toBeVisible();
  });

  test('should handle age group removal', async ({ page }) => {
    // Add two age groups
    await page.click('button:has-text("+ Add Category")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("+ Add Category")');
    await page.waitForTimeout(500);
    
    // Count age groups
    let ageGroups = await page.locator('[data-testid="age-group"]').count();
    expect(ageGroups).toBe(2);
    
    // Click remove on first age group
    const removeButtons = await page.locator('button:has-text("Remove")').all();
    if (removeButtons.length > 0) {
      await removeButtons[0].click();
      await page.waitForTimeout(300);
      
      // Verify one age group removed
      ageGroups = await page.locator('[data-testid="age-group"]').count();
      expect(ageGroups).toBe(1);
    }
  });

  test('should show network requests in dev tools', async ({ page }) => {
    // Enable request interception to log network activity
    page.on('request', request => {
      console.log('Request:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('Response:', response.status(), response.url());
    });

    // Fill form and observe network calls
    await page.fill('input[name="name"]', 'Network Test Tournament');
    await page.fill('textarea[name="description"]', 'Testing network requests');
    await page.fill('input[name="location"]', 'Valencia, Spain');
    await page.fill('input[name="startDate"]', '2026-09-01');
    await page.fill('input[name="endDate"]', '2026-09-05');
    await page.fill('input[name="registrationEndDate"]', '2026-08-20');

    // Add age group
    await page.click('button:has-text("+ Add Category")');
    await page.waitForTimeout(500);
    
    // Fill minimum required fields
    await page.selectOption('select[name*="birthYear"]', '2014');
    await page.fill('input[name*="displayLabel"]', 'U12');
    
    // Submit and capture network
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/tournaments') && response.request().method() === 'POST'
    );
    
    await page.click('button[type="submit"]:has-text("Create Tournament")');
    
    const response = await responsePromise;
    const status = response.status();
    const responseBody = await response.json().catch(() => null);
    
    console.log('Tournament Creation Response:', { status, body: responseBody });
    
    // Verify successful creation or capture error details
    if (status >= 400) {
      console.error('Creation failed:', responseBody);
    }
    
    expect(status).toBeLessThan(400);
  });
});

test.describe('Chrome DevTools Integration', () => {
  test('should capture console messages during tournament creation', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    page.on('console', msg => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('http://localhost:3000/auth/login');
    await page.fill('input[type="email"]', 'organizer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');

    // Log captured messages
    console.log('Console Messages:', consoleMessages);
    
    // Verify no critical errors
    const errors = consoleMessages.filter(msg => msg.includes('[error]'));
    expect(errors.length).toBe(0);
  });

  test('should capture performance metrics', async ({ page }) => {
    await page.goto('http://localhost:3000/auth/login');
    
    // Measure login performance
    const loginStart = Date.now();
    await page.fill('input[type="email"]', 'organizer@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    const loginDuration = Date.now() - loginStart;
    
    console.log('Login Duration:', loginDuration, 'ms');
    expect(loginDuration).toBeLessThan(5000); // Should complete within 5 seconds
    
    // Measure page load performance
    const pageLoadStart = Date.now();
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    const pageLoadDuration = Date.now() - pageLoadStart;
    
    console.log('Page Load Duration:', pageLoadDuration, 'ms');
    expect(pageLoadDuration).toBeLessThan(10000); // Should load within 10 seconds
  });
});
