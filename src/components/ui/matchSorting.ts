import type { BracketMatch } from '@/types';

function scheduledTimeMs(match: BracketMatch): number | null {
  if (!match.scheduledAt) return null;
  const time = new Date(match.scheduledAt).getTime();
  return Number.isFinite(time) ? time : null;
}

export function sortMatchesForDisplay(matches: BracketMatch[]): BracketMatch[] {
  return matches
    .map((match, index) => ({ match, index, scheduledTime: scheduledTimeMs(match) }))
    .sort((a, b) => {
      const aScheduled = a.scheduledTime != null;
      const bScheduled = b.scheduledTime != null;

      if (aScheduled && bScheduled) {
        const byTime = a.scheduledTime! - b.scheduledTime!;
        return byTime !== 0 ? byTime : a.index - b.index;
      }

      if (aScheduled) return -1;
      if (bScheduled) return 1;

      return a.index - b.index;
    })
    .map(({ match }) => match);
}
