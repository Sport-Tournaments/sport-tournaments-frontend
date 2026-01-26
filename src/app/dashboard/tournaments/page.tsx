'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading } from '@/components/ui';
import { tournamentService } from '@/services';
import { Tournament, TournamentStatus } from '@/types';
import { formatDate } from '@/utils/date';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 10;

export default function DashboardTournamentsPage() {
  const { t } = useTranslation();

  const fetchTournaments = useCallback(async (page: number) => {
    // getMyTournaments returns all tournaments for the user (no pagination)
    // We simulate pagination client-side for infinite scroll UX
    if (page > 1) {
      // Already loaded all data on first page
      return { items: [], hasMore: false, totalPages: 1 };
    }
    
    const response = await tournamentService.getMyTournaments();
    const resData = response.data as unknown;
    
    // Handle different response structures
    let tournamentData: Tournament[] = [];
    
    if (Array.isArray(resData)) {
      tournamentData = resData;
    } else if (resData && typeof resData === 'object') {
      const data = resData as Record<string, unknown>;
      if (data.data && Array.isArray(data.data)) {
        tournamentData = data.data as Tournament[];
      } else if (data.items && Array.isArray(data.items)) {
        tournamentData = data.items as Tournament[];
      }
    }
    
    return {
      items: tournamentData,
      hasMore: false, // All data loaded at once
      totalPages: 1,
    };
  }, []);

  const {
    items: tournaments,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
  } = useInfiniteScroll<Tournament>({
    fetchData: fetchTournaments,
  });

  const normalizeStatus = (status: TournamentStatus) =>
    status === 'DRAFT' ? 'PUBLISHED' : status;

  const getStatusBadge = (status: TournamentStatus) => {
    const normalizedStatus = normalizeStatus(status);
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'PUBLISHED': 'info',
      'ONGOING': 'info',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return variants[normalizedStatus] || 'default';
  };

  const getMaxTeamsDisplay = (tournament: Tournament) => {
    const derivedMaxTeams = tournament.maxTeams ?? tournament.ageGroups?.reduce((total, ageGroup) => {
      const ageGroupMaxTeams = ageGroup.teamCount
        ?? ageGroup.maxTeams
        ?? (ageGroup.teamsPerGroup && ageGroup.groupsCount
          ? ageGroup.teamsPerGroup * ageGroup.groupsCount
          : 0);
      return total + (ageGroupMaxTeams || 0);
    }, 0);

    return derivedMaxTeams && derivedMaxTeams > 0 ? derivedMaxTeams : 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('nav.myTournaments')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('dashboard.manageTournaments')}
            </p>
          </div>
          <Link href="/dashboard/tournaments/create" className="self-start sm:self-auto">
            <Button variant="primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('tournament.create')}
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading && tournaments.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('common.error')}
                </h3>
                <p className="text-gray-500 mb-4">{error.message}</p>
                <Button variant="primary" onClick={retry}>
                  {t('common.retry')}
                </Button>
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('tournament.noTournaments')}
                </h3>
                <p className="text-gray-500 mb-4">{t('tournament.noTournamentsDesc')}</p>
                <Link href="/dashboard/tournaments/create">
                  <Button variant="primary">{t('tournament.createFirst')}</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {tournaments.map((tournament) => (
                  <div key={tournament.id} className="p-4 sm:p-6 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {tournament.bannerImage ? (
                          <img src={tournament.bannerImage} alt={tournament.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/dashboard/tournaments/${tournament.id}`} className="font-semibold text-gray-900 hover:text-primary">
                              {tournament.name}
                            </Link>
                            <Badge variant={getStatusBadge(tournament.status)}>
                              {t(`tournament.status.${normalizeStatus(tournament.status)}`)}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {tournament.registeredTeams ?? 0} / {getMaxTeamsDisplay(tournament)} {t('common.teams')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 self-start sm:self-center">
                        <Link href={`/dashboard/tournaments/${tournament.id}`}>
                          <Button variant="outline" size="sm">
                            {t('common.view')}
                          </Button>
                        </Link>
                        <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
                          <Button variant="primary" size="sm">
                            {t('common.edit')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Infinite scroll sentinel */}
                {hasMore && (
                  <div 
                    ref={sentinelRef} 
                    className="flex justify-center py-8"
                  >
                    {isFetchingMore && <Loading size="md" />}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
