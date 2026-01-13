import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

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
        'home.hero.title': 'Youth Football Tournament Management',
        'home.hero.subtitle': 'The complete platform for organizing and managing youth football tournaments worldwide',
        'home.hero.browseTournaments': 'Browse Tournaments',
        'home.hero.getStarted': 'Get Started',
        'home.hero.platformName': 'Worldwide Football',
        'home.hero.platformTagline': 'Your Tournament Platform',
        'home.stats.tournaments': 'Tournaments',
        'home.stats.clubs': 'Clubs',
        'home.stats.players': 'Players',
        'home.features.tournaments.title': 'Tournament Management',
        'home.features.tournaments.description': 'Create and manage tournaments with ease',
        'home.features.clubs.title': 'Club Management',
        'home.features.clubs.description': 'Register and manage your football clubs',
        'home.features.registration.title': 'Easy Registration',
        'home.features.registration.description': 'Quick and simple registration process',
        'home.features.groups.title': 'Group Management',
        'home.features.groups.description': 'Organize teams into groups efficiently',
        'home.features.payments.title': 'Payment Processing',
        'home.features.payments.description': 'Secure online payment processing',
        'home.features.notifications.title': 'Notifications',
        'home.features.notifications.description': 'Stay updated with real-time notifications',
        'home.cta.title': 'Ready to Get Started?',
        'home.cta.subtitle': 'Join thousands of clubs and organizers',
        'home.cta.register': 'Register Now',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock MainLayout
vi.mock('@/components/layout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: ({ children, variant, size }: { children: React.ReactNode; variant?: string; size?: string }) => (
    <button data-variant={variant} data-size={size}>{children}</button>
  ),
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>{children}</div>
  ),
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hero Section', () => {
    it('should render hero title', () => {
      render(<HomePage />);

      expect(screen.getByText('Youth Football Tournament Management')).toBeInTheDocument();
    });

    it('should render hero subtitle', () => {
      render(<HomePage />);

      expect(screen.getByText(/complete platform for organizing/i)).toBeInTheDocument();
    });

    it('should render browse tournaments button', () => {
      render(<HomePage />);

      expect(screen.getByRole('button', { name: /browse tournaments/i })).toBeInTheDocument();
    });

    it('should render get started button', () => {
      render(<HomePage />);

      expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
    });

    it('should link browse tournaments to tournaments page', () => {
      render(<HomePage />);

      const link = screen.getByRole('button', { name: /browse tournaments/i }).closest('a');
      expect(link).toHaveAttribute('href', '/main/tournaments');
    });

    it('should link get started to register page', () => {
      render(<HomePage />);

      const link = screen.getByRole('button', { name: /get started/i }).closest('a');
      expect(link).toHaveAttribute('href', '/auth/register');
    });
  });

  describe('Statistics', () => {
    it('should render tournament count', () => {
      render(<HomePage />);

      expect(screen.getByText('1000+')).toBeInTheDocument();
      expect(screen.getByText('Tournaments')).toBeInTheDocument();
    });

    it('should render club count', () => {
      render(<HomePage />);

      expect(screen.getByText('5000+')).toBeInTheDocument();
      expect(screen.getByText('Clubs')).toBeInTheDocument();
    });

    it('should render player count', () => {
      render(<HomePage />);

      expect(screen.getByText('50K+')).toBeInTheDocument();
      expect(screen.getByText('Players')).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('should render tournament management feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Tournament Management')).toBeInTheDocument();
      expect(screen.getByText('Create and manage tournaments with ease')).toBeInTheDocument();
    });

    it('should render club management feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Club Management')).toBeInTheDocument();
      expect(screen.getByText('Register and manage your football clubs')).toBeInTheDocument();
    });

    it('should render registration feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Easy Registration')).toBeInTheDocument();
      expect(screen.getByText('Quick and simple registration process')).toBeInTheDocument();
    });

    it('should render groups feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Group Management')).toBeInTheDocument();
      expect(screen.getByText('Organize teams into groups efficiently')).toBeInTheDocument();
    });

    it('should render payments feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Payment Processing')).toBeInTheDocument();
      expect(screen.getByText('Secure online payment processing')).toBeInTheDocument();
    });

    it('should render notifications feature', () => {
      render(<HomePage />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Stay updated with real-time notifications')).toBeInTheDocument();
    });

    it('should render all 6 feature cards', () => {
      render(<HomePage />);

      const cards = screen.getAllByTestId('card');
      expect(cards.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Platform Branding', () => {
    it('should render page title', () => {
      render(<HomePage />);

      expect(screen.getByText('Youth Football Tournament Management')).toBeInTheDocument();
    });

    it('should render page subtitle', () => {
      render(<HomePage />);

      expect(screen.getByText(/complete platform for organizing/i)).toBeInTheDocument();
    });

    it('should render hero image', () => {
      render(<HomePage />);

      expect(screen.getByAltText('Football Tournament')).toBeInTheDocument();
    });
  });

  describe('Call to Action', () => {
    it('should render CTA title', () => {
      render(<HomePage />);

      expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
    });

    it('should render CTA subtitle', () => {
      render(<HomePage />);

      expect(screen.getByText('Join thousands of clubs and organizers')).toBeInTheDocument();
    });

    it('should render register button in CTA', () => {
      render(<HomePage />);

      // CTA section has organizer and participant buttons
      expect(screen.getByRole('button', { name: /home\.cta\.organizer/i })).toBeInTheDocument();
    });
  });

  describe('Responsiveness', () => {
    it('should render hero buttons in column on small screens', () => {
      render(<HomePage />);

      // The container should have flex-col for small screens
      const buttonsContainer = screen.getByRole('button', { name: /browse tournaments/i }).closest('div');
      expect(buttonsContainer).toHaveClass('flex-col');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HomePage />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have all buttons accessible', () => {
      render(<HomePage />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });
  });
});
