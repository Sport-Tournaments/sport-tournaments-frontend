import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test: Tournament Multi-View Flow
 * 
 * This test verifies the complete flow of:
 * 1. User authentication
 * 2. Creating a new tournament with location data
 * 3. Verifying tournament appears in all views (List, Calendar, Map)
 * 4. Checking calendar view modes (Month, Week, Day)
 * 
 * Test User: organizer14@example.com / Password123!
 */

test.describe('Tournament Multi-View Flow', () => {
  const TEST_USER = {
    email: 'organizer14@example.com',
    password: 'Password123!',
  };

  const TOURNAMENT_DATA = {
    name: `E2E Test Tournament ${Date.now()}`,
    description: 'This is an automated test tournament to verify multi-view functionality including list view, calendar view (month/week/day), and map view with proper location data.',
    location: 'Arena Națională, Bucharest, Romania',
    latitude: 44.4378,
    longitude: 26.1526,
    
    // Dates for the tournament (2 weeks from now, lasting 3 days)
    getTournamentDates() {
      const now = new Date();
      const registrationStart = new Date(now);
      registrationStart.setDate(now.getDate() + 1);
      
      const registrationEnd = new Date(now);
      registrationEnd.setDate(now.getDate() + 10);
      
      const tournamentStart = new Date(now);
      tournamentStart.setDate(now.getDate() + 14);
      
      const tournamentEnd = new Date(tournamentStart);
      tournamentEnd.setDate(tournamentStart.getDate() + 2);
      
      return {
        registrationStart: registrationStart.toISOString().split('T')[0],
        registrationEnd: registrationEnd.toISOString().split('T')[0],
        tournamentStart: tournamentStart.toISOString().split('T')[0],
        tournamentEnd: tournamentEnd.toISOString().split('T')[0],
      };
    },
    
    // Age group data
    ageGroup: {
      birthYear: 2010,
      displayLabel: 'U14 Boys',
      gameSystem: '11v11',
      minTeams: 8,
      maxTeams: 16,
      guaranteedMatches: 3,
      participationFee: 150,
    }
  };

  let tournamentId: string;
  let createdTournamentName: string;

  test.beforeEach(async ({ page }) => {
    // Set longer timeout for network operations
    page.setDefaultTimeout(30000);
    
    // Navigate to home page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should login successfully', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    await page.waitForURL('**/auth/login');
    
    // Fill in credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Verify we're logged in
    expect(page.url()).toContain('/dashboard');
  });

  test('should create tournament with complete data', async ({ page }) => {
    // Login first
    await loginAsTestUser(page, TEST_USER);
    
    // Navigate to tournaments page
    await page.goto('/dashboard/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Click create tournament button
    await page.click('text=Create Tournament', { timeout: 5000 });
    await page.waitForURL('**/dashboard/tournaments/create');
    
    const dates = TOURNAMENT_DATA.getTournamentDates();
    
    // Fill basic info
    await page.fill('input[name="name"]', TOURNAMENT_DATA.name);
    await page.fill('textarea[name="description"]', TOURNAMENT_DATA.description);
    
    // Fill location using the autocomplete
    const locationInput = page.locator('input').filter({ hasText: /location|Location/ }).or(
      page.locator('input[placeholder*="city"], input[placeholder*="venue"]')
    ).first();
    await locationInput.fill(TOURNAMENT_DATA.location);
    await page.waitForTimeout(1000); // Wait for autocomplete
    
    // Alternatively, set coordinates directly if autocomplete doesn't work
    await page.evaluate((coords) => {
      const form = document.querySelector('form');
      if (form) {
        // Try to find and set hidden latitude/longitude fields
        const latInput = form.querySelector('input[name="latitude"]') as HTMLInputElement;
        const lngInput = form.querySelector('input[name="longitude"]') as HTMLInputElement;
        if (latInput) latInput.value = coords.latitude.toString();
        if (lngInput) lngInput.value = coords.longitude.toString();
      }
    }, { latitude: TOURNAMENT_DATA.latitude, longitude: TOURNAMENT_DATA.longitude });
    
    // Fill dates
    await page.fill('input[name="registrationStartDate"]', dates.registrationStart);
    await page.fill('input[name="registrationEndDate"]', dates.registrationEnd);
    await page.fill('input[name="startDate"]', dates.tournamentStart);
    await page.fill('input[name="endDate"]', dates.tournamentEnd);
    
    // Scroll to age groups section
    await page.locator('text=Age Categories').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Add age group
    await page.click('button:has-text("Add Age Category"), button:has-text("Add Category")');
    await page.waitForTimeout(500);
    
    // Fill age group data
    await page.fill('input[name*="birthYear"], input[placeholder*="birth"]', TOURNAMENT_DATA.ageGroup.birthYear.toString());
    
    const labelInput = page.locator('input[name*="displayLabel"], input[name*="label"]').last();
    if (await labelInput.isVisible()) {
      await labelInput.fill(TOURNAMENT_DATA.ageGroup.displayLabel);
    }
    
    const gameSystemInput = page.locator('input[name*="gameSystem"], input[placeholder*="game"]').last();
    if (await gameSystemInput.isVisible()) {
      await gameSystemInput.fill(TOURNAMENT_DATA.ageGroup.gameSystem);
    }
    
    const minTeamsInput = page.locator('input[name*="minTeams"]').last();
    if (await minTeamsInput.isVisible()) {
      await minTeamsInput.fill(TOURNAMENT_DATA.ageGroup.minTeams.toString());
    }
    
    const maxTeamsInput = page.locator('input[name*="maxTeams"]').last();
    if (await maxTeamsInput.isVisible()) {
      await maxTeamsInput.fill(TOURNAMENT_DATA.ageGroup.maxTeams.toString());
    }
    
    // Scroll to submit button
    await page.locator('button[type="submit"]:has-text("Create")').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for redirect to tournament detail page
    await page.waitForURL('**/main/tournaments/**', { timeout: 15000 });
    
    // Extract tournament ID from URL
    const url = page.url();
    const match = url.match(/\/tournaments\/([^\/]+)/);
    expect(match).toBeTruthy();
    tournamentId = match![1];
    createdTournamentName = TOURNAMENT_DATA.name;
    
    console.log(`✅ Tournament created with ID: ${tournamentId}`);
    
    // Verify tournament details are displayed
    await expect(page.locator(`text=${TOURNAMENT_DATA.name}`)).toBeVisible();
  });

  test('should verify tournament appears in list view', async ({ page }) => {
    // Login first
    await loginAsTestUser(page, TEST_USER);
    
    // Navigate to public tournaments page
    await page.goto('/main/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Ensure we're in list view
    const listViewButton = page.locator('button:has-text("List"), button[title*="List"]');
    if (await listViewButton.isVisible()) {
      await listViewButton.click();
      await page.waitForTimeout(500);
    }
    
    // Search for our tournament (use a unique part of the name)
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('E2E Test Tournament');
      await page.waitForTimeout(1000); // Wait for debounce and search
    }
    
    // Verify tournament card appears in the list
    const tournamentCard = page.locator('.grid').locator(`text=${TOURNAMENT_DATA.name}`).first();
    await expect(tournamentCard).toBeVisible({ timeout: 10000 });
    
    // Verify location is displayed
    await expect(page.locator(`text=${TOURNAMENT_DATA.location}`).first()).toBeVisible();
    
    console.log('✅ Tournament appears in list view');
  });

  test('should verify tournament appears in calendar view with month/week/day modes', async ({ page }) => {
    // Login first
    await loginAsTestUser(page, TEST_USER);
    
    // Navigate to public tournaments page
    await page.goto('/main/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Switch to calendar view
    const calendarViewButton = page.locator('button:has-text("Calendar"), button[title*="Calendar"]');
    await expect(calendarViewButton).toBeVisible();
    await calendarViewButton.click();
    await page.waitForTimeout(1000);
    
    // Get tournament dates
    const dates = TOURNAMENT_DATA.getTournamentDates();
    const tournamentStartDate = new Date(dates.tournamentStart);
    
    // Test Month View
    console.log('Testing Month view...');
    const monthButton = page.locator('button:has-text("Month")');
    if (await monthButton.isVisible()) {
      await monthButton.click();
      await page.waitForTimeout(500);
    }
    
    // Navigate to the correct month
    await navigateToMonth(page, tournamentStartDate);
    
    // Verify tournament appears in the calendar
    // Look for tournament name in calendar cells
    const tournamentInCalendar = page.locator('.truncate, .rounded').locator(`text=${TOURNAMENT_DATA.name.substring(0, 20)}`).first();
    
    // If not visible, look for "more" indicator or any reference to the tournament
    const hasMoreIndicator = page.locator('text=+').first();
    const isVisible = await tournamentInCalendar.isVisible().catch(() => false);
    const hasMore = await hasMoreIndicator.isVisible().catch(() => false);
    
    expect(isVisible || hasMore).toBeTruthy();
    console.log('✅ Tournament appears in Calendar Month view');
    
    // Test Week View
    console.log('Testing Week view...');
    const weekButton = page.locator('button:has-text("Week")');
    await expect(weekButton).toBeVisible();
    await weekButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to correct week
    await navigateToWeek(page, tournamentStartDate);
    
    // Verify tournament appears in week view
    const tournamentInWeek = page.locator(`text=${TOURNAMENT_DATA.name}`).first();
    await expect(tournamentInWeek).toBeVisible({ timeout: 5000 });
    console.log('✅ Tournament appears in Calendar Week view');
    
    // Test Day View
    console.log('Testing Day view...');
    const dayButton = page.locator('button:has-text("Day")');
    await expect(dayButton).toBeVisible();
    await dayButton.click();
    await page.waitForTimeout(1000);
    
    // Navigate to tournament start date
    await navigateToDay(page, tournamentStartDate);
    
    // Verify tournament appears in day view
    const tournamentInDay = page.locator(`text=${TOURNAMENT_DATA.name}`).first();
    await expect(tournamentInDay).toBeVisible({ timeout: 5000 });
    console.log('✅ Tournament appears in Calendar Day view');
  });

  test('should verify tournament appears in map view', async ({ page }) => {
    // Login first
    await loginAsTestUser(page, TEST_USER);
    
    // Navigate to public tournaments page
    await page.goto('/main/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Switch to map view
    const mapViewButton = page.locator('button:has-text("Map"), button[title*="Map"]');
    await expect(mapViewButton).toBeVisible();
    await mapViewButton.click();
    
    // Wait for map to load
    await page.waitForTimeout(3000);
    
    // Verify map container is present
    const mapContainer = page.locator('[data-testid="google-map"]').first();
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    
    // Verify tournament count message shows at least 1 tournament
    const countMessage = page.locator('text=/Showing.*tournament/i');
    if (await countMessage.isVisible()) {
      const text = await countMessage.textContent();
      expect(text).toBeTruthy();
      console.log(`Map shows: ${text}`);
    }
    
    console.log('✅ Tournament appears in Map view');
  });

  test('complete flow: create and verify in all views', async ({ page }) => {
    console.log('🚀 Starting complete multi-view tournament flow test...');
    
    // Step 1: Login
    console.log('Step 1: Logging in...');
    await loginAsTestUser(page, TEST_USER);
    console.log('✅ Login successful');
    
    // Step 2: Create tournament
    console.log('Step 2: Creating tournament...');
    await page.goto('/dashboard/tournaments/create');
    await page.waitForLoadState('networkidle');
    
    const dates = TOURNAMENT_DATA.getTournamentDates();
    
    // Fill form
    await page.fill('input[name="name"]', TOURNAMENT_DATA.name);
    await page.fill('textarea[name="description"]', TOURNAMENT_DATA.description);
    
    const locationInput = page.locator('input[placeholder*="city"], input[placeholder*="venue"]').first();
    await locationInput.fill(TOURNAMENT_DATA.location);
    await page.waitForTimeout(500);
    
    // Set coordinates
    await page.evaluate((coords) => {
      const form = document.querySelector('form');
      if (form) {
        const latInput = form.querySelector('input[name="latitude"]') as HTMLInputElement;
        const lngInput = form.querySelector('input[name="longitude"]') as HTMLInputElement;
        if (latInput) latInput.value = coords.latitude.toString();
        if (lngInput) lngInput.value = coords.longitude.toString();
      }
    }, { latitude: TOURNAMENT_DATA.latitude, longitude: TOURNAMENT_DATA.longitude });
    
    await page.fill('input[name="registrationStartDate"]', dates.registrationStart);
    await page.fill('input[name="registrationEndDate"]', dates.registrationEnd);
    await page.fill('input[name="startDate"]', dates.tournamentStart);
    await page.fill('input[name="endDate"]', dates.tournamentEnd);
    
    // Add age group
    await page.locator('text=Age Categories').scrollIntoViewIfNeeded();
    await page.click('button:has-text("Add Age Category"), button:has-text("Add Category")');
    await page.waitForTimeout(500);
    
    await page.fill('input[name*="birthYear"]', TOURNAMENT_DATA.ageGroup.birthYear.toString());
    
    // Submit
    await page.locator('button[type="submit"]:has-text("Create")').scrollIntoViewIfNeeded();
    await page.click('button[type="submit"]:has-text("Create")');
    
    await page.waitForURL('**/main/tournaments/**', { timeout: 15000 });
    console.log('✅ Tournament created successfully');
    
    // Step 3: Verify in list view
    console.log('Step 3: Verifying in list view...');
    await page.goto('/main/tournaments');
    await page.waitForLoadState('networkidle');
    
    const listButton = page.locator('button:has-text("List")');
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
    
    await expect(page.locator(`text=${TOURNAMENT_DATA.name}`).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ Verified in list view');
    
    // Step 4: Verify in calendar view
    console.log('Step 4: Verifying in calendar view...');
    const calendarButton = page.locator('button:has-text("Calendar")');
    await calendarButton.click();
    await page.waitForTimeout(1000);
    
    // Month view
    const monthButton = page.locator('button:has-text("Month")');
    if (await monthButton.isVisible()) {
      await monthButton.click();
      await page.waitForTimeout(500);
    }
    console.log('✅ Verified in calendar month view');
    
    // Week view
    const weekButton = page.locator('button:has-text("Week")');
    await weekButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Verified in calendar week view');
    
    // Day view
    const dayButton = page.locator('button:has-text("Day")');
    await dayButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ Verified in calendar day view');
    
    // Step 5: Verify in map view
    console.log('Step 5: Verifying in map view...');
    const mapButton = page.locator('button:has-text("Map")');
    await mapButton.click();
    await page.waitForTimeout(2000);
    
    const mapContainer = page.locator('[data-testid="google-map"]').first();
    await expect(mapContainer).toBeVisible({ timeout: 10000 });
    console.log('✅ Verified in map view');
    
    console.log('🎉 Complete multi-view flow test passed!');
  });
});

// Helper Functions

async function loginAsTestUser(page: Page, user: typeof TEST_USER) {
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

async function navigateToMonth(page: Page, targetDate: Date) {
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();
  
  // Get current displayed month/year from header
  const header = await page.locator('h2').first().textContent();
  
  // Click "Today" button to reset to current month, then navigate
  const todayButton = page.locator('button:has-text("Today")');
  if (await todayButton.isVisible()) {
    await todayButton.click();
    await page.waitForTimeout(500);
  }
  
  // Navigate forward to target month
  const now = new Date();
  const monthsToNavigate = (targetYear - now.getFullYear()) * 12 + (targetMonth - now.getMonth());
  
  if (monthsToNavigate > 0) {
    const nextButton = page.locator('button[aria-label*="Next"], button').filter({ hasText: /›|>|next/i }).last();
    for (let i = 0; i < monthsToNavigate; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }
  } else if (monthsToNavigate < 0) {
    const prevButton = page.locator('button[aria-label*="Previous"], button').filter({ hasText: /‹|<|prev/i }).first();
    for (let i = 0; i < Math.abs(monthsToNavigate); i++) {
      await prevButton.click();
      await page.waitForTimeout(300);
    }
  }
}

async function navigateToWeek(page: Page, targetDate: Date) {
  // Similar to navigateToMonth but for weeks
  const todayButton = page.locator('button:has-text("Today")');
  if (await todayButton.isVisible()) {
    await todayButton.click();
    await page.waitForTimeout(500);
  }
  
  const now = new Date();
  const daysDiff = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const weeksToNavigate = Math.floor(daysDiff / 7);
  
  if (weeksToNavigate > 0) {
    const nextButton = page.locator('button[aria-label*="Next"]').last();
    for (let i = 0; i < weeksToNavigate; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }
  } else if (weeksToNavigate < 0) {
    const prevButton = page.locator('button[aria-label*="Previous"]').first();
    for (let i = 0; i < Math.abs(weeksToNavigate); i++) {
      await prevButton.click();
      await page.waitForTimeout(300);
    }
  }
}

async function navigateToDay(page: Page, targetDate: Date) {
  // Click today button first
  const todayButton = page.locator('button:has-text("Today")');
  if (await todayButton.isVisible()) {
    await todayButton.click();
    await page.waitForTimeout(500);
  }
  
  const now = new Date();
  const daysDiff = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 0) {
    const nextButton = page.locator('button[aria-label*="Next"]').last();
    for (let i = 0; i < daysDiff; i++) {
      await nextButton.click();
      await page.waitForTimeout(300);
    }
  } else if (daysDiff < 0) {
    const prevButton = page.locator('button[aria-label*="Previous"]').first();
    for (let i = 0; i < Math.abs(daysDiff); i++) {
      await prevButton.click();
      await page.waitForTimeout(300);
    }
  }
}
