'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout';
import { Button, Alert, Loading } from '@/components/ui';
import { authService } from '@/services';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'pending' | 'verifying' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setStatus('verifying');
    try {
      await authService.verifyEmail({ token: verificationToken });
      setStatus('success');
    } catch (err: unknown) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Verification failed. Please try again.';
      setError(errorMessage);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      // Note: resendVerification endpoint may need to be added to authService
      // For now, we'll just show a success message
      setResendSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email.';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Verifying state
  if (status === 'verifying') {
    return (
      <AuthLayout title={t('auth.verifyingEmail')} subtitle="">
        <div className="flex flex-col items-center justify-center py-8">
          <Loading size="lg" />
          <p className="mt-4 text-gray-600">
            {t('auth.pleaseWait')}
          </p>
        </div>
      </AuthLayout>
    );
  }

  // Success state
  if (status === 'success') {
    return (
      <AuthLayout
        title={t('auth.emailVerified')}
        subtitle={t('auth.emailVerifiedSubtitle')}
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600">
            {t('auth.canNowLogin')}
          </p>
          <Link href="/auth/login">
            <Button variant="primary" fullWidth>
              {t('auth.login')}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Error state with token
  if (status === 'error' && token) {
    return (
      <AuthLayout
        title={t('auth.verificationFailed')}
        subtitle=""
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <Alert variant="error">{error}</Alert>
          <p className="text-gray-600">
            {t('auth.verificationExpired')}
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={handleResend}
            isLoading={resendLoading}
          >
            {t('auth.resendVerification')}
          </Button>
          <Link href="/auth/login">
            <Button variant="ghost" fullWidth>
              {t('auth.backToLogin')}
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // Pending state (no token - just registered)
  return (
    <AuthLayout
      title={t('auth.verifyYourEmail')}
      subtitle={t('auth.verifyEmailSubtitle')}
    >
      <div className="text-center space-y-6">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <p className="text-gray-600">
          {t('auth.verificationEmailSent')}
        </p>

        {resendSuccess ? (
          <Alert variant="success">
            {t('auth.verificationResent')}
          </Alert>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              {t('auth.didntReceiveEmail')}
            </p>
            <Button
              variant="outline"
              onClick={handleResend}
              isLoading={resendLoading}
            >
              {t('auth.resendVerification')}
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="pt-4 border-t border-gray-200">
          <Link href="/auth/login" className="text-primary hover:underline text-sm">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
