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

// Mock club service
vi.mock('@/services', () => ({
  clubService: {
    getClubs: vi.fn(),
  },
}));

// Import mock reference after mock is set up
import { clubService } from '@/services';

// Mock useDebounce hook
vi.mock('@/hooks', () => ({
  useDebounce: (value: string) => value,
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
  Pagination: ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
    </div>
  ),
  Loading: ({ size }: { size?: string }) => <div data-testid="loading" data-size={size}>Loading...</div>,
}));

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

describe('Clubs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (clubService.getClubs as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        items: mockClubs,
        totalPages: 2,
      },
    });
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
      (clubService.getClubs as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {})); // Never resolves
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
        expect(screen.getByText(/barcelona/i)).toBeInTheDocument();
        expect(screen.getByText(/munich/i)).toBeInTheDocument();
        expect(screen.getByText(/paris/i)).toBeInTheDocument();
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
      (clubService.getClubs as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { items: [], totalPages: 1 },
      });

      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('No clubs found')).toBeInTheDocument();
        expect(screen.getByText('Be the first to register a club')).toBeInTheDocument();
      });
    });

    it('should show create first club button in empty state', async () => {
      (clubService.getClubs as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { items: [], totalPages: 1 },
      });

      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create first club/i })).toBeInTheDocument();
      });
    });
  });

  describe('Search', () => {
    it('should call API when search value changes', async () => {
      const user = userEvent.setup();
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Barcelona');

      await waitFor(() => {
        expect((clubService.getClubs as ReturnType<typeof vi.fn>)).toHaveBeenCalled();
      });
    });

    it('should update search input value', async () => {
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

  describe('Pagination', () => {
    it('should render pagination when clubs exist', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });
    });

    it('should display correct page info', async () => {
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });
    });

    it('should call API when page changes', async () => {
      const user = userEvent.setup();
      render(<ClubsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect((clubService.getClubs as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(2); // Initial + page change
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (clubService.getClubs as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

      render(<ClubsPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should show empty state on API error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      (clubService.getClubs as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API Error'));

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
        expect(searchInput).toHaveAttribute('placeholder', 'Search clubs...');
      });
    });
  });
});
