import { describe, it, expect } from 'vitest';
import { getCountryNames, searchCountries } from './countries';

describe('countries', () => {
  it('builds English country names from ISO codes', () => {
    const names = getCountryNames();
    expect(names.length).toBeGreaterThan(240);
    expect(names).toContain('Romania');
  });

  it('ranks names starting with the query before ones containing it', () => {
    expect(searchCountries('rom')).toEqual(['Romania']);
    const results = searchCountries('an');
    expect(results[0].toLowerCase().startsWith('an')).toBe(true);
    expect(searchCountries('  ')).toEqual([]);
  });
});
