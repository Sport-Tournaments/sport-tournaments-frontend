import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { formatMatchDuration, getMatchPeriodLabel, getMatchTotalMinutes } from '../matchFormat';

const t = ((_key: string, fallback: string) => fallback) as unknown as TFunction;

describe('matchFormat', () => {
  it('labels ONE_HALF as a single period instead of "1 half"', () => {
    expect(getMatchPeriodLabel(t, 'ONE_HALF')).toBe('Single period (no break)');
    expect(getMatchPeriodLabel(t, 'TWO_HALVES')).toBe('Two halves');
  });

  it('computes total match time including the half-time break', () => {
    expect(getMatchTotalMinutes({ matchPeriodType: 'TWO_HALVES', halfDurationMinutes: 15, halfTimePauseMinutes: 5 })).toBe(35);
    expect(formatMatchDuration(t, { matchPeriodType: 'TWO_HALVES', halfDurationMinutes: 15, halfTimePauseMinutes: 5 })).toBe(
      '2 × 15 min + 5 min break = 35 min',
    );
  });

  it('ignores the break for a single period', () => {
    expect(formatMatchDuration(t, { matchPeriodType: 'ONE_HALF', halfDurationMinutes: 25, halfTimePauseMinutes: 5 })).toBe(
      '1 × 25 min = 25 min',
    );
  });

  it('returns a dash without a duration', () => {
    expect(formatMatchDuration(t, { matchPeriodType: 'TWO_HALVES' })).toBe('—');
  });
});
