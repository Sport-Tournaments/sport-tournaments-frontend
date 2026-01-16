'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout';
import { Button } from '@/components/ui';

export default function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <AuthLayout
      title={t('auth.unauthorized', 'Access Denied')}
      subtitle={t('auth.unauthorizedSubtitle', "You don't have permission to access this page")}
    >
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="text-center space-y-2">
          <p className="text-gray-600">
            {t('auth.unauthorizedMessage', 'Your account does not have the required permissions to view this page.')}
          </p>
          <p className="text-sm text-gray-500">
            {t('auth.unauthorizedContact', 'If you believe this is an error, please contact support.')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link href="/dashboard" className="flex-1">
            <Button variant="primary" fullWidth>
              {t('auth.goToDashboard', 'Go to Dashboard')}
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button variant="outline" fullWidth>
              {t('auth.goToHome', 'Go to Home')}
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
