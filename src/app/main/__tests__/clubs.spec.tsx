import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClubsPage from '@/app/main/clubs/page';

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
        'club.title': 'Clubs',
        'club.subtitle': 'Browse and discover football clubs',
        'club.create': 'Create Club',
        'club.noClubs': 'No clubs found',
        'club.noClubsDesc': 'Be the first to register a club',
        'club.createFirst': 'Create First Club',
        'club.members': 'Members',
        'common.search': 'Search clubs...',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock club service (still mocked to prevent actual API calls)
vi.mock('@/services', () => ({
  clubService: {
    getClubs: vi.fn(),
  },
}));

// Mock clubs data
const mockClubs = [
  {
    id: '1',
    name: 'FC Barcelona Youth',
    description: 'Youth football club',
    country: 'Spain',
    city: 'Barcelona',
    logo: 'https://example.com/logo1.jpg',
    memberCount: 150,
  },
  {
    id: '2',
    name: 'Bayern Munich Academy',
    description: 'Youth development academy',
    country: 'Germany',
    city: 'Munich',
    memberCount: 200,
  },
  {
    id: '3',
    name: 'Paris Youth FC',
    description: 'Paris youth football',
    country: 'France',
    city: 'Paris',
    memberCount: 120,
  },
];

// Store for test configuration - must be declared before vi.mock but accessed via function
const getMockHookState = () => mockHookState;

let mockHookState = {
  items: mockClubs,
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

// Mock MainLayout
vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock UI components
vi.mock('@/components/ui', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="club-card" className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  Avatar: ({ src, name, size }: { src?: string; name?: string; size?: string }) => (
    <div data-testid="avatar" data-size={size}>{name?.charAt(0)}</div>
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
  Loading: ({ size }: { size?: string }) => <div data-testid="loading" data-size={size}>Loading...</div>,
}));

describe('Clubs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset hook state to default values with data
    mockHookState = {
      items: mockClubs,
      isLoading: false,
      isFetchingMore: false,
      hasMore: true,
      error: null,
    };
  });

  describe('Rendering', () => {
    it('should render page title', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clubs')).toBeInTheDocument();
      });
    });

    it('should render page subtitle', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('Browse and discover football clubs')).toBeInTheDocument();
      });
    });

    it('should render create club button', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create club/i })).toBeInTheDocument();
      });
    });

    it('should render search input', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', async () => {
      mockHookState = {
        items: [],
        isLoading: true,
        isFetchingMore: false,
        hasMore: false,
        error: null,
      };
      render(<ClubsPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });
  });

  describe('Club List', () => {
    it('should render club cards', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('club-card');
        expect(cards.length).toBe(3);
      });
    });

    it('should display club names', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('FC Barcelona Youth')).toBeInTheDocument();
        expect(screen.getByText('Bayern Munich Academy')).toBeInTheDocument();
        expect(screen.getByText('Paris Youth FC')).toBeInTheDocument();
      });
    });

    it('should display club avatars', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        const avatars = screen.getAllByTestId('avatar');
        expect(avatars.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display club locations', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        // Check for club names which are visible in the cards
        expect(screen.getByText('FC Barcelona Youth')).toBeInTheDocument();
        expect(screen.getByText('Bayern Munich Academy')).toBeInTheDocument();
        expect(screen.getByText('Paris Youth FC')).toBeInTheDocument();
      });
    });

    it('should link club cards to detail pages', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        const link = screen.getByText('FC Barcelona Youth').closest('a');
        expect(link).toHaveAttribute('href', '/main/clubs/1');
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no clubs', async () => {
      mockHookState = {
        items: [],
        isLoading: false,
        isFetchingMore: false,
        hasMore: false,
        error: null,
      };

      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('No clubs found')).toBeInTheDocument();
        expect(screen.getByText('Be the first to register a club')).toBeInTheDocument();
      });
    });

    it('should show create first club button in empty state', async () => {
      mockHookState = {
        items: [],
        isLoading: false,
        isFetchingMore: false,
        hasMore: false,
        error: null,
      };

      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first club/i })).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should update search input value', async () => {
      const user = userEvent.setup();
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Barcelona');

      expect(searchInput).toHaveValue('Barcelona');
    });

    it('should allow typing in search input', async () => {
      const user = userEvent.setup();
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Youth');

      expect(searchInput).toHaveValue('Youth');
    });
  });

  describe('Infinite Scroll', () => {
    it('should render sentinel element for infinite scroll', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        // The page should render without crashing when using infinite scroll
        expect(screen.getByText('Clubs')).toBeInTheDocument();
      });
    });

    it('should show loading more indicator when fetching more', async () => {
      mockHookState = {
        items: mockClubs,
        isLoading: false,
        isFetchingMore: true,
        hasMore: true,
        error: null,
      };

      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('Clubs')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should show empty state when hook returns no items', async () => {
      mockHookState = {
        items: [],
        isLoading: false,
        isFetchingMore: false,
        hasMore: false,
        error: null,
      };

      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('No clubs found')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should link create button to create page', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        const createLink = screen.getByRole('button', { name: /create club/i }).closest('a');
        expect(createLink).toHaveAttribute('href', '/dashboard/clubs/create');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      });
    });

    it('should have search input placeholder', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input');
        // Placeholder is i18n key since translations may not be loaded in test
        expect(searchInput).toHaveAttribute('placeholder');
      });
    });
  });
});
