import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboardPage from '../page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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
  Loading: ({ size }: { size?: string }) => <div data-testid="loading" data-size={size}>Loading...</div>,
  Alert: ({ children, variant }: { children: React.ReactNode; variant?: string }) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
}));

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock admin service
const mockGetDashboardStats = vi.fn();
vi.mock('@/services', () => ({
  adminService: {
    getDashboardStats: () => mockGetDashboardStats(),
  },
}));

// Mock auth store
type UserRole = 'ADMIN' | 'ORGANIZER' | 'PARTICIPANT' | 'USER';
interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}
const mockUser: MockUser = { id: '1', firstName: 'Admin', lastName: 'User', email: 'admin@example.com', role: 'ADMIN' };
let currentUser: MockUser = mockUser;

vi.mock('@/store', () => ({
  useAuthStore: () => ({
    user: currentUser,
  }),
}));

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentUser = mockUser;
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockGetDashboardStats.mockReturnValue(new Promise(() => {}));

      render(<AdminDashboardPage />);

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });
  });

  describe('Admin User', () => {
    it('should render admin dashboard title', async () => {
      mockGetDashboardStats.mockResolvedValue({
        totalUsers: 100,
        totalTournaments: 50,
        totalClubs: 25,
        totalRegistrations: 200,
        pendingRegistrations: 10,
        activeTournaments: 5,
        recentUsers: 15,
        revenue: 50000,
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    it('should render stats cards', async () => {
      mockGetDashboardStats.mockResolvedValue({
        totalUsers: 100,
        totalTournaments: 50,
        totalClubs: 25,
        totalRegistrations: 200,
        pendingRegistrations: 10,
        activeTournaments: 5,
        recentUsers: 15,
        revenue: 50000,
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        const cards = screen.getAllByTestId('card');
        expect(cards.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should display stat labels', async () => {
      mockGetDashboardStats.mockResolvedValue({
        totalUsers: 100,
        totalTournaments: 50,
        totalClubs: 25,
        totalRegistrations: 200,
        pendingRegistrations: 10,
        activeTournaments: 5,
        recentUsers: 15,
        revenue: 50000,
      });

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('Tournaments')).toBeInTheDocument();
        expect(screen.getByText('Clubs')).toBeInTheDocument();
        expect(screen.getByText('Registrations')).toBeInTheDocument();
      });
    });
  });

  describe('Access Control', () => {
    it('should redirect non-admin users to dashboard', async () => {
      currentUser = { ...mockUser, role: 'USER' };

      render(<AdminDashboardPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Layout', () => {
    it('should be wrapped in DashboardLayout', async () => {
      mockGetDashboardStats.mockResolvedValue({
        totalUsers: 100,
        totalTournaments: 50,
        totalClubs: 25,
        totalRegistrations: 200,
        pendingRegistrations: 10,
        activeTournaments: 5,
        recentUsers: 15,
        revenue: 50000,
      });

      render(<AdminDashboardPage />);

      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
    });
  });
});
