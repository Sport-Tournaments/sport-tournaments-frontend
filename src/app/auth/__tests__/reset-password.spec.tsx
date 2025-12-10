import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '@/app/auth/reset-password/page';

// Mock next/navigation
const mockPush = vi.fn();
const mockSearchParams = vi.fn(() => new URLSearchParams('token=valid-token'));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.resetPassword': 'Reset Password',
        'auth.resetPasswordSubtitle': 'Enter your new password',
        'auth.newPassword': 'New Password',
        'auth.confirmNewPassword': 'Confirm New Password',
        'auth.passwordReset': 'Password Reset',
        'auth.passwordResetSuccess': 'Your password has been reset successfully',
        'auth.canNowLogin': 'You can now login with your new password',
        'auth.login': 'Login',
        'auth.backToLogin': 'Back to Login',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock auth service
vi.mock('@/services', () => ({
  authService: {
    resetPassword: vi.fn(),
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

describe('Reset Password Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams('token=valid-token'));
  });

  describe('Rendering', () => {
    it('should render reset password form', () => {
      render(<ResetPasswordPage />);

      // Use heading role to specifically target the title
      expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      // Use exact label text to avoid matching multiple elements
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    });

    it('should render back to login link', () => {
      render(<ResetPasswordPage />);

      expect(screen.getByText('Back to Login')).toBeInTheDocument();
    });
  });

  describe('Token Validation', () => {
    it('should redirect to forgot password page when no token', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams(''));
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth/forgot-password');
      });
    });

    it('should not redirect when token is present', async () => {
      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error for short password', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      await user.type(passwordInput, '1234567');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password456');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should not show error for valid matching passwords', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call resetPassword with correct data', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect((authService.resetPassword as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
          token: 'valid-token',
          newPassword: 'newPassword123',
        });
      });
    });

    it('should show success state after password reset', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password Reset')).toBeInTheDocument();
        expect(screen.getByText('You can now login with your new password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });
    });

    it('should hide form after successful submission', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByLabelText(/new password/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/confirm new password/i)).not.toBeInTheDocument();
      });
    });

    it('should show error message on API failure', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Token expired'));
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/token expired/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      (authService.resetPassword as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      await user.type(passwordInput, 'newPassword123');
      await user.type(confirmPasswordInput, 'newPassword123');

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      await user.click(submitButton);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<ResetPasswordPage />);

      const passwordInput = screen.getByLabelText('New Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    it('should have submit button with correct type', () => {
      render(<ResetPasswordPage />);

      const submitButton = screen.getByRole('button', { name: /reset password/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });
});
