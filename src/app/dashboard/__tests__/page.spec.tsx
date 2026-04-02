import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import DashboardPage from '../page';

const mockReplace = vi.fn();

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
    user: { ...mockUser, role: 'PARTICIPANT' },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock services
vi.mock('@/services', () => ({
  tournamentService: {
    getMyTournaments: vi.fn(),
  },
  clubService: {
    getMyClubs: vi.fn(),
  },
  registrationService: {
    getMyRegistrations: vi.fn(),
  },
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'dashboard.welcome': 'Welcome',
        'dashboard.overview': 'Here is your dashboard overview',
        'dashboard.tournaments': 'Tournaments',
        'dashboard.tournamentsCreated': 'Tournaments Created',
        'dashboard.clubs': 'Clubs',
        'dashboard.registrations': 'Registrations',
        'dashboard.pending': 'Pending',
        'dashboard.recentTournaments': 'Recent Tournaments',
        'dashboard.recentClubs': 'Recent Clubs',
        'dashboard.recentRegistrations': 'Recent Registrations',
        'dashboard.viewAll': 'View All',
        'dashboard.noTournaments': 'No tournaments yet',
        'dashboard.noClubs': 'No clubs yet',
        'dashboard.noRegistrations': 'No registrations yet',
        'registration.applied': 'Applied',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock formatDate
vi.mock('@/utils/date', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

import { tournamentService, clubService, registrationService } from '@/services';

const mockGetMyTournaments = vi.mocked(tournamentService.getMyTournaments);
const mockGetMyClubs = vi.mocked(clubService.getMyClubs);
const mockGetMyRegistrations = vi.mocked(registrationService.getMyRegistrations);

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
  {
    id: '2',
    name: 'City Rovers',
    verified: false,
    city: 'Los Angeles',
  },
];

const mockRegistrations = [
  {
    id: '1',
    tournamentId: '1',
    status: 'PENDING',
    createdAt: '2024-01-15',
    tournament: { name: 'Summer Cup 2024' },
  },
  {
    id: '2',
    tournamentId: '2',
    status: 'APPROVED',
    createdAt: '2024-01-10',
    tournament: { name: 'Winter League' },
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReplace.mockReset();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      // Make services hang
      mockGetMyTournaments.mockReturnValue(new Promise(() => {}));
      mockGetMyClubs.mockReturnValue(new Promise(() => {}));
      mockGetMyRegistrations.mockReturnValue(new Promise(() => {}));

      render(<DashboardPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Dashboard Content', () => {
    beforeEach(() => {
      mockGetMyTournaments.mockResolvedValue({
        success: true,
        data: mockTournaments,
      } as never);
      mockGetMyClubs.mockResolvedValue({
        success: true,
        data: mockClubs,
      } as never);
      mockGetMyRegistrations.mockResolvedValue({
        success: true,
        data: mockRegistrations,
      } as never);
    });

    it('should render welcome message with user name', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText(/Welcome, John!/)).toBeInTheDocument();
      });
    });

    it('should render overview text', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Here is your dashboard overview')).toBeInTheDocument();
      });
    });

    it('should render stats cards', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });

    it('should display tournament count in stats', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const tournamentsLabel = screen.getByText('Tournaments Created');
        expect(within(tournamentsLabel.parentElement as HTMLElement).getByText('2')).toBeInTheDocument();
      });
    });

    it('should display clubs count in stats', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getAllByText('2').length).toBeGreaterThan(0);
      });
    });

    it('should display registrations count in stats', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        const registrationsLabel = screen.getByText('Applied');
        expect(within(registrationsLabel.parentElement as HTMLElement).getByText('2')).toBeInTheDocument();
      });
    });

    it('should fetch all data on mount', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(mockGetMyTournaments).toHaveBeenCalled();
        expect(mockGetMyClubs).toHaveBeenCalled();
        expect(mockGetMyRegistrations).toHaveBeenCalled();
      });
    });

    it('should render tournaments created label on the first stats card', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Tournaments Created')).toBeInTheDocument();
      });
    });
  });

  describe('Layout', () => {
    beforeEach(() => {
      mockGetMyTournaments.mockResolvedValue({
        success: true,
        data: [],
      } as never);
      mockGetMyClubs.mockResolvedValue({
        success: true,
        data: [],
      } as never);
      mockGetMyRegistrations.mockResolvedValue({
        success: true,
        data: [],
      } as never);
    });

    it('should be wrapped in DashboardLayout', async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockGetMyTournaments.mockRejectedValue(new Error('Network error'));
      mockGetMyClubs.mockRejectedValue(new Error('Network error'));
      mockGetMyRegistrations.mockRejectedValue(new Error('Network error'));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });
});
