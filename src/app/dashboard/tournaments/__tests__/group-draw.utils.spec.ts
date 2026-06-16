import { describe, expect, it, vi } from 'vitest';
import {
  completePotDrawFlow,
  getPotManagementPath,
  regenerateGroupsFlow,
  resolvePotCountForAgeGroup,
} from '@/app/dashboard/tournaments/group-draw.utils';

describe('group draw utils', () => {
  it('builds the pots management path for a scoped age group', () => {
    expect(getPotManagementPath('tournament-1', 'age-group-1')).toBe(
      '/dashboard/tournaments/tournament-1/pots?ageGroupId=age-group-1',
    );
  });

  it('locks pot count to group count for groups plus knockout age groups', () => {
    expect(
      resolvePotCountForAgeGroup(
        { format: 'GROUPS_PLUS_KNOCKOUT', groupsCount: 12 },
        4,
      ),
    ).toBe(12);
  });

  it('keeps the existing pot count for formats that do not require pot-group parity', () => {
    expect(
      resolvePotCountForAgeGroup(
        { format: 'SINGLE_ELIMINATION', groupsCount: 12 },
        4,
      ),
    ).toBe(4);
  });

  it('resets groups, clears pots, and returns the pots page path', async () => {
    const callOrder: string[] = [];
    const resetDraw = vi.fn(async () => {
      callOrder.push('reset');
    });
    const clearPotAssignments = vi.fn(async () => {
      callOrder.push('clear');
    });

    const redirectPath = await regenerateGroupsFlow({
      tournamentId: 'tournament-1',
      ageGroupId: 'age-group-1',
      resetDraw,
      clearPotAssignments,
    });

    expect(resetDraw).toHaveBeenCalledWith('tournament-1', 'age-group-1');
    expect(clearPotAssignments).toHaveBeenCalledWith(
      'tournament-1',
      'age-group-1',
    );
    expect(callOrder).toEqual(['reset', 'clear']);
    expect(redirectPath).toBe(
      '/dashboard/tournaments/tournament-1/pots?ageGroupId=age-group-1',
    );
  });

  it('executes the pot draw before regenerating the bracket', async () => {
    const callOrder: string[] = [];
    const executePotDraw = vi.fn(async () => {
      callOrder.push('draw');
    });
    const generateBracket = vi.fn(async () => {
      callOrder.push('bracket');
    });

    await completePotDrawFlow({
      tournamentId: 'tournament-1',
      ageGroupId: 'age-group-1',
      numberOfPots: 12,
      executePotDraw,
      generateBracket,
    });

    expect(executePotDraw).toHaveBeenCalledWith('tournament-1', {
      ageGroupId: 'age-group-1',
      numberOfPots: 12,
    });
    expect(generateBracket).toHaveBeenCalledWith(
      'tournament-1',
      'age-group-1',
    );
    expect(callOrder).toEqual(['draw', 'bracket']);
  });
});
