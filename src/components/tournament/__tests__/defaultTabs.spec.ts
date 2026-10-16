import { describe, expect, it } from 'vitest';
import type { AgeGroup } from '@/types';
import { getDefaultTournamentTabs, isAgeGroupLive } from '../defaultTabs';

const ag = (id: string, startDate?: string, endDate?: string): AgeGroup =>
  ({ id, birthYear: 2014, startDate, endDate }) as AgeGroup;

const today = new Date(2026, 9, 16); // 2026-10-16

describe('isAgeGroupLive', () => {
  it('is live when today is within start/end (inclusive)', () => {
    expect(isAgeGroupLive(ag('a', '2026-10-16', '2026-10-17'), today)).toBe(true);
    expect(isAgeGroupLive(ag('a', '2026-10-15', '2026-10-16'), today)).toBe(true);
    expect(isAgeGroupLive(ag('a', '2026-10-16T00:00:00.000Z'), today)).toBe(true);
  });

  it('is not live outside the dates or without dates', () => {
    expect(isAgeGroupLive(ag('a', '2026-10-17', '2026-10-18'), today)).toBe(false);
    expect(isAgeGroupLive(ag('a'), today)).toBe(false);
  });
});

describe('getDefaultTournamentTabs', () => {
  const ageGroups = [
    ag('u10', '2026-10-10', '2026-10-11'),
    ag('u12', '2026-10-16', '2026-10-17'),
    ag('u14', '2026-10-20', '2026-10-21'),
  ];

  it('opens the age group playing today on Matches, not the first one', () => {
    expect(getDefaultTournamentTabs({ status: 'ONGOING', ageGroups }, { today })).toEqual({
      ageGroupTab: 'age-group-u12',
      innerTab: 'matches',
    });
  });

  it('falls back to the next age group to start while ONGOING with nothing today', () => {
    const groups = [ag('u10', '2026-10-10', '2026-10-11'), ag('u14', '2026-10-20', '2026-10-21')];
    expect(getDefaultTournamentTabs({ status: 'ONGOING', ageGroups: groups }, { today })).toEqual({
      ageGroupTab: 'age-group-u14',
      innerTab: 'matches',
    });
  });

  it('opens the first age group on Overview when not in progress', () => {
    const groups = [ag('u10', '2026-11-10'), ag('u12', '2026-11-12')];
    expect(getDefaultTournamentTabs({ status: 'PUBLISHED', ageGroups: groups }, { today })).toEqual({
      ageGroupTab: 'age-group-u10',
      innerTab: 'overview',
    });
  });

  it('honours ?ageGroup= and ?tab= from the URL', () => {
    expect(
      getDefaultTournamentTabs(
        { status: 'ONGOING', ageGroups },
        { today, requestedAgeGroupTab: 'u14', requestedInnerTab: 'teams' },
      ),
    ).toEqual({ ageGroupTab: 'age-group-u14', innerTab: 'teams' });

    expect(
      getDefaultTournamentTabs(
        { status: 'PUBLISHED', ageGroups },
        { today, requestedAgeGroupTab: 'age-group-u10', requestedInnerTab: 'bogus' },
      ),
    ).toEqual({ ageGroupTab: 'age-group-u10', innerTab: 'overview' });
  });

  it('handles tournaments without age groups', () => {
    expect(getDefaultTournamentTabs({ status: 'ONGOING', ageGroups: [] }, { today })).toEqual({
      ageGroupTab: undefined,
      innerTab: 'matches',
    });
  });
});
