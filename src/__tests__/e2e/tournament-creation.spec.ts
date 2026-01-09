import { test, expect } from '@playwright/test';

test.describe('Tournament Creation E2E Tests', () => {
  // Setup: Login before tests
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Fill in login credentials (use test credentials from your seeded data)
    await page.fill('input[name="email"], input[type="email"]', 'organizer@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should create tournament successfully with all age categories', async ({ page }) => {
    // Navigate to tournament creation page
    await page.goto('/dashboard/tournaments/create');
    
    // Wait for form to load
    await expect(page.locator('h1')).toContainText(/create/i);
    
    // Fill in basic tournament information
    await page.fill('input[name="name"]', 'E2E Test Tournament');
    await page.fill('textarea[name="description"]', 'This is a test tournament created by automated E2E tests');
    
    // Fill in location
    await page.fill('input[name="location"]', 'Test Stadium, Bucharest');
    
    // Fill in dates
    const today = new Date();
    const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    const endDate = new Date(today.getTime() + 32 * 24 * 60 * 60 * 1000); // 32 days from now
    
    const formatDate = (date: Date) => {
      return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    };
    
    await page.fill('input[name="registrationStartDate"]', formatDate(today));
    await page.fill('input[name="registrationEndDate"]', formatDate(futureDate));
    await page.fill('input[name="startDate"]', formatDate(futureDate));
    await page.fill('input[name="endDate"]', formatDate(endDate));
    
    // Select age category
    await page.selectOption('select[name="ageCategory"]', 'SENIOR');
    
    // Fill in team settings
    await page.fill('input[name="minTeams"]', '4');
    await page.fill('input[name="maxTeams"]', '16');
    await page.fill('input[name="numberOfMatches"]', '3');
    await page.fill('input[name="registrationFee"]', '100');
    
    // Fill in group settings (if format supports it)
    const groupCountInput = page.locator('input[name="numberOfGroups"]');
    if (await groupCountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await groupCountInput.fill('4');
    }
    
    const teamsPerGroupInput = page.locator('input[name="teamsPerGroup"]');
    if (await teamsPerGroupInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teamsPerGroupInput.fill('4');
    }
    
    // Verify that the blue info box is NOT present
    const blueInfoBox = page.locator('[class*="bg-blue"], [class*="text-blue"]').filter({
      hasText: /groups|capacity|exceed/i
    });
    await expect(blueInfoBox).toHaveCount(0);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to tournament detail page
    await page.waitForURL(/\/main\/tournaments\/[\w-]+/, { timeout: 10000 });
    
    // Verify tournament was created
    await expect(page.locator('h1, h2')).toContainText('E2E Test Tournament');
  });

  // ⚠️ SKIPPED - Location autocomplete excluded (Backend issue #15)
  test.skip('should have location autocomplete functionality', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');
    
    // Look for LocationAutocomplete component
    const locationSearch = page.locator('input[placeholder*="Search"]').filter({ hasText: /city|venue/i }).or(
      page.locator('label').filter({ hasText: /search/i }).locator('~ input')
    );
    
    // Verify it exists
    const hasLocationSearch = await locationSearch.count();
    expect(hasLocationSearch).toBeGreaterThan(0);
  });

  // ⚠️ SKIPPED - Device location excluded (Backend issue #15)
  test.skip('should have device location button', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');
    
    // Look for "Use My Location" button
    const deviceLocationBtn = page.locator('button').filter({ 
      hasText: /use.*location|my location|current location/i 
    });
    
    // Verify button exists
    await expect(deviceLocationBtn).toBeVisible();
    
    // Verify it has a location icon (svg)
    const hasIcon = await deviceLocationBtn.locator('svg').count();
    expect(hasIcon).toBeGreaterThan(0);
  });

  // ⚠️ SKIPPED - Manual location excluded (Backend issue #15)
  test.skip('should have manual location input', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');
    
    // Look for manual location input field
    const locationInput = page.locator('input[name="location"]');
    
    // Verify it exists and is editable
    await expect(locationInput).toBeVisible();
    await locationInput.fill('Manual Location Entry');
    await expect(locationInput).toHaveValue('Manual Location Entry');
  });

  test('should allow adding custom age groups', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');
    
    // Scroll to age groups section
    await page.locator('text=/age.*categor/i').first().scrollIntoViewIfNeeded();
    
    // Look for AgeGroupsManager component
    const ageGroupSection = page.locator('text=/age.*categor/i').first();
    await expect(ageGroupSection).toBeVisible();
    
    // The age groups manager should be present
    // Note: Actual interaction would depend on the AgeGroupsManager component structure
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    const errorMessages = page.locator('[class*="error"], [role="alert"]').filter({ hasText: /required|must/i });
    const errorCount = await errorMessages.count();
    
    // At least one error should be present
    expect(errorCount).toBeGreaterThan(0);
  });

  test('should not show groups validation warning box', async ({ page }) => {
    await page.goto('/dashboard/tournaments/create');
    
    // Fill in group settings to trigger what would have been the info box
    const groupCountInput = page.locator('input[name="numberOfGroups"]');
    if (await groupCountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await groupCountInput.fill('4');
      
      const teamsPerGroupInput = page.locator('input[name="teamsPerGroup"]');
      if (await teamsPerGroupInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await teamsPerGroupInput.fill('4');
      }
      
      // Wait a bit for any potential UI updates
      await page.waitForTimeout(500);
      
      // Verify the blue/red warning box is NOT present
      const warningBox = page.locator('[class*="bg-blue"], [class*="bg-red"]').filter({
        hasText: /groups|capacity|exceed|total/i
      });
      
      await expect(warningBox).toHaveCount(0);
    }
  });
});

// ⚠️ SKIPPING ENTIRE SUITE - Location features excluded (Backend issues #15, #16)
test.describe.skip('Club Creation Location Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"], input[type="email"]', 'organizer@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('club create form should have all location features', async ({ page }) => {
    await page.goto('/dashboard/clubs/create');
    
    // Verify manual location input
    const cityInput = page.locator('input[name="city"]');
    await expect(cityInput).toBeVisible();
    
    // Verify LocationAutocomplete
    const locationSearch = page.locator('input[placeholder*="Search"]').filter({ hasText: /location|city|address/i }).or(
      page.locator('label').filter({ hasText: /search/i }).locator('~ input')
    );
    const hasLocationSearch = await locationSearch.count();
    expect(hasLocationSearch).toBeGreaterThan(0);
    
    // Verify device location button
    const deviceLocationBtn = page.locator('button').filter({ 
      hasText: /use.*location|my location/i 
    });
    await expect(deviceLocationBtn).toBeVisible();
  });

  test('club edit form should have all location features', async ({ page }) => {
    // First create or navigate to an existing club
    await page.goto('/dashboard/clubs');
    
    // Find first club edit link
    const editLink = page.locator('a[href*="/clubs/"][href*="/edit"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasEditLink) {
      await editLink.click();
      
      // Verify manual location input
      const cityInput = page.locator('input[name="city"]');
      await expect(cityInput).toBeVisible();
      
      // Verify LocationAutocomplete
      const locationSearch = page.locator('input[placeholder*="Search"]').filter({ hasText: /location|city|address/i }).or(
        page.locator('label').filter({ hasText: /search/i }).locator('~ input')
      );
      const hasLocationSearch = await locationSearch.count();
      expect(hasLocationSearch).toBeGreaterThan(0);
      
      // Verify device location button
      const deviceLocationBtn = page.locator('button').filter({ 
        hasText: /use.*location|my location/i 
      });
      await expect(deviceLocationBtn).toBeVisible();
    }
  });
});

// ⚠️ SKIPPING ENTIRE SUITE - Location features excluded (Backend issues #15, #16)
test.describe.skip('Tournament Edit Location Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('input[name="email"], input[type="email"]', 'organizer@test.com');
    await page.fill('input[name="password"], input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('tournament edit form should have all location features', async ({ page }) => {
    await page.goto('/dashboard/tournaments');
    
    // Find first tournament edit link
    const editLink = page.locator('a[href*="/tournaments/"][href*="/edit"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasEditLink) {
      await editLink.click();
      
      // Verify manual location input
      const locationInput = page.locator('input[name="location"]');
      await expect(locationInput).toBeVisible();
      
      // Verify LocationAutocomplete
      const locationSearch = page.locator('input[placeholder*="Search"]').filter({ hasText: /location|city|venue/i }).or(
        page.locator('label').filter({ hasText: /search/i }).locator('~ input')
      );
      const hasLocationSearch = await locationSearch.count();
      expect(hasLocationSearch).toBeGreaterThan(0);
      
      // Verify device location button
      const deviceLocationBtn = page.locator('button').filter({ 
        hasText: /use.*location|my location/i 
      });
      await expect(deviceLocationBtn).toBeVisible();
    }
  });
});
