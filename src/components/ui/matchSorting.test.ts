import { describe, expect, it } from 'vitest';
import type { BracketMatch } from '@/types';
import { sortMatchesForDisplay } from './matchSorting';

function match(id: string, scheduledAt?: string): BracketMatch {
  return {
    id,
    round: 1,
    matchNumber: Number(id.replace(/\D/g, '')) || 1,
    team1Id: `${id}-team-1`,
    team2Id: `${id}-team-2`,
    scheduledAt,
    status: 'PENDING',
  } as BracketMatch;
}

describe('sortMatchesForDisplay', () => {
  it('shows scheduled matches first ordered by kickoff time ascending', () => {
    const input = [
      match('unscheduled-a'),
      match('m11', '2026-06-20T11:00:00.000Z'),
      match('unscheduled-b'),
      match('m09', '2026-06-20T09:00:00.000Z'),
    ];

    expect(sortMatchesForDisplay(input).map((m) => m.id)).toEqual([
      'm09',
      'm11',
      'unscheduled-a',
      'unscheduled-b',
    ]);
  });

  it('keeps unscheduled matches in their existing order', () => {
    const input = [match('m3'), match('m1'), match('m2')];

    expect(sortMatchesForDisplay(input).map((m) => m.id)).toEqual([
      'm3',
      'm1',
      'm2',
    ]);
  });
});
