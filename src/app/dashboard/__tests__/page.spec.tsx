import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../page';

// Mock components
vi.mock('@/components/layout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}));

vi.mock('@/components/ui', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card-content" className={className}>{children}</div>
  ),
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
  Loading: ({ size }: { size?: string }) => <div data-testid="loading" data-size={size}>Loading...</div>,
}));

// Mock stores
const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'ORGANIZER' as const,
};

vi.mock('@/store', () => ({
  useAuthStore: () => ({
    user: mockUser,
  }),
}));

// Mock services
vi.mock('@/services', () => ({
  dashboardService: {
    getDashboardSummary: vi.fn(),
  },
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        'dashboard.welcome': 'Welcome',
        'dashboard.overview': 'Here is your dashboard overview',
        'dashboard.tournaments': 'Tournaments',
        'dashboard.clubs': 'Clubs',
        'dashboard.registrations': 'Registrations',
        'dashboard.pending': 'Pending',
        'dashboard.recentTournaments': 'Recent Tournaments',
        'dashboard.recentRegistrations': 'Recent Registrations',
        'dashboard.viewAll': 'View All',
        'dashboard.noTournaments': 'No tournaments yet',
        'dashboard.noRegistrations': 'No registrations yet',
        'common.viewAll': 'View All',
        'registration.applied': 'Applied',
        'registration.approved': 'Approved',
      };
      return translations[key] || fallback || key;
    },
  }),
}));

// Mock formatDate
vi.mock('@/utils/date', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

vi.mock('@/utils/helpers', () => ({
  getTournamentPublicPath: (tournament: { id: string }) => `/dashboard/tournaments/${tournament.id}`,
}));

import { dashboardService } from '@/services';

const mockGetDashboardSummary = vi.mocked(dashboardService.getDashboardSummary);

const mockTournaments = [
  {
    id: '1',
    name: 'Summer Cup 2024',
    status: 'ACTIVE',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    location: 'Stadium A',
  },
  {
    id: '2',
    name: 'Winter League',
    status: 'UPCOMING',
    startDate: '2024-12-01',
    endDate: '2024-12-20',
    location: 'Stadium B',
  },
];

const mockClubs = [
  {
    id: '1',
    name: 'FC United',
    verified: true,
    city: 'New York',
  },
];

const mockRegistrations = [
  {
    id: '1',
    tournamentId: '1',
    status: 'PENDING',
    createdAt: '2024-01-15',
    club: { name: 'FC United' },
    team: { name: 'U10' },
    tournament: { name: 'Summer Cup 2024', startDate: '2024-07-01' },
  },
  {
    id: '2',
    tournamentId: '2',
    status: 'APPROVED',
    createdAt: '2024-01-10',
    club: { name: 'City Rovers' },
    team: { name: 'U11' },
    tournament: { name: 'Winter League', startDate: '2024-12-01' },
  },
];

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockGetDashboardSummary.mockReturnValue(new Promise(() => {}));

      renderDashboard();

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Dashboard Content', () => {
    beforeEach(() => {
      mockGetDashboardSummary.mockResolvedValue({
        success: true,
        data: {
          stats: {
            tournaments: 10,
            clubs: 5,
            registrations: 2,
            approved: 1,
            pending: 1,
          },
          recentTournaments: mockTournaments,
          recentClubs: mockClubs,
          recentRegistrations: mockRegistrations,
        },
      } as never);
    });

    it('should render welcome message with user name', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/Welcome, John!/)).toBeInTheDocument();
      });
    });

    it('should render overview text', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('Here is your dashboard overview')).toBeInTheDocument();
      });
    });

    it('should render stats cards', async () => {
      renderDashboard();

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('should display summary stats', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('should fetch the dashboard summary once', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(mockGetDashboardSummary).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      mockGetDashboardSummary.mockResolvedValue({
        success: true,
        data: {
          stats: {
            tournaments: 0,
            clubs: 0,
            registrations: 0,
            approved: 0,
            pending: 0,
          },
          recentTournaments: [],
          recentClubs: [],
          recentRegistrations: [],
        },
      } as never);
    });

    it('should be wrapped in DashboardLayout', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDashboardSummary.mockRejectedValue(new Error('Network error'));

      renderDashboard();

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
