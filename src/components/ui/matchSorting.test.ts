import { describe, expect, it } from 'vitest';
import type { BracketMatch } from '@/types';
import { sortMatchesForDisplay } from './matchSorting';

function match(id: string, scheduledAt?: string, fieldName?: string): BracketMatch {
  return {
    id,
    round: 1,
    matchNumber: Number(id.replace(/\D/g, '')) || 1,
    team1Id: `${id}-team-1`,
    team2Id: `${id}-team-2`,
    scheduledAt,
    fieldName,
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

  it('sorts by pitch name alphabetically with numeric pitch order', () => {
    const input = [
      match('m3', '2026-06-20T09:30:00.000Z', 'Pitch 10'),
      match('m1', '2026-06-20T09:00:00.000Z', 'Pitch 2'),
      match('m4', '2026-06-20T08:00:00.000Z'),
      match('m2', '2026-06-20T10:00:00.000Z', 'Alpha'),
    ];

    expect(sortMatchesForDisplay(input, 'field').map((m) => m.id)).toEqual([
      'm2',
      'm1',
      'm3',
      'm4',
    ]);
  });
});
