'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '@/store';
import { Avatar, Dropdown } from '@/components/ui';

export default function DashboardHeader() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    await logout();
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-gray-900/80 dark:border-white/10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button and breadcrumb area */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
              aria-label="Toggle menu"
            >
              <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Optional: Show logo on mobile */}
            <Link href="/" className="lg:hidden flex items-center gap-2">
              <span className="text-2xl">⚽</span>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-x-2 sm:gap-x-4">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-md p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-white/10 transition-colors"
              aria-label={t('common.toggleTheme', 'Toggle theme')}
            >
              {theme === 'dark' ? (
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>

            {/* Language selector */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors">
                  <span className="uppercase">
                    {i18n.language}
                  </span>
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              }
              items={[
                { label: '🇬🇧 English', onClick: () => changeLanguage('en') },
                { label: '🇷🇴 Română', onClick: () => changeLanguage('ro') },
              ]}
              align="right"
            />

            {/* User menu */}
            {user && (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <Avatar
                      src={user.profileImageUrl}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="sm"
                    />
                    <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.firstName}
                    </span>
                    <svg className="size-4 hidden md:inline text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                }
                items={[
                  {
                    label: t('nav.home'),
                    onClick: () => {
                      window.location.href = '/';
                    },
                  },
                  {
                    label: t('nav.tournaments'),
                    onClick: () => {
                      window.location.href = '/main/tournaments';
                    },
                  },
                  {
                    label: t('nav.clubs'),
                    onClick: () => {
                      window.location.href = '/main/clubs';
                    },
                  },
                  { label: '', onClick: () => {}, divider: true },
                  {
                    label: t('nav.settings'),
                    onClick: () => {
                      window.location.href = '/dashboard/settings';
                    },
                  },
                  { label: '', onClick: () => {}, divider: true },
                  {
                    label: t('auth.logout'),
                    onClick: handleLogout,
                    danger: true,
                  },
                ]}
                align="right"
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
