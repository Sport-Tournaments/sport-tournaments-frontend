import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/auth/login/page';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.welcomeBack': 'Welcome Back',
        'auth.loginSubtitle': 'Sign in to continue',
        'auth.email': 'Email',
        'auth.password': 'Password',
        'auth.login': 'Login',
        'auth.rememberMe': 'Remember me',
        'auth.forgotPassword': 'Forgot password?',
        'auth.noAccount': "Don't have an account?",
        'auth.register': 'Register',
        'auth.orContinueWith': 'Or continue with',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock auth store
const mockLogin = vi.fn();
vi.mock('@/store', () => ({
  useAuthStore: Object.assign(
    () => ({
      login: mockLogin,
    }),
    {
      getState: () => ({
        login: mockLogin,
      }),
    }
  ),
}));

// Mock AuthLayout
vi.mock('@/components/layout', () => ({
  AuthLayout: ({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  ),
}));

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      render(<LoginPage />);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    it('should render remember me checkbox', () => {
      render(<LoginPage />);

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByText('Remember me')).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginPage />);

      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('should render register link', () => {
      render(<LoginPage />);

      expect(screen.getByText('Register')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show email validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      // Form should not submit with invalid email - login should not be called
      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    it('should show password validation error for short password', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    it('should not show validation errors for valid input', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call login with correct credentials', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should redirect to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show error message on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should clear error when close button is clicked', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Login failed'));
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Find and click close button on alert by aria-label
      const closeButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(closeButton);
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });
});
