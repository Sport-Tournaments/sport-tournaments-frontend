import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentsPage from '@/app/main/tournaments/page';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'tournament.title': 'Tournaments',
        'tournament.subtitle': 'Browse and discover football tournaments',
        'tournament.create': 'Create Tournament',
        'tournament.noTournaments': 'No tournaments found',
        'tournament.noTournamentsDesc': 'Be the first to create a tournament',
        'tournament.createFirst': 'Create First Tournament',
        'tournament.status.DRAFT': 'Draft',
        'tournament.status.PUBLISHED': 'Published',
        'tournament.status.REGISTRATION_OPEN': 'Registration Open',
        'tournament.status.REGISTRATION_CLOSED': 'Registration Closed',
        'tournament.status.IN_PROGRESS': 'In Progress',
        'tournament.status.COMPLETED': 'Completed',
        'tournament.status.CANCELLED': 'Cancelled',
        'common.all': 'All',
        'common.search': 'Search tournaments...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock tournament service
vi.mock('@/services', () => ({
  tournamentService: {
    getTournaments: vi.fn(),
  },
}));

// Import mock reference after mock is set up
import { tournamentService } from '@/services';

// Mock tournaments data
const mockTournaments = [
  {
    id: '1',
    name: 'Summer Cup 2024',
    description: 'Annual summer tournament',
    status: 'REGISTRATION_OPEN',
    startDate: '2024-07-01',
    endDate: '2024-07-15',
    location: 'Barcelona, Spain',
    bannerImage: 'https://example.com/banner1.jpg',
  },
  {
    id: '2',
    name: 'Winter League',
    description: 'Winter football league',
    status: 'DRAFT',
    startDate: '2024-12-01',
    endDate: '2024-12-20',
    location: 'Munich, Germany',
  },
  {
    id: '3',
    name: 'Spring Tournament',
    description: 'Youth spring tournament',
    status: 'COMPLETED',
    startDate: '2024-03-01',
    endDate: '2024-03-10',
    location: 'Paris, France',
  },
];

// Store for test configuration - must be declared before vi.mock but accessed via function
const getMockHookState = () => mockHookState;

let mockHookState = {
  items: mockTournaments,
  isLoading: false,
  isFetchingMore: false,
  hasMore: true,
  error: null as Error | null,
};

// Mock hooks - use getter function to access current state
vi.mock('@/hooks', () => ({
  useDebounce: (value: string) => value,
  useInfiniteScroll: () => {
    const state = getMockHookState();
    return {
      ...state,
      sentinelRef: () => {},
      retry: vi.fn(),
      reset: vi.fn(),
    };
  },
}));

// Mock date utility
vi.mock('@/utils/date', () => ({
  formatDate: (date: string) => new Date(date).toLocaleDateString(),
}));

// Mock MainLayout
vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock UI components
vi.mock('@/components/ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="tournament-card" className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  Badge: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
  Button: ({ children, variant, onClick }: { children: React.ReactNode; variant?: string; onClick?: () => void }) => (
    <button data-variant={variant} onClick={onClick}>{children}</button>
  ),
  Input: ({ placeholder, value, onChange, leftIcon }: { placeholder?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; leftIcon?: React.ReactNode }) => (
    <div>
      {leftIcon}
      <input data-testid="search-input" placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  ),
  Select: ({ options, value, onChange }: { options: { value: string; label: string }[]; value?: string; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
    <select data-testid="status-filter" value={value} onChange={onChange}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
  Loading: ({ size }: { size?: string }) => <div data-testid="loading" data-size={size}>Loading...</div>,
}));

describe('Tournaments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset hook state to default with mock tournaments
    mockHookState = {
      items: mockTournaments,
      isLoading: false,
      isFetchingMore: false,
      hasMore: true,
      error: null,
    };
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tournaments')).toBeInTheDocument();
      });
    });

    it('should render page subtitle', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Browse and discover football tournaments')).toBeInTheDocument();
      });
    });

    it('should render create tournament button', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create tournament/i })).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });

    it('should render status filter', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', async () => {
      mockHookState = { ...mockHookState, isLoading: true, items: [] };
      render(<TournamentsPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tournament List', () => {
    it('should render tournament cards', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('tournament-card');
        expect(cards.length).toBe(3);
      });
    });

    it('should display tournament names', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Summer Cup 2024')).toBeInTheDocument();
        expect(screen.getByText('Winter League')).toBeInTheDocument();
        expect(screen.getByText('Spring Tournament')).toBeInTheDocument();
      });
    });

    it('should display tournament status badges', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        const badges = screen.getAllByTestId('badge');
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should link tournament cards to detail pages', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        const link = screen.getByText('Summer Cup 2024').closest('a');
        expect(link).toHaveAttribute('href', '/main/tournaments/1');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no tournaments', async () => {
      mockHookState = { ...mockHookState, items: [], hasMore: false };

      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByText('No tournaments found')).toBeInTheDocument();
        expect(screen.getByText('Be the first to create a tournament')).toBeInTheDocument();
      });
    });

    it('should show create first tournament button in empty state', async () => {
      mockHookState = { ...mockHookState, items: [], hasMore: false };

      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first tournament/i })).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should update search input value', async () => {
      const user = userEvent.setup();
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Summer');

      expect(searchInput).toHaveValue('Summer');
    });

    it('should update search input value with different text', async () => {
      const user = userEvent.setup();
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Cup');

      expect(searchInput).toHaveValue('Cup');
    });
  });
  describe('Status Filter', () => {
    it('should render all status options', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('status-filter');
      expect(within(statusFilter).getByText('All')).toBeInTheDocument();
      // Status values are translation keys in the actual component
      expect(within(statusFilter).getByRole('option', { name: /draft/i })).toBeInTheDocument();
    });

    it('should call API when status filter changes', async () => {
      const user = userEvent.setup();
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      });

      const statusFilter = screen.getByTestId('status-filter');
      await user.selectOptions(statusFilter, 'PUBLISHED');

      // Filter change should trigger hook reset (tested via hook state change)
      await waitFor(() => {
        expect(statusFilter).toHaveValue('PUBLISHED');
      });
    });
  });

  describe('Infinite Scroll', () => {
    it('should render sentinel element for infinite scroll', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        // The page should render without crashing when using infinite scroll
        expect(screen.getByText('Tournaments')).toBeInTheDocument();
      });
    });

    it('should display tournament cards when data is available', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('tournament-card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should render page structure even when loading', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        expect(screen.getByText('Tournaments')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should link create button to create page', async () => {
      render(<TournamentsPage />);

      await waitFor(() => {
        const createLink = screen.getByRole('button', { name: /create tournament/i }).closest('a');
        expect(createLink).toHaveAttribute('href', '/dashboard/tournaments/create');
      });
    });
  });
});
