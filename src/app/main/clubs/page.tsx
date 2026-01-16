'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, Button, Input, Loading, Avatar } from '@/components/ui';
import { clubService } from '@/services';
import { Club } from '@/types';
import { useDebounce, useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 12;

export default function ClubsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const fetchClubs = useCallback(async (page: number) => {
    const params: Record<string, unknown> = {
      page,
      pageSize: PAGE_SIZE,
    };
    if (debouncedSearch) params.search = debouncedSearch;

    const response = await clubService.getClubs(params);
    const resData = response.data as any;
    
    // Handle different response structures
    let clubData: Club[] = [];
    let totalPages = 1;
    
    if (Array.isArray(resData)) {
      clubData = resData;
    } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
      clubData = resData.data.items;
      totalPages = resData.data.totalPages || resData.data.meta?.totalPages || 1;
    } else if (resData?.items && Array.isArray(resData.items)) {
      clubData = resData.items;
      totalPages = resData.totalPages || resData.meta?.totalPages || 1;
    } else if (resData?.data && Array.isArray(resData.data)) {
      clubData = resData.data;
      totalPages = resData.totalPages || resData.meta?.totalPages || 1;
    }
    
    return {
      items: clubData,
      hasMore: page < totalPages,
      totalPages,
    };
  }, [debouncedSearch]);

  const {
    items: clubs,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
  } = useInfiniteScroll<Club>({
    fetchData: fetchClubs,
    dependencies: [debouncedSearch],
  });

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('club.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('club.subtitle')}
            </p>
          </div>
          <Link href="/dashboard/clubs/create">
            <Button variant="primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('club.create')}
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder={t('common.searchClubs')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            className="max-w-md"
          />
        </div>

        {/* Loading state */}
        {isLoading && clubs.length === 0 ? (
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
        ) : clubs.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('club.noClubs')}
            </h3>
            <p className="text-gray-500 mb-4">{t('club.noClubsDesc')}</p>
            <Link href="/dashboard/clubs/create">
              <Button variant="primary">{t('club.createFirst')}</Button>
            </Link>
          </div>
        ) : (
          /* Clubs grid */
          <>
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {clubs.map((club) => (
                <Link key={club.id} href={`/main/clubs/${club.id}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col items-center text-center">
                        <Avatar
                          src={club.logo}
                          alt={club.name}
                          size="xl"
                          className="mb-4"
                        />
                        <h3 className="font-semibold text-lg mb-1">{club.name}</h3>
                        {club.city && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {club.city}, {club.country}
                          </p>
                        )}
                        {club.description && (
                          <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                            {club.description}
                          </p>
                        )}
                        <div className="flex gap-4 mt-4 text-sm text-gray-500">
                          <span>{club.memberCount || 0} {t('common.members')}</span>
                          <span>{club.teamCount || 0} {t('common.teams')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div 
                ref={sentinelRef} 
                className="flex justify-center py-8"
              >
                {isFetchingMore && <Loading size="md" />}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
