'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, Badge, Button, Input, Select, Loading, GeolocationFilterCompact } from '@/components/ui';
import { tournamentService } from '@/services';
import { formatDistance } from '@/services/location.service';
import { Tournament, TournamentStatus, GeolocationFilters } from '@/types';
import { formatDate } from '@/utils/date';
import { useDebounce, useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 12;

export default function TournamentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [geoFilters, setGeoFilters] = useState<GeolocationFilters>({});
  const debouncedSearch = useDebounce(search, 300);

  const fetchTournaments = useCallback(async (page: number) => {
    const params: Record<string, unknown> = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status;
    
    // Add geolocation params
    if (geoFilters.userLatitude && geoFilters.userLongitude) {
      params.userLatitude = geoFilters.userLatitude;
      params.userLongitude = geoFilters.userLongitude;
      if (geoFilters.maxDistance) params.maxDistance = geoFilters.maxDistance;
      if (geoFilters.sortByDistance) params.sortByDistance = true;
    }

    const response = await tournamentService.getTournaments(params);
    const resData = response.data as any;
    
    // Handle different response structures
    let tournamentData: Tournament[] = [];
    let totalPages = 1;
    
    if (Array.isArray(resData)) {
      // Direct array response
      tournamentData = resData;
      totalPages = 1;
    } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
      // Nested data.items structure
      tournamentData = resData.data.items;
      totalPages = resData.data.totalPages || resData.data.meta?.totalPages || 1;
    } else if (resData?.items && Array.isArray(resData.items)) {
      // data.items structure
      tournamentData = resData.items;
      totalPages = resData.totalPages || resData.meta?.totalPages || 1;
    } else if (resData?.data && Array.isArray(resData.data)) {
      // data.data array structure
      tournamentData = resData.data;
      totalPages = resData.totalPages || resData.meta?.totalPages || 1;
    }
    
    return {
      items: tournamentData,
      hasMore: page < totalPages,
      totalPages,
    };
  }, [debouncedSearch, status, geoFilters]);

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
    dependencies: [debouncedSearch, status, geoFilters],
  });

  const statusOptions = [
    { value: '', label: t('common.all') },
    { value: 'DRAFT' as TournamentStatus, label: t('tournament.status.draft') },
    { value: 'PUBLISHED' as TournamentStatus, label: t('tournament.status.published') },
    { value: 'ONGOING' as TournamentStatus, label: t('tournament.status.ongoing') },
    { value: 'COMPLETED' as TournamentStatus, label: t('tournament.status.completed') },
    { value: 'CANCELLED' as TournamentStatus, label: t('tournament.status.cancelled') },
  ];

  const getStatusBadge = (tournamentStatus: TournamentStatus) => {
    const variants: Partial<Record<TournamentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'>> = {
      'DRAFT': 'default',
      'PUBLISHED': 'info',
      'ONGOING': 'info',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return variants[tournamentStatus] || 'default';
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('tournament.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('tournament.subtitle')}
            </p>
          </div>
          <Link href="/dashboard/tournaments/create">
            <Button variant="primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('tournament.create')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1">
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <GeolocationFilterCompact
            value={geoFilters}
            onChange={setGeoFilters}
          />
        </div>

        {/* Loading state */}
        {isLoading && tournaments.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : error ? (
          /* Error state */
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
          /* Empty state */
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
          /* Tournament grid with infinite scroll */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tournaments.map((tournament) => (
                <Link key={tournament.id} href={`/main/tournaments/${tournament.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    {tournament.bannerImage && (
                      <div className="relative h-40 bg-white border-b border-gray-200 rounded-t-lg overflow-hidden">
                        <img
                          src={tournament.bannerImage}
                          alt={tournament.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={getStatusBadge(tournament.status)}>
                            {t(`tournament.status.${tournament.status}`)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {tournament.name}
                        </h3>
                        {!tournament.bannerImage && (
                          <Badge variant={getStatusBadge(tournament.status)}>
                            {t(`tournament.status.${tournament.status}`)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {tournament.description}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="flex-1 truncate">
                            {tournament.location || t('common.online')}
                          </span>
                          {tournament.distance !== undefined && (
                            <Badge variant="info" className="ml-auto">
                              {formatDistance(tournament.distance)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          {tournament.registeredTeams || 0} / {tournament.maxTeams} {t('common.teams')}
                        </div>
                      </div>
                      {tournament.registrationFee && tournament.registrationFee > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="text-lg font-bold text-primary">
                            €{tournament.registrationFee}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            / {t('common.team')}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Infinite scroll sentinel & loading indicator */}
            <div 
              ref={sentinelRef}
              className="mt-8 flex justify-center py-4"
            >
              {isFetchingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loading size="sm" />
                  <span>{t('common.loading')}</span>
                </div>
              )}
              {!hasMore && tournaments.length > 0 && (
                <p className="text-gray-500 text-sm">
                  {t('common.noMoreResults')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
