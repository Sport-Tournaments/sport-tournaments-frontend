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
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();
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
    <header className="sticky top-0 z-40 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tight text-gray-900">
                tournamente
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
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-x-2 sm:gap-x-4">
            {/* Language selector */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100">
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
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-gray-100">
                    <Avatar
                      src={user.profileImageUrl}
                      firstName={user.firstName}
                      lastName={user.lastName}
                      size="sm"
                    />
                    <span className="hidden md:inline text-sm font-medium text-gray-700">
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
                  className="text-sm font-semibold text-gray-900 hover:text-gray-700"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
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
        <div className="lg:hidden border-t border-gray-200">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium',
                  pathname === item.href
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {!isAuthenticated && (
            <div className="border-t border-gray-200 px-4 py-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 block rounded-md bg-indigo-600 px-3 py-2 text-base font-medium text-white hover:bg-indigo-500"
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
