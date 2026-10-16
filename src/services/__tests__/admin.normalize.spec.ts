import { describe, expect, it } from 'vitest';
import { normalizeDashboardStats } from '../admin.service';

describe('normalizeDashboardStats', () => {
  const body = {
    success: true,
    data: {
      overview: {
        totalUsers: 12,
        totalClubs: 4,
        totalTournaments: 7,
        activeTournaments: 3,
        ongoingTournaments: 1,
        totalRegistrations: 30,
        pendingRegistrations: 5,
        totalRevenue: '150.50',
        recentUsers: 6,
        newUsersThisWeek: 2,
      },
      distributions: { tournamentStatuses: [{ status: 'PUBLISHED', count: '3' }] },
      trends: { registrations: [{ month: '2026-09', count: '10' }] },
      topCountries: [{ country: 'Romania', count: '6' }, { country: null, count: '1' }],
      recentActivity: [{ type: 'user', id: 'u1', title: 'Ana', createdAt: '2026-10-01' }],
    },
  };

  it('maps the backend statistics envelope to dashboard stats', () => {
    const stats = normalizeDashboardStats(body);
    expect(stats).toMatchObject({
      totalUsers: 12,
      totalTournaments: 7,
      pendingRegistrations: 5,
      ongoingTournaments: 1,
      newUsersThisWeek: 2,
      revenue: 150.5,
      tournamentStatuses: [{ status: 'PUBLISHED', count: 3 }],
      registrationTrend: [{ month: '2026-09', count: 10 }],
      topCountries: [{ country: 'Romania', count: 6 }],
    });
    expect(stats.recentActivity).toHaveLength(1);
  });

  it('accepts the unwrapped payload too', () => {
    expect(normalizeDashboardStats(body.data).totalClubs).toBe(4);
  });
});
