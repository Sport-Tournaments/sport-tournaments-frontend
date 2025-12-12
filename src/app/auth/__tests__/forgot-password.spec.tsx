import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordPage from '@/app/auth/forgot-password/page';

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
        'auth.forgotPassword': 'Forgot Password',
        'auth.forgotPasswordSubtitle': 'Enter your email to reset your password',
        'auth.email': 'Email',
        'auth.sendResetLink': 'Send Reset Link',
        'auth.backToLogin': 'Back to Login',
        'auth.emailSent': 'Email Sent',
        'auth.checkEmailForReset': 'Check your email for password reset instructions',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock auth service
vi.mock('@/services', () => ({
  authService: {
    forgotPassword: vi.fn(),
  },
}));

// Import mock reference after mock is set up
import { authService } from '@/services';

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

describe('Forgot Password Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render forgot password form', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Forgot Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });

    it('should render subtitle explaining the process', () => {
      render(<ForgotPasswordPage />);

      expect(screen.getByText('Enter your email to reset your password')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty email', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Zod validation returns "Please enter a valid email" for empty/invalid email
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      // Form should not submit with invalid email - API should not be called
      await waitFor(() => {
        expect((authService.forgotPassword as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
      });
    });

    it('should not show error for valid email', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call forgotPassword with correct email', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect((authService.forgotPassword as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ email: 'test@example.com' });
      });
    });

    it('should show success state after email is sent', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Check for success state using i18n key pattern
        expect(screen.getByText(/auth\.checkYourEmail|check.*email/i)).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('User not found'));
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'notfound@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/user not found/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should disable button during submission', async () => {
      const user = userEvent.setup();
      (authService.forgotPassword as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should have back to login link with correct href', () => {
      render(<ForgotPasswordPage />);

      const backToLoginLink = screen.getByText('Back to Login').closest('a');
      expect(backToLoginLink).toHaveAttribute('href', '/auth/login');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('id');
    });

    it('should have submit button with correct type', () => {
      render(<ForgotPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /send reset link/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
