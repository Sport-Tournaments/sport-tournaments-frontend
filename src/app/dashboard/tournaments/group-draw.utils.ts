import type { AgeGroup } from '@/types';

export function getPotManagementPath(
  tournamentId: string,
  ageGroupId?: string | null,
) {
  return `/dashboard/tournaments/${tournamentId}/pots${ageGroupId ? `?ageGroupId=${ageGroupId}` : ''}`;
}

export function resolvePotCountForAgeGroup(
  ageGroup: Pick<AgeGroup, 'format' | 'groupsCount'> | null | undefined,
  fallbackPotCount: number,
) {
  if (
    ageGroup?.format === 'GROUPS_PLUS_KNOCKOUT' &&
    typeof ageGroup.groupsCount === 'number' &&
    ageGroup.groupsCount > 0
  ) {
    return ageGroup.groupsCount;
  }

  return fallbackPotCount;
}

export async function regenerateGroupsFlow({
  tournamentId,
  ageGroupId,
  resetDraw,
  clearPotAssignments,
}: {
  tournamentId: string;
  ageGroupId?: string;
  resetDraw: (tournamentId: string, ageGroupId?: string) => Promise<unknown>;
  clearPotAssignments: (
    tournamentId: string,
    ageGroupId?: string,
  ) => Promise<unknown>;
}) {
  await resetDraw(tournamentId, ageGroupId);
  await clearPotAssignments(tournamentId, ageGroupId);

  return getPotManagementPath(tournamentId, ageGroupId);
}

export async function completePotDrawFlow({
  tournamentId,
  ageGroupId,
  numberOfPots,
  executePotDraw,
  generateBracket,
}: {
  tournamentId: string;
  ageGroupId: string;
  numberOfPots: number;
  executePotDraw: (tournamentId: string, data: {
    ageGroupId: string;
    numberOfPots: number;
  }) => Promise<unknown>;
  generateBracket: (tournamentId: string, ageGroupId?: string) => Promise<unknown>;
}) {
  await executePotDraw(tournamentId, {
    ageGroupId,
    numberOfPots,
  });
  await generateBracket(tournamentId, ageGroupId);
}
