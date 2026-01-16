'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '@/store';
import { Avatar, Dropdown } from '@/components/ui';

export default function DashboardHeader() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    await logout();
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile menu button and breadcrumb area */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-lg p-2.5 text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            {/* Optional: Show logo on mobile */}
            <Link href="/" className="lg:hidden flex items-center">
              <span className="text-xl font-black tracking-tight text-teal-600">
                tournamente
              </span>
            </Link>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-x-2 sm:gap-x-4">
            {/* Language selector */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
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
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 transition-colors">
                    <Avatar
                      src={user.profileImageUrl}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="sm"
                    />
                    <span className="hidden md:inline text-sm font-medium text-slate-700">
                      {user.firstName}
                    </span>
                    <svg className="size-4 hidden md:inline text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
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
