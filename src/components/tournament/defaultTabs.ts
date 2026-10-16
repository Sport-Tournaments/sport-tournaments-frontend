import type { AgeGroup, Tournament } from '@/types';

export type InnerTabId = 'overview' | 'teams' | 'groups' | 'matches';

export const INNER_TAB_IDS: InnerTabId[] = ['overview', 'teams', 'groups', 'matches'];

export function getAgeGroupTabId(ageGroup: AgeGroup, index: number): string {
  return `age-group-${ageGroup.id ?? index}`;
}

function toDateKey(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match ? match[1] : null;
}

/** True when today falls within the age group's play dates. */
export function isAgeGroupLive(ageGroup: AgeGroup, today: Date = new Date()): boolean {
  const start = toDateKey(ageGroup.startDate);
  const end = toDateKey(ageGroup.endDate) ?? start;
  const now = toDateKey(today);
  if (!start || !end || !now) return false;
  return start <= now && now <= end;
}

/**
 * Picks which age group tab and inner tab the public tournament page opens on.
 *
 * - An explicit `?ageGroup=` / `?tab=` in the URL always wins.
 * - While a tournament is in progress, open the age group playing today (or the
 *   next one to start) on its Matches tab, instead of always the first one.
 * - Otherwise open the first age group on Overview.
 */
export function getDefaultTournamentTabs(
  tournament: Pick<Tournament, 'status' | 'ageGroups'>,
  options: { requestedAgeGroupTab?: string | null; requestedInnerTab?: string | null; today?: Date } = {},
): { ageGroupTab?: string; innerTab: InnerTabId } {
  const today = options.today ?? new Date();
  const ageGroups = tournament.ageGroups ?? [];
  const tabIds = ageGroups.map(getAgeGroupTabId);

  const requestedInner = INNER_TAB_IDS.find((id) => id === options.requestedInnerTab);
  const requestedAgeGroupTab = options.requestedAgeGroupTab
    ? tabIds.find(
        (id) => id === options.requestedAgeGroupTab || id === `age-group-${options.requestedAgeGroupTab}`,
      )
    : undefined;

  let index = requestedAgeGroupTab ? tabIds.indexOf(requestedAgeGroupTab) : -1;
  let live = false;

  if (index < 0) {
    const liveIndex = ageGroups.findIndex((ag) => isAgeGroupLive(ag, today));
    if (liveIndex >= 0) {
      index = liveIndex;
      live = true;
    } else if (tournament.status === 'ONGOING') {
      // In progress but nothing scheduled today: next age group to start, else first
      const todayKey = toDateKey(today) ?? '';
      const upcoming = ageGroups
        .map((ag, i) => ({ i, start: toDateKey(ag.startDate) }))
        .filter((x) => x.start && x.start >= todayKey)
        .sort((a, b) => (a.start! < b.start! ? -1 : 1))[0];
      index = upcoming ? upcoming.i : 0;
      live = true;
    } else {
      index = 0;
    }
  } else {
    live = tournament.status === 'ONGOING' || isAgeGroupLive(ageGroups[index], today);
  }

  return {
    ageGroupTab: tabIds[index],
    innerTab: requestedInner ?? (live ? 'matches' : 'overview'),
  };
}
