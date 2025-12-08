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
  const { theme, setTheme, toggleSidebar } = useUIStore();
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
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">⚽</span>
              <span className="font-bold text-xl text-primary hidden sm:inline">
                Football EU
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-gray-600 dark:text-gray-300'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Language selector */}
            <Dropdown
              trigger={
                <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1">
                  <span className="text-sm font-medium uppercase">
                    {i18n.language}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                  <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Avatar
                      src={user.profileImageUrl}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="sm"
                    />
                    <span className="hidden md:inline text-sm font-medium">
                      {user.firstName}
                    </span>
                    <svg className="w-4 h-4 hidden md:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                }
                items={[
                  {
                    label: t('nav.dashboard'),
                    onClick: () => {
                      setShowUserMenu(false);
                      window.location.href = '/dashboard/dashboard';
                    },
                  },
                  {
                    label: t('nav.profile'),
                    onClick: () => {
                      setShowUserMenu(false);
                      window.location.href = '/dashboard/dashboard/settings';
                    },
                  },
                  {
                    label: t('nav.settings'),
                    onClick: () => {
                      setShowUserMenu(false);
                      window.location.href = '/dashboard/dashboard/settings';
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
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="btn-ghost text-sm"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary text-sm"
                >
                  {t('auth.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
