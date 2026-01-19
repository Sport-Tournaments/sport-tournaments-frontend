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
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Mobile menu button */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <Link href="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tight text-teal-600">
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
                    ? 'border-teal-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
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
                <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
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
                  <button className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100">
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
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  {t('auth.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-lg bg-teal-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
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
        <div className="lg:hidden border-t border-slate-200">
          {/* Site Navigation */}
          <div className="space-y-1 px-4 pb-3 pt-2">
            <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {t('nav.browseLabel', 'Browse')}
            </p>
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block rounded-lg px-3 py-2 text-base font-medium',
                  pathname === item.href
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          {isAuthenticated ? (
            <div className="border-t border-slate-200 px-4 py-3">
              <p className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {t('nav.myAccountLabel', 'My Account')}
              </p>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-teal-700 bg-teal-50 hover:bg-teal-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('nav.dashboard')}
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('nav.settings')}
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('auth.logout')}
              </button>
            </div>
          ) : (
            <div className="border-t border-slate-200 px-4 py-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 block rounded-lg bg-teal-600 px-3 py-2 text-base font-medium text-white hover:bg-teal-700"
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
