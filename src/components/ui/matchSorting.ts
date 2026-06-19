import type { BracketMatch } from '@/types';

export type MatchSortMode = 'datetime' | 'field';

function scheduledTimeMs(match: BracketMatch): number | null {
  if (!match.scheduledAt) return null;
  const time = new Date(match.scheduledAt).getTime();
  return Number.isFinite(time) ? time : null;
}

function fieldDisplayName(match: BracketMatch): string | null {
  const fieldName = match.fieldName?.trim();
  if (!fieldName) return null;
  return /^\d+$/.test(fieldName) ? `Pitch ${fieldName}` : fieldName;
}

function compareByDatetime(
  a: { match: BracketMatch; index: number; scheduledTime: number | null },
  b: { match: BracketMatch; index: number; scheduledTime: number | null },
): number {
  const aScheduled = a.scheduledTime != null;
  const bScheduled = b.scheduledTime != null;

  if (aScheduled && bScheduled) {
    const byTime = a.scheduledTime! - b.scheduledTime!;
    return byTime !== 0 ? byTime : a.index - b.index;
  }

  if (aScheduled) return -1;
  if (bScheduled) return 1;

  return a.index - b.index;
}

export function sortMatchesForDisplay(
  matches: BracketMatch[],
  mode: MatchSortMode = 'datetime',
): BracketMatch[] {
  return matches
    .map((match, index) => ({
      match,
      index,
      scheduledTime: scheduledTimeMs(match),
      fieldName: fieldDisplayName(match),
    }))
    .sort((a, b) => {
      if (mode === 'field') {
        const aHasField = a.fieldName != null;
        const bHasField = b.fieldName != null;

        if (aHasField && bHasField) {
          const byField = a.fieldName!.localeCompare(b.fieldName!, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
          if (byField !== 0) return byField;
          return compareByDatetime(a, b);
        }

        if (aHasField) return -1;
        if (bHasField) return 1;
      }

      return compareByDatetime(a, b);
    })
    .map(({ match }) => match);
}
