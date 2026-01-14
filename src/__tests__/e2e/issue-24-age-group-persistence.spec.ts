/**
 * E2E Test for Issue #24: Tournament Age Group Data Persistence
 * 
 * Tests that maxTeams and guaranteedMatches fields are properly saved
 * when creating and updating tournaments with age groups.
 * 
 * Related to Issue #10: Each tournament team category (age) has specific details
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';
const FRONTEND_URL = 'http://localhost:3000';
const API_VERSION = '/api/v1';

// Test credentials
const ORGANIZER_EMAIL = 'organizer14@example.com';
const ORGANIZER_PASSWORD = 'Password123!';

test.describe('Issue #24: Tournament Age Group Data Persistence', () => {
  let authToken: string;
  let createdTournamentId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const response = await request.post(`${BASE_URL}${API_VERSION}/auth/login`, {
      data: {
        email: ORGANIZER_EMAIL,
        password: ORGANIZER_PASSWORD,
      },
    });

    if (!response.ok()) {
      const error = await response.text();
      console.log('Login failed with status:', response.status());
      console.log('Error response:', error);
    }
    
    expect(response.ok()).toBeTruthy();
    const responseData = await response.json();
    authToken = responseData.data.accessToken;
  });

  test.afterAll(async ({ request }) => {
    // Cleanup: Delete the created tournament
    if (createdTournamentId && authToken) {
      await request.delete(`${BASE_URL}/api/v1/tournaments/${createdTournamentId}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
    }
  });

  test('should save maxTeams and guaranteedMatches when creating tournament with age groups', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${FRONTEND_URL}/auth/login`);
    
    // Login
    await page.fill('input[type="email"]', ORGANIZER_EMAIL);
    await page.fill('input[type="password"]', ORGANIZER_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Navigate to create tournament page
    await page.goto(`${FRONTEND_URL}/dashboard/tournaments/create`);
    await page.waitForLoadState('networkidle');
    
    // Fill basic tournament information
    await page.fill('input[name="name"]', `Issue #24 Test Tournament ${Date.now()}`);
    await page.fill('textarea[name="description"]', 'Testing maxTeams and guaranteedMatches persistence');
    await page.fill('input[name="location"]', 'Test Location, Test City');
    
    // Set dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 30);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 2);
    
    // Format for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatDateTimeLocal = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T10:00`;
    };
    
    await page.fill('input[name="startDate"]', formatDateTimeLocal(startDate));
    await page.fill('input[name="endDate"]', formatDateTimeLocal(endDate));
    
    // Add age group with new fields
    await page.click('button:has-text("Add Category")');
    await page.waitForTimeout(500);
    
    // Expand the age group form
    const ageGroupHeader = page.locator('.cursor-pointer').first();
    await ageGroupHeader.click();
    await page.waitForTimeout(500);
    
    // Fill age group fields including new maxTeams and guaranteedMatches
    await page.selectOption('select:has-text("Birth Year")', '2015');
    await page.fill('input[type="number"]:near(:text("Min Teams"))', '4');
    await page.fill('input[type="number"]:near(:text("Max Teams"))', '16');
    await page.fill('input[type="number"]:near(:text("Guaranteed Matches"))', '5');
    await page.fill('input[type="number"]:near(:text("Participation Fee"))', '150');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Create")');
    
    // Wait for success and get the tournament ID from URL
    await page.waitForURL('**/dashboard/tournaments/**', { timeout: 15000 });
    const url = page.url();
    createdTournamentId = url.split('/').pop()?.split('?')[0] || '';
    
    // Verify the tournament was created
    expect(createdTournamentId).toBeTruthy();
    
    // Verify fields are displayed on the tournament detail page
    await page.waitForLoadState('networkidle');
    
    // Navigate back to edit to verify persistence
    await page.goto(`${FRONTEND_URL}/dashboard/tournaments/${createdTournamentId}/edit`);
    await page.waitForLoadState('networkidle');
    
    // Expand age group to check saved values
    const editAgeGroupHeader = page.locator('.cursor-pointer').first();
    await editAgeGroupHeader.click();
    await page.waitForTimeout(500);
    
    // Verify saved values
    const minTeamsInput = page.locator('input[type="number"]:near(:text("Min Teams"))');
    const maxTeamsInput = page.locator('input[type="number"]:near(:text("Max Teams"))');
    const guaranteedMatchesInput = page.locator('input[type="number"]:near(:text("Guaranteed Matches"))');
    
    await expect(minTeamsInput).toHaveValue('4');
    await expect(maxTeamsInput).toHaveValue('16');
    await expect(guaranteedMatchesInput).toHaveValue('5');
  });

  test('should persist maxTeams and guaranteedMatches when updating tournament age groups', async ({ request }) => {
    // Create a tournament via API
    const tournamentData = {
      name: `Issue #24 Update Test ${Date.now()}`,
      description: 'Testing update persistence',
      location: 'Test Location',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'EUR',
      isPrivate: false,
      ageGroups: [
        {
          birthYear: 2015,
          gameSystem: '7+1',
          teamCount: 16,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minTeams: 4,
          maxTeams: 16,
          guaranteedMatches: 3,
          participationFee: 100,
        },
      ],
    };

    const createResponse = await request.post(`${BASE_URL}${API_VERSION}/tournaments`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: tournamentData,
    });

    if (!createResponse.ok()) {
      const error = await createResponse.text();
      console.log('Tournament creation failed:', createResponse.status());
      console.log('Error:', error);
    }
    
    expect(createResponse.ok()).toBeTruthy();
    const createdTournament = await createResponse.json();
    console.log('Created tournament response:', JSON.stringify(createdTournament, null, 2));
    createdTournamentId = createdTournament.data.id;

    // Verify age group was created with correct fields
    const getResponse = await request.get(`${BASE_URL}/api/v1/tournaments/${createdTournamentId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (!getResponse.ok()) {
      const error = await getResponse.text();
      console.log('Get tournament failed:', getResponse.status());
      console.log('Error:', error);
    }
        expect(getResponse.ok()).toBeTruthy();
    const getTournamentResponse = await getResponse.json(); const tournament = getTournamentResponse.data;
    
    expect(tournament.ageGroups).toBeDefined();
    expect(tournament.ageGroups.length).toBe(1);
    expect(tournament.ageGroups[0].minTeams).toBe(4);
    expect(tournament.ageGroups[0].maxTeams).toBe(16);
    expect(tournament.ageGroups[0].guaranteedMatches).toBe(3);

    // Update the age group with new values
    const ageGroupId = tournament.ageGroups[0].id;
    const updateResponse = await request.patch(
      `${BASE_URL}/api/v1/tournaments/${createdTournamentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          ageGroups: [
            {
              id: ageGroupId,
              birthYear: 2015,
              gameSystem: '7+1',
              teamCount: 24,
              startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              minTeams: 6,
              maxTeams: 24,
              guaranteedMatches: 5,
              participationFee: 150,
            },
          ],
        },
      }
    );

    if (!updateResponse.ok()) {
      const error = await updateResponse.text();
      console.log('Update failed:', updateResponse.status());
      console.log('Error:', error);
    }
    
    expect(updateResponse.ok()).toBeTruthy();

    // Verify the update persisted
    const verifyResponse = await request.get(`${BASE_URL}/api/v1/tournaments/${createdTournamentId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(verifyResponse.ok()).toBeTruthy();
    const updatedTournamentResponse = await verifyResponse.json(); const updatedTournament = updatedTournamentResponse.data;
    
    expect(updatedTournament.ageGroups[0].minTeams).toBe(6);
    expect(updatedTournament.ageGroups[0].maxTeams).toBe(24);
    expect(updatedTournament.ageGroups[0].guaranteedMatches).toBe(5);
    expect(updatedTournament.ageGroups[0].participationFee).toBe(150);
  });

  test('should validate maxTeams is greater than or equal to minTeams', async ({ request }) => {
    // Attempt to create tournament with maxTeams < minTeams
    const invalidTournamentData = {
      name: `Issue #24 Validation Test ${Date.now()}`,
      description: 'Testing validation',
      location: 'Test Location',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'EUR',
      isPrivate: false,
      ageGroups: [
        {
          birthYear: 2015,
          gameSystem: '7+1',
          teamCount: 16,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          minTeams: 16,
          maxTeams: 8, // Invalid: less than minTeams
          guaranteedMatches: 3,
        },
      ],
    };

    const response = await request.post(`${BASE_URL}${API_VERSION}/tournaments`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: invalidTournamentData,
    });

    // Should return 400 Bad Request
    expect(response.status()).toBe(400);
    
    const error = await response.json();
    expect(error.message).toBeDefined();
  });

  test('should handle partial age group data (optional fields)', async ({ request }) => {
    // Create tournament with only required age group fields
    const minimalTournamentData = {
      name: `Issue #24 Minimal Test ${Date.now()}`,
      description: 'Testing optional fields',
      location: 'Test Location',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'EUR',
      isPrivate: false,
      ageGroups: [
        {
          birthYear: 2015,
          gameSystem: '7+1',
          teamCount: 16,
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          // maxTeams and guaranteedMatches are optional
        },
      ],
    };

    const createResponse = await request.post(`${BASE_URL}${API_VERSION}/tournaments`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      data: minimalTournamentData,
    });

    expect(createResponse.ok()).toBeTruthy();
    const tournament = await createResponse.json();
    
    // Store for cleanup
    if (!createdTournamentId) {
      createdTournamentId = tournament.id;
    }

    // Verify age group was created without the optional fields
    const getResponse = await request.get(`${BASE_URL}/api/v1/tournaments/${tournament.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    const fetchedTournamentResponse = await getResponse.json(); const fetchedTournament = fetchedTournamentResponse.data;
    
    expect(fetchedTournament.ageGroups).toBeDefined();
    expect(fetchedTournament.ageGroups.length).toBe(1);
    expect(fetchedTournament.ageGroups[0].birthYear).toBe(2015);

    // Cleanup this tournament too
    await request.delete(`${BASE_URL}/api/v1/tournaments/${tournament.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
  });
});
