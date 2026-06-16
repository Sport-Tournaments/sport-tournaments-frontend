import { describe, expect, it } from 'vitest';
import type { AgeGroup, Registration, Tournament } from '@/types';
import {
  PUBLIC_TOURNAMENT_REGISTRATIONS_PAGE_SIZE,
  getTournamentTeamMetrics,
} from '@/app/main/tournaments/[id]/page';

describe('getTournamentTeamMetrics', () => {
  it('requests enough approved registrations to avoid truncating public team lists', () => {
    expect(PUBLIC_TOURNAMENT_REGISTRATIONS_PAGE_SIZE).toBeGreaterThan(48);
  });

  it('keeps registered and confirmed team counts separate for age-group tournaments', () => {
    const tournament = {
      id: 'tournament-1',
      name: 'FIFA World Cup 2026',
      maxTeams: 48,
      confirmedTeams: 20,
      currentTeams: 48,
      status: 'PUBLISHED',
      isPrivate: false,
      isPremium: false,
      isFeatured: false,
      isPublished: true,
      organizerId: 'organizer-1',
      location: 'New York, NY, USA',
      currency: 'USD',
      startDate: '2026-06-11',
      endDate: '2026-07-19',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      ageGroups: [
        {
          id: 'age-group-1',
          birthYear: 2026,
          displayLabel: 'Seniors',
          currentTeams: 48,
          maxTeams: 48,
        } satisfies AgeGroup,
      ],
    } satisfies Tournament;

    const registrations = Array.from({ length: 20 }, (_, index) => ({
      id: `registration-${index + 1}`,
      tournamentId: tournament.id,
      ageGroupId: 'age-group-1',
      clubId: `club-${index + 1}`,
      status: 'APPROVED',
      paymentStatus: 'PENDING',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    })) satisfies Registration[];

    expect(getTournamentTeamMetrics({ tournament, registrations })).toEqual({
      maxTeams: 48,
      registeredTeams: 48,
      confirmedTeams: 20,
      pendingTeams: 28,
      visibleTeams: 20,
    });
  });
});
