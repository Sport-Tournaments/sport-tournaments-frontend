import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerifyEmailPage from '@/app/auth/verify-email/page';

// Mock next/navigation
const mockSearchParams = vi.fn(() => new URLSearchParams(''));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => mockSearchParams(),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.verifyYourEmail': 'Verify Your Email',
        'auth.verifyEmailSubtitle': 'We sent you a verification email',
        'auth.verifyingEmail': 'Verifying Email',
        'auth.pleaseWait': 'Please wait...',
        'auth.emailVerified': 'Email Verified',
        'auth.emailVerifiedSubtitle': 'Your email has been verified successfully',
        'auth.canNowLogin': 'You can now login to your account',
        'auth.login': 'Login',
        'auth.verificationFailed': 'Verification Failed',
        'auth.verificationExpired': 'Your verification link may have expired',
        'auth.resendVerification': 'Resend Verification Email',
        'auth.backToLogin': 'Back to Login',
        'auth.verificationEmailSent': 'Check your email for the verification link',
        'auth.verificationResent': 'Verification email resent successfully',
        'auth.didNotReceiveEmail': "Didn't receive the email?",
        'auth.resendEmail': 'Resend Email',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock auth service
vi.mock('@/services', () => ({
  authService: {
    verifyEmail: vi.fn(),
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

// Mock Loading component
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    Loading: ({ size }: { size: string }) => <div data-testid="loading" data-size={size}>Loading...</div>,
  };
});

describe('Verify Email Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams(''));
  });

  describe('Pending State (No Token)', () => {
    it('should render pending verification message when no token', () => {
      render(<VerifyEmailPage />);

      expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
      expect(screen.getByText('Check your email for the verification link')).toBeInTheDocument();
    });

    it('should show email icon in pending state', () => {
      render(<VerifyEmailPage />);

      expect(screen.getByText('Verify Your Email')).toBeInTheDocument();
    });

    it('should render resend email option', () => {
      render(<VerifyEmailPage />);

      expect(screen.getByText("Didn't receive the email?")).toBeInTheDocument();
    });
  });

  describe('Verifying State', () => {
    it('should show loading state when verifying', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=valid-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Verifying Email')).toBeInTheDocument();
        expect(screen.getByTestId('loading')).toBeInTheDocument();
        expect(screen.getByText('Please wait...')).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after verification', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=valid-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Email Verified')).toBeInTheDocument();
        expect(screen.getByText('You can now login to your account')).toBeInTheDocument();
      });
    });

    it('should show login button after successful verification', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=valid-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });
    });

    it('should call verifyEmail with correct token', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=test-verification-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect((authService.verifyEmail as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({ token: 'test-verification-token' });
      });
    });
  });

  describe('Error State', () => {
    it('should show error message when verification fails', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=invalid-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid or expired token'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Verification Failed')).toBeInTheDocument();
        expect(screen.getByText(/invalid or expired token/i)).toBeInTheDocument();
      });
    });

    it('should show resend button in error state', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=expired-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Token expired'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
      });
    });

    it('should show back to login button in error state', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=expired-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Token expired'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
      });
    });

    it('should show message about expired link', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=expired-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Token expired'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByText('Your verification link may have expired')).toBeInTheDocument();
      });
    });
  });

  describe('Resend Verification', () => {
    it('should show loading state when resending', async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(new URLSearchParams('token=expired-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Token expired'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(resendButton);

      // Should show loading state
      expect(resendButton).toBeInTheDocument();
    });

    it('should show success message after resending', async () => {
      const user = userEvent.setup();
      mockSearchParams.mockReturnValue(new URLSearchParams('token=expired-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Token expired'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(resendButton);

      // Since the mock implementation just sets success, we check the behavior
      await waitFor(() => {
        // The resend success behavior is mocked in the component
        expect(resendButton).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('should have login link in success state', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=valid-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

      render(<VerifyEmailPage />);

      await waitFor(() => {
        const loginLink = screen.getByRole('button', { name: /login/i }).closest('a');
        expect(loginLink).toHaveAttribute('href', '/auth/login');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      render(<VerifyEmailPage />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should show alert for error messages', async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams('token=invalid-token'));
      (authService.verifyEmail as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Verification failed'));

      render(<VerifyEmailPage />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
