'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Loading } from '@/components/ui';
import { useAuthStore } from '@/store';
import { tournamentService, clubService, registrationService } from '@/services';
import { Tournament, Club, Registration } from '@/types';
import { formatDate } from '@/utils/date';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tournaments: 0,
    clubs: 0,
    registrations: 0,
    pending: 0,
  });
  const [recentTournaments, setRecentTournaments] = useState<Tournament[]>([]);
  const [recentClubs, setRecentClubs] = useState<Club[]>([]);
  const [recentRegistrations, setRecentRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tournamentsRes, clubsRes, registrationsRes] = await Promise.all([
        tournamentService.getMyTournaments(),
        clubService.getMyClubs(),
        registrationService.getMyRegistrations(),
      ]);

      const tData = (tournamentsRes as any)?.data;
      const tournamentData: Tournament[] = Array.isArray(tData) ? tData : [];
      const tournamentTotal = tournamentData.length;

      const cData = (clubsRes as any)?.data;
      let clubData: Club[] = [];
      if (Array.isArray(cData)) {
        clubData = cData;
      } else if (cData?.data?.items && Array.isArray(cData.data.items)) {
        clubData = cData.data.items;
      } else if (cData?.items && Array.isArray(cData.items)) {
        clubData = cData.items;
      } else if (cData?.data && Array.isArray(cData.data)) {
        clubData = cData.data;
      }
      const clubTotal = clubData.length;

      // Handle registrations response
      const rData = registrationsRes.data as any;
      let registrationData: Registration[] = [];
      if (Array.isArray(rData)) {
        registrationData = rData;
      } else if (rData?.data && Array.isArray(rData.data)) {
        registrationData = rData.data;
      } else if (rData?.items && Array.isArray(rData.items)) {
        registrationData = rData.items;
      }

      setRecentTournaments(tournamentData.slice(0, 5));
      setRecentClubs(clubData.slice(0, 5));
      setRecentRegistrations(registrationData);

      setStats({
        tournaments: tournamentTotal,
        clubs: clubTotal,
        registrations: registrationData.length,
        pending: registrationData.filter((r: Registration) => r.status === ('PENDING' as any)).length,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t('dashboard.welcome')}, {user?.firstName}! 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t('dashboard.overview')}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/tournaments" className="block">
            <Card variant="hover" className="h-full">
              <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tournaments}</p>
                  <p className="text-sm text-gray-500">{t('dashboard.tournaments')}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/clubs" className="block">
            <Card variant="hover" className="h-full">
              <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.clubs}</p>
                  <p className="text-sm text-gray-500">{t('dashboard.clubs')}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/registrations" className="block">
            <Card variant="hover" className="h-full">
              <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.registrations}</p>
                  <p className="text-sm text-gray-500">{t('dashboard.registrations')}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/registrations" className="block">
            <Card variant="hover" className="h-full">
              <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-gray-500">{t('dashboard.pending')}</p>
                </div>
              </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tournaments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('dashboard.recentTournaments')}</CardTitle>
                <Link href="/dashboard/tournaments" className="text-sm text-primary hover:underline">
                  {t('common.viewAll')}
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTournaments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('dashboard.noTournaments')}</p>
              ) : (
                <ul className="space-y-3">
                  {recentTournaments.map((tournament) => (
                    <li key={tournament.id}>
                      <Link
                        href={`/main/tournaments/${tournament.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{tournament.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                          </p>
                        </div>
                        <Badge variant={tournament.status === 'ONGOING' ? 'success' : 'default'}>
                          {tournament.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('dashboard.recentRegistrations')}</CardTitle>
                <Link href="/dashboard/registrations" className="text-sm text-primary hover:underline">
                  {t('common.viewAll')}
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentRegistrations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">{t('dashboard.noRegistrations')}</p>
              ) : (
                <ul className="space-y-3">
                  {recentRegistrations.map((registration) => (
                    <li key={registration.id}>
                      <Link
                        href={`/dashboard/registrations/${registration.id}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-primary/5 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{registration.club?.name || 'Unknown Club'}</p>
                          <p className="text-sm text-gray-500">
                            {registration.tournament?.name || 'Unknown Tournament'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            (registration.status as string) === 'APPROVED'
                              ? 'success'
                              : (registration.status as string) === 'PENDING'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {registration.status}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Link
                href="/dashboard/tournaments/create"
                className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs sm:text-sm font-medium text-center">{t('dashboard.createTournament')}</span>
              </Link>
              <Link
                href="/dashboard/clubs/create"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <span className="text-sm font-medium">{t('dashboard.createClub')}</span>
              </Link>
              <Link
                href="/main/tournaments"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-sm font-medium">{t('dashboard.browseTournaments')}</span>
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">{t('dashboard.settings')}</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
