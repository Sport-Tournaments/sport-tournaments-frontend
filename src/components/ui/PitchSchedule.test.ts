import { describe, expect, it } from 'vitest';
import type { BracketMatch } from '@/types';
import { groupMatchesByPitch } from './PitchSchedule';

function match(id: string, fieldName?: string, scheduledAt?: string, groupLetter?: string): BracketMatch {
  return { id, round: 1, matchNumber: 1, fieldName, scheduledAt, groupLetter, status: 'PENDING' } as BracketMatch;
}

describe('groupMatchesByPitch', () => {
  it('groups matches across groups by pitch, sorted naturally, with kickoff order inside', () => {
    const sections = groupMatchesByPitch([
      match('a', '10', '2026-06-01T10:00:00Z', 'A'),
      match('b', '2', '2026-06-01T11:00:00Z', 'A'),
      match('c', '2', '2026-06-01T09:00:00Z', 'B'),
      match('d', ' 2 ', '2026-06-01T10:00:00Z', 'C'),
    ]);

    expect(sections.map((s) => s.label)).toEqual(['Pitch 2', 'Pitch 10']);
    expect(sections[0].matches.map((m) => m.id)).toEqual(['c', 'd', 'b']);
    expect(sections[1].matches.map((m) => m.id)).toEqual(['a']);
  });

  it('keeps named pitches as-is and puts matches without a pitch last', () => {
    const sections = groupMatchesByPitch([
      match('a'),
      match('b', 'Main Stadium'),
      match('c', '   '),
      match('d', '1'),
    ]);

    expect(sections.map((s) => s.label)).toEqual(['Main Stadium', 'Pitch 1', null]);
    expect(sections[2].matches.map((m) => m.id)).toEqual(['a', 'c']);
  });
});
