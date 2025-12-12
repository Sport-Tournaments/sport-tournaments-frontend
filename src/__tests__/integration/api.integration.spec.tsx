import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../mocks/server';

// Start MSW server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

// Helper to create test wrapper with providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Authentication Integration Tests', () => {
  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      // This test would test the full login flow with real API calls mocked by MSW
      const user = userEvent.setup();

      // Mock a simple login component for testing
      const MockLoginForm = () => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [error, setError] = React.useState('');
        const [success, setSuccess] = React.useState(false);

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            const response = await fetch('http://localhost:3001/api/v1/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (data.success) {
              setSuccess(true);
            } else {
              setError(data.error?.message || 'Login failed');
            }
          } catch (err) {
            setError('Network error');
          }
        };

        if (success) {
          return <div>Login successful!</div>;
        }

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
            />
            {error && <div role="alert">{error}</div>}
            <button type="submit">Login</button>
          </form>
        );
      };

      render(<MockLoginForm />);

      // Fill in valid credentials
      await user.type(screen.getByLabelText(/email/i), 'organizer@example.com');
      await user.type(screen.getByLabelText(/password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /login/i }));

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/login successful/i)).toBeInTheDocument();
      });
    });

    it('should show error with invalid credentials', async () => {
      const user = userEvent.setup();

      const MockLoginForm = () => {
        const [email, setEmail] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [error, setError] = React.useState('');

        const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            const response = await fetch('http://localhost:3001/api/v1/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!data.success) {
              setError(data.error?.message || 'Login failed');
            }
          } catch (err) {
            setError('Network error');
          }
        };

        return (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
            {error && <div role="alert">{error}</div>}
            <button type="submit">Login</button>
          </form>
        );
      };

      render(<MockLoginForm />);

      await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/invalid email or password/i);
      });
    });
  });
});

describe('Tournament API Integration Tests', () => {
  it('should fetch tournaments list', async () => {
    const response = await fetch('http://localhost:3001/api/v1/tournaments');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.items).toBeInstanceOf(Array);
    expect(data.data.items.length).toBeGreaterThan(0);
    expect(data.data.items[0]).toHaveProperty('id');
    expect(data.data.items[0]).toHaveProperty('name');
  });

  it('should fetch featured tournaments', async () => {
    const response = await fetch('http://localhost:3001/api/v1/tournaments/featured');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    data.data.forEach((tournament: { isFeatured: boolean }) => {
      expect(tournament.isFeatured).toBe(true);
    });
  });

  it('should fetch tournament by ID', async () => {
    const response = await fetch('http://localhost:3001/api/v1/tournaments/tournament-1');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.id).toBe('tournament-1');
    expect(data.data.name).toBe('U12 Summer Cup 2025');
  });

  it('should return 404 for non-existent tournament', async () => {
    const response = await fetch('http://localhost:3001/api/v1/tournaments/non-existent');
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NOT_FOUND');
  });

  it('should create a new tournament', async () => {
    const newTournament = {
      name: 'New Test Tournament',
      description: 'Test description',
      ageCategory: 'U12',
      level: 'I',
      startDate: '2025-08-15T09:00:00Z',
      endDate: '2025-08-17T18:00:00Z',
      location: 'Bucharest, Romania',
      maxTeams: 16,
      currency: 'EUR',
      participationFee: 250,
    };

    const response = await fetch('http://localhost:3001/api/v1/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTournament),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe(newTournament.name);
    expect(data.data.status).toBe('DRAFT');
  });

  it('should update a tournament', async () => {
    const updateData = {
      name: 'Updated Tournament Name',
      maxTeams: 24,
    };

    const response = await fetch('http://localhost:3001/api/v1/tournaments/tournament-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Updated Tournament Name');
    expect(data.data.maxTeams).toBe(24);
  });
});

describe('Club API Integration Tests', () => {
  it('should fetch clubs list', async () => {
    const response = await fetch('http://localhost:3001/api/v1/clubs');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.items).toBeInstanceOf(Array);
    expect(data.data.items.length).toBeGreaterThan(0);
  });

  it('should fetch club by ID', async () => {
    const response = await fetch('http://localhost:3001/api/v1/clubs/club-1');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.id).toBe('club-1');
    expect(data.data.name).toBe('FC Youth Academy');
  });
});

// Import React for JSX
import React from 'react';
