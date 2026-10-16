import type { TFunction } from 'i18next';

export type MatchPeriodType = 'ONE_HALF' | 'TWO_HALVES';

interface MatchTiming {
  matchPeriodType?: MatchPeriodType;
  halfDurationMinutes?: number;
  halfTimePauseMinutes?: number;
}

/**
 * Human label for the match period type. "1 half" was misread by organizers
 * as "half a match", so ONE_HALF is presented as a single continuous period.
 */
export function getMatchPeriodLabel(t: TFunction, value?: MatchPeriodType): string {
  if (value === 'ONE_HALF') {
    return t('tournaments.ageGroups.periodSingle', 'Single period (no break)');
  }
  if (value === 'TWO_HALVES') {
    return t('tournaments.ageGroups.periodTwoHalves', 'Two halves');
  }
  return '—';
}

export function getMatchPeriodOptions(t: TFunction) {
  return [
    { value: 'TWO_HALVES', label: getMatchPeriodLabel(t, 'TWO_HALVES') },
    { value: 'ONE_HALF', label: getMatchPeriodLabel(t, 'ONE_HALF') },
  ];
}

export function getMatchTotalMinutes(timing: MatchTiming): number | null {
  if (!timing.halfDurationMinutes) return null;
  const periods = timing.matchPeriodType === 'ONE_HALF' ? 1 : 2;
  const pause = periods > 1 ? timing.halfTimePauseMinutes ?? 0 : 0;
  return periods * timing.halfDurationMinutes + pause;
}

/**
 * e.g. "2 × 15 min + 5 min break = 35 min" or "1 × 25 min = 25 min".
 */
export function formatMatchDuration(t: TFunction, timing: MatchTiming): string {
  const total = getMatchTotalMinutes(timing);
  if (total === null || !timing.halfDurationMinutes) return '—';
  const periods = timing.matchPeriodType === 'ONE_HALF' ? 1 : 2;
  const pause = periods > 1 ? timing.halfTimePauseMinutes ?? 0 : 0;
  let label = `${periods} × ${timing.halfDurationMinutes} min`;
  if (pause > 0) {
    label += ` + ${pause} min ${t('tournaments.ageGroups.breakShort', 'break')}`;
  }
  return `${label} = ${total} min`;
}
