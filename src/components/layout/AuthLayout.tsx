'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ro' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-xl text-primary">Worldwide Football</span>
          </Link>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {i18n.language === 'en' ? '🇬🇧 EN' : '🇷🇴 RO'}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Form content */}
            {children}
          </div>

          {/* Footer links */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <Link href="/terms" className="hover:text-primary">
              {t('footer.terms')}
            </Link>
            <span className="mx-2">·</span>
            <Link href="/privacy" className="hover:text-primary">
              {t('footer.privacy')}
            </Link>
            <span className="mx-2">·</span>
            <Link href="/contact" className="hover:text-primary">
              {t('footer.contact')}
            </Link>
          </div>
        </div>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
