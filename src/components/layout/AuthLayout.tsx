'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import MainLayout from './MainLayout';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleBack = () => {
    // Check if there's a back URL in the query parameters (where user came from)
    const backUrl = searchParams.get('backUrl');
    if (backUrl) {
      // Navigate to the back URL (the page user came from before redirect)
      router.push(decodeURIComponent(backUrl));
    } else {
      // Fallback to browser back navigation
      router.back();
    }
  };

  return (
    <MainLayout>
      <div className="min-h-full bg-gradient-to-br from-[#dbeafe] via-white to-slate-50 px-4 py-10 sm:py-14">
        <div className="mx-auto flex min-h-[calc(100vh-16rem)] w-full max-w-5xl items-center justify-center">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
              <div className="mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-[#dbeafe] hover:text-slate-900"
                  aria-label={t('common.back', 'Go back')}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  {t('common.back', 'Back')}
                </button>
              </div>

              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-2 text-slate-600">
                    {subtitle}
                  </p>
                )}
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
