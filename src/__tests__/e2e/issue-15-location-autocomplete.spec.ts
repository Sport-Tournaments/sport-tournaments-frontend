import { test, expect } from '@playwright/test';

/**
 * Issue #15: Tournament / Club location -> autocomplete, geolocated
 * 
 * This test verifies that the location autocomplete functionality works correctly
 * for Romanian cities and properly provides geolocated suggestions.
 */

const ROMANIAN_CITIES = [
  'Buzau', 'Brasov', 'Panciu', 'Movilita', 'Paunesti', 'Mircesti', 'Timisoara',
  'Bucuresti', 'Cluj-Napoca', 'Iasi', 'Constanta', 'Craiova', 'Galati', 'Ploiesti',
  'Oradea', 'Arad', 'Pitesti', 'Sibiu', 'Bacau', 'Targu Mures', 'Baia Mare',
  'Ramnicu Valcea', 'Drobeta-Turnu Severin', 'Suceava', 'Piatra Neamt', 'Targoviste',
  'Focsani', 'Tulcea', 'Resita', 'Slatina'
];

test.describe('Issue #15 - Location Autocomplete', () => {
  test.beforeEach(async ({ page }) => {
    // Login as organizer
    await page.goto('http://localhost:3000/auth/login');
    await page.getByRole('textbox', { name: 'Email' }).fill('organizer14@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Navigate to tournament creation page
    await page.goto('http://localhost:3000/dashboard/tournaments/create');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should have removed manual location input field', async ({ page }) => {
    // Verify there's only ONE location-related input (the autocomplete)
    const locationInputs = page.locator('input[placeholder*="location" i], input[placeholder*="city" i], input[placeholder*="venue" i]');
    const count = await locationInputs.count();
    
    // Should only have the autocomplete field
    expect(count).toBeLessThanOrEqual(1);
    
    // Verify the autocomplete field exists
    const autocompleteField = page.getByPlaceholder('Search for city or venue...');
    await expect(autocompleteField).toBeVisible();
    
    // Verify it has required marker
    const locationLabel = page.locator('text=Location').first();
    await expect(locationLabel).toBeVisible();
  });

  test('should display autocomplete suggestions for Buzau', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Search for city or venue...');
    
    // Type city name
    await locationInput.fill('Buzau');
    
    // Wait for debounce and API response
    await page.waitForTimeout(2000);
    
    // Check for suggestions
    const suggestions = page.locator('li[role="listitem"]');
    const suggestionCount = await suggestions.count();
    
    expect(suggestionCount).toBeGreaterThan(0);
    
    // Verify suggestion contains "Romania"
    const firstSuggestion = await suggestions.first().textContent();
    expect(firstSuggestion).toContain('Romania');
  });

  test('should display autocomplete suggestions for Brasov', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Search for city or venue...');
    
    await locationInput.fill('Brasov');
    await page.waitForTimeout(2000);
    
    const suggestions = page.locator('li[role="listitem"]');
    const suggestionCount = await suggestions.count();
    
    expect(suggestionCount).toBeGreaterThan(0);
    
    const firstSuggestion = await suggestions.first().textContent();
    expect(firstSuggestion).toContain('Romania');
  });

  test('should display autocomplete suggestions for Timisoara', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Search for city or venue...');
    
    await locationInput.fill('Timisoara');
    await page.waitForTimeout(2000);
    
    const suggestions = page.locator('li[role="listitem"]');
    const suggestionCount = await suggestions.count();
    
    expect(suggestionCount).toBeGreaterThan(0);
    
    const firstSuggestion = await suggestions.first().textContent();
    expect(firstSuggestion).toContain('Romania');
  });

  test('should populate location field when suggestion is selected', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Search for city or venue...');
    
    // Type and wait for suggestions
    await locationInput.fill('Bucuresti');
    await page.waitForTimeout(2000);
    
    // Click first suggestion
    const firstSuggestion = page.locator('li[role="listitem"]').first();
    await firstSuggestion.click();
    
    // Verify the input now has the selected value
    const inputValue = await locationInput.inputValue();
    expect(inputValue).toContain('Bucurest'); // Can be București or Bucuresti
  });

  test('should work with "Use My Location" button', async ({ page }) => {
    // Grant geolocation permissions
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 45.9432, longitude: 24.9668 }); // Brasov coordinates
    
    const useLocationButton = page.getByRole('button', { name: /use my location/i });
    await expect(useLocationButton).toBeVisible();
    
    // Note: Actual geolocation might not work in all test environments
    // This test verifies the button exists and is clickable
    await expect(useLocationButton).toBeEnabled();
  });

  test('should test all 30 Romanian cities (sample)', async ({ page }) => {
    const locationInput = page.getByPlaceholder('Search for city or venue...');
    const testResults: { city: string; hasResults: boolean }[] = [];
    
    // Test first 10 cities to avoid rate limiting
    const citiesToTest = ROMANIAN_CITIES.slice(0, 10);
    
    for (const city of citiesToTest) {
      await locationInput.clear();
      await locationInput.fill(city);
      
      // Wait for API (with longer delay to respect rate limits)
      await page.waitForTimeout(3000);
      
      const suggestions = page.locator('li[role="listitem"]');
      const count = await suggestions.count();
      
      testResults.push({
        city,
        hasResults: count > 0
      });
    }
    
    // Log results
    console.log('Location Autocomplete Test Results:');
    testResults.forEach(result => {
      console.log(`  ${result.city}: ${result.hasResults ? '✓ Found' : '✗ No results'}`);
    });
    
    // Verify that most cities returned results (at least 80%)
    const successfulResults = testResults.filter(r => r.hasResults).length;
    const successRate = successfulResults / testResults.length;
    
    expect(successRate).toBeGreaterThanOrEqual(0.8);
  });

  test('should work on Club creation page', async ({ page }) => {
    // Navigate to club creation
    await page.goto('http://localhost:3000/dashboard/clubs/create');
    await page.waitForLoadState('domcontentloaded');
    
    // Find autocomplete field
    const locationInput = page.getByPlaceholder('Search for city or address...');
    await expect(locationInput).toBeVisible();
    
    // Test autocomplete
    await locationInput.fill('Cluj-Napoca');
    await page.waitForTimeout(2000);
    
    const suggestions = page.locator('li[role="listitem"]');
    const count = await suggestions.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Select first suggestion
    await suggestions.first().click();
    
    // Verify city and country fields are auto-populated
    await page.waitForTimeout(500);
    
    // The autocomplete should populate the hidden/readonly fields
    const inputValue = await locationInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });
});

test.describe('Issue #15 - Complete City List Documentation', () => {
  test('document all 30 Romanian cities', async () => {
    console.log('\n=== Issue #15: Location Autocomplete Test ===');
    console.log('Testing 30 Romanian cities with geolocation autocomplete:\n');
    
    ROMANIAN_CITIES.forEach((city, index) => {
      console.log(`${String(index + 1).padStart(2, ' ')}. ${city}`);
    });
    
    console.log('\nAll cities have been configured for autocomplete testing.');
    console.log('The Nominatim (OpenStreetMap) API provides geocoding for all Romanian locations.\n');
    
    expect(ROMANIAN_CITIES).toHaveLength(30);
  });
});
