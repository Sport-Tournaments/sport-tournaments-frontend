import { test, expect } from './fixtures';

/**
 * E2E Tests for Pot-Based Group Draw (Issue #34)
 * 
 * Tests the complete flow of:
 * 1. Logging in as an organizer
 * 2. Navigating to pot management
 * 3. Assigning teams to pots (1-4, strongest to weakest)
 * 4. Executing the draw to create groups
 * 5. Verifying authorization (non-organizers cannot access)
 */

const ORGANIZER_CREDENTIALS = {
  email: 'organizer14@example.com',
  password: 'Password123!',
};

const PARTICIPANT_CREDENTIALS = {
  email: 'participant@example.com',
  password: 'Password123!',
};

test.describe('Pot-Based Group Draw - Issue #34', () => {
  let tournamentId: string;

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    
    // Login as organizer
    await page.goto('/auth/login');
    await page.fill('input[type="email"], input[name="email"]', ORGANIZER_CREDENTIALS.email);
    await page.fill('input[type="password"], input[name="password"]', ORGANIZER_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Navigate to tournaments and select the first tournament with PUBLISHED or ONGOING status
    await page.goto('/dashboard/tournaments');
    await page.waitForLoadState('networkidle');
    
    // Find first tournament link
    const tournamentLink = page.locator('a[href*="/dashboard/tournaments/"]').first();
    await expect(tournamentLink).toBeVisible({ timeout: 5000 });
    
    // Extract tournament ID from href
    const href = await tournamentLink.getAttribute('href');
    tournamentId = href?.match(/\/dashboard\/tournaments\/([^\/]+)/)?.[1] || '';
    
    expect(tournamentId).toBeTruthy();
  });

  test('should display pot management page correctly', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /pot.*management|group.*draw/i }).first()).toBeVisible();
    
    // Check all 4 pots are displayed
    await expect(page.locator('text=/pot 1|pot one/i')).toBeVisible();
    await expect(page.locator('text=/pot 2|pot two/i')).toBeVisible();
    await expect(page.locator('text=/pot 3|pot three/i')).toBeVisible();
    await expect(page.locator('text=/pot 4|pot four/i')).toBeVisible();
    
    // Check draw configuration section
    await expect(page.locator('text=/number of groups|groups/i')).toBeVisible();
    
    // Check execute draw button exists
    await expect(page.locator('button').filter({ hasText: /execute.*draw|perform.*draw/i })).toBeVisible();
    
    // Check clear pots button exists
    await expect(page.locator('button').filter({ hasText: /clear.*pots?|reset/i })).toBeVisible();
  });

  test('should assign teams to pots successfully', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Wait for registrations to load
    await page.waitForTimeout(2000);
    
    // Get the first available team (APPROVED status)
    const firstTeamRow = page.locator('[data-testid="team-row"]').or(
      page.locator('tr').filter({ has: page.locator('button').filter({ hasText: /pot 1|pot 2|pot 3|pot 4/i }) })
    ).first();
    
    // If teams are available, try to assign one to Pot 1
    const teamsExist = await firstTeamRow.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (teamsExist) {
      // Get team name before assignment
      const teamName = await firstTeamRow.locator('text=/[A-Z]/').first().textContent();
      
      // Click Pot 1 button for this team
      await firstTeamRow.locator('button').filter({ hasText: /pot 1/i }).click();
      
      // Wait for assignment to complete
      await page.waitForTimeout(1000);
      
      // Verify team appears in Pot 1
      const pot1Section = page.locator('[data-testid="pot-1"]').or(
        page.locator('div').filter({ has: page.locator('text=/pot 1/i') })
      ).first();
      
      await expect(pot1Section).toContainText(teamName || '', { timeout: 5000 });
      
      console.log(`✓ Successfully assigned team "${teamName}" to Pot 1`);
    } else {
      console.log('⚠ No teams available for assignment (may need to create registrations)');
      test.skip();
    }
  });

  test('should validate pot distribution before draw', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Check if validation feedback is displayed
    const validationFeedback = page.locator('[data-testid="draw-validation"]').or(
      page.locator('text=/validation|ready|cannot execute/i')
    );
    
    await expect(validationFeedback).toBeVisible({ timeout: 5000 });
    
    // Check validation messages
    const validationText = await validationFeedback.textContent();
    
    // Should check for:
    // 1. Teams must be divisible by number of groups
    // 2. All pots must have equal number of teams
    expect(validationText).toMatch(/divisible|equal|balance|ready|cannot/i);
  });

  test('should execute draw and create groups', async ({ page }) => {
    // This test requires proper setup with teams assigned to pots
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Set number of groups (e.g., 2 groups)
    const groupsInput = page.locator('input[type="number"]').or(
      page.locator('input[placeholder*="groups"]')
    ).first();
    
    if (await groupsInput.isVisible({ timeout: 3000 })) {
      await groupsInput.fill('2');
    }
    
    // Check if draw can be executed (validation passes)
    const executeButton = page.locator('button').filter({ hasText: /execute.*draw/i });
    await expect(executeButton).toBeVisible();
    
    const isDisabled = await executeButton.isDisabled();
    
    if (!isDisabled) {
      // Click execute draw
      await executeButton.click();
      
      // Wait for confirmation dialog
      const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|proceed/i }).first();
      
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      // Wait for success message or redirect
      await page.waitForTimeout(2000);
      
      // Check for success notification or redirect to groups page
      const successIndicator = page.locator('[role="alert"]').or(
        page.locator('text=/success|created|complete/i')
      ).first();
      
      await expect(successIndicator).toBeVisible({ timeout: 5000 });
      
      console.log('✓ Draw executed successfully');
    } else {
      console.log('⚠ Draw validation failed (insufficient or unbalanced pot assignments)');
      test.skip();
    }
  });

  test('should clear pot assignments successfully', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Find clear pots button
    const clearButton = page.locator('button').filter({ hasText: /clear.*pots?|reset/i });
    await expect(clearButton).toBeVisible();
    
    // Click clear button
    await clearButton.click();
    
    // Wait for confirmation dialog
    const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|clear/i }).first();
    
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    // Wait for operation to complete
    await page.waitForTimeout(1000);
    
    // Verify pots are cleared - all pots should show 0 teams
    const pot1Count = page.locator('[data-testid="pot-1-count"]').or(
      page.locator('text=/pot 1/i').locator('..').locator('text=/0|empty/i')
    );
    
    await expect(pot1Count).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Pots cleared successfully');
  });

  test('should prevent non-organizers from accessing pot management', async ({ page }) => {
    // Logout first
    await page.context().clearCookies();
    
    // Login as participant
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', PARTICIPANT_CREDENTIALS.email);
    await page.fill('input[type="password"]', PARTICIPANT_CREDENTIALS.password);
    await page.click('button[type="submit"]');
    
    // Wait for login
    await page.waitForTimeout(2000);
    
    // Try to access pot management page directly
    const response = await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    
    // Should either redirect or show 403/unauthorized message
    const is403 = response?.status() === 403;
    const hasErrorMessage = await page.locator('[role="alert"]').or(
      page.locator('text=/unauthorized|forbidden|access denied/i')
    ).isVisible({ timeout: 3000 }).catch(() => false);
    
    const wasRedirected = page.url().includes('/dashboard') && !page.url().includes('/pots');
    
    expect(is403 || hasErrorMessage || wasRedirected).toBeTruthy();
    
    console.log('✓ Authorization check passed - non-organizers blocked');
  });

  test('should navigate from tournament details to pot management', async ({ page }) => {
    // Navigate to tournament details
    await page.goto(`/dashboard/tournaments/${tournamentId}`);
    await page.waitForLoadState('networkidle');
    
    // Click Groups tab
    const groupsTab = page.locator('[role="tab"]').filter({ hasText: /groups/i }).or(
      page.locator('button, a').filter({ hasText: /groups/i })
    ).first();
    
    await groupsTab.click();
    await page.waitForTimeout(1000);
    
    // Find and click "Manage Pots & Draw" button
    const managePotButton = page.locator('button, a').filter({ hasText: /manage.*pots?|pot.*draw/i });
    await expect(managePotButton).toBeVisible({ timeout: 5000 });
    
    await managePotButton.click();
    
    // Verify navigation to pot management page
    await page.waitForURL(/\/pots/, { timeout: 5000 });
    
    expect(page.url()).toContain('/pots');
    
    console.log('✓ Navigation from tournament details to pot management successful');
  });

  test('should display only APPROVED registrations for pot assignment', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Check if there's a section showing approved teams/registrations
    const approvedSection = page.locator('[data-testid="approved-teams"]').or(
      page.locator('text=/approved.*registrations|teams.*assign/i')
    );
    
    // Should only show APPROVED status teams
    const statusBadges = page.locator('[data-testid="status-badge"]').or(
      page.locator('.badge, [class*="badge"]')
    );
    
    const count = await statusBadges.count();
    
    if (count > 0) {
      // All visible badges should say "APPROVED"
      for (let i = 0; i < count; i++) {
        const badgeText = await statusBadges.nth(i).textContent();
        expect(badgeText?.toUpperCase()).toContain('APPROVED');
      }
      
      console.log(`✓ All ${count} teams shown are APPROVED`);
    } else {
      console.log('⚠ No teams with status badges found');
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Simulate network offline
    await page.context().setOffline(true);
    
    // Try to assign a team (should fail)
    const pot1Button = page.locator('button').filter({ hasText: /pot 1/i }).first();
    
    if (await pot1Button.isVisible({ timeout: 2000 })) {
      await pot1Button.click();
      
      // Wait for error message
      await page.waitForTimeout(2000);
      
      const errorMessage = page.locator('[role="alert"]').or(
        page.locator('text=/error|failed|network/i')
      );
      
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
      
      console.log('✓ Network error handled gracefully');
    }
    
    // Restore network
    await page.context().setOffline(false);
  });

  test('should show pot strength descriptions', async ({ page }) => {
    // Navigate to pot management page
    await page.goto(`/dashboard/tournaments/${tournamentId}/pots`);
    await page.waitForLoadState('networkidle');
    
    // Check for pot descriptions
    // Pot 1 should indicate "strongest" teams
    await expect(page.locator('text=/pot 1/i').locator('..').locator('text=/strongest|highest/i')).toBeVisible({ timeout: 5000 });
    
    // Pot 4 should indicate "weakest" teams
    await expect(page.locator('text=/pot 4/i').locator('..').locator('text=/weakest|lowest/i')).toBeVisible({ timeout: 5000 });
    
    console.log('✓ Pot strength descriptions displayed correctly');
  });
});
