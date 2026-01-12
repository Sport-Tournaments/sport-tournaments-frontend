'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore, useUIStore } from '@/store';
import { Avatar, Dropdown } from '@/components/ui';
import { cn } from '@/utils/helpers';

export default function Header() {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, setTheme, mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const navigation = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.tournaments'), href: '/main/tournaments' },
    { name: t('nav.clubs'), href: '/main/clubs' },
  ];

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm dark:bg-gray-900 dark:shadow-none dark:border-b dark:border-white/10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400 hidden sm:inline">
                Football EU
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:gap-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'border-indigo-500 text-gray-900 dark:border-indigo-400 dark:text-white'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:border-white/20 dark:hover:text-white'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-x-2 sm:gap-x-4">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              aria-label="Toggle theme"
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
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10">
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

            {/* User menu or Auth buttons */}
            {isAuthenticated && user ? (
              <Dropdown
                trigger={
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-white/10">
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
                    label: t('nav.dashboard'),
                    onClick: () => {
                      setShowUserMenu(false);
                      window.location.href = '/dashboard';
                    },
                  },
                  {
                    label: t('nav.profile'),
                    onClick: () => {
                      setShowUserMenu(false);
                      window.location.href = '/dashboard/settings';
                    },
                  },
                  {
                    label: t('nav.settings'),
                    onClick: () => {
                      setShowUserMenu(false);
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
            ) : (
              <div className="flex items-center gap-2 sm:gap-4">
                <Link
                  href="/auth/login"
                  className="text-sm font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-white/10">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium',
                  pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {!isAuthenticated && (
            <div className="border-t border-gray-200 px-4 py-3 dark:border-white/10">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 block rounded-md bg-indigo-600 px-3 py-2 text-base font-medium text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {t('auth.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
