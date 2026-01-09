'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading } from '@/components/ui';
import { clubService } from '@/services';
import { Club } from '@/types';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 12;

export default function DashboardClubsPage() {
  const { t } = useTranslation();

  const fetchClubs = useCallback(async (page: number) => {
    // getMyClubs returns all clubs for the user (no pagination)
    // We simulate pagination client-side for infinite scroll UX
    if (page > 1) {
      // Already loaded all data on first page
      return { items: [], hasMore: false, totalPages: 1 };
    }
    
    const response = await clubService.getMyClubs();
    const resData = response.data as unknown;
    
    // Handle different response structures
    let clubData: Club[] = [];
    
    if (Array.isArray(resData)) {
      clubData = resData;
    } else if (resData && typeof resData === 'object') {
      const data = resData as Record<string, unknown>;
      if (data.data && Array.isArray(data.data)) {
        clubData = data.data as Club[];
      } else if (data.items && Array.isArray(data.items)) {
        clubData = data.items as Club[];
      }
    }
    
    return {
      items: clubData,
      hasMore: false, // All data loaded at once
      totalPages: 1,
    };
  }, []);

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
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('nav.myClubs')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage your clubs and players
            </p>
          </div>
          <Link href="/dashboard/clubs/create" className="self-start sm:self-auto">
            <Button variant="primary">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('clubs.create')}
            </Button>
          </Link>
        </div>

        {isLoading && clubs.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('common.error')}
              </h3>
              <p className="text-gray-500 mb-4">{error.message}</p>
              <Button variant="primary" onClick={retry}>
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('clubs.noClubs')}
              </h3>
              <p className="text-gray-500 mb-4">{t('clubs.noClubsDesc')}</p>
              <Link href="/dashboard/clubs/create">
                <Button variant="primary">{t('clubs.createFirst')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {clubs.map((club) => (
                <Card key={club.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {club.logo ? (
                        <img
                          src={club.logo}
                          alt={club.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {club.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/dashboard/clubs/${club.id}`}
                          className="font-semibold text-gray-900 dark:text-white hover:text-primary"
                        >
                          {club.name}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {club.city}, {club.country}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="info">
                            {club.memberCount || 0} {t('common.members')}
                          </Badge>
                          {(club.verified || club.isVerified) && (
                            <Badge variant="success">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {t('common.verified')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link href={`/dashboard/clubs/${club.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          {t('common.view')}
                        </Button>
                      </Link>
                      <Link href={`/dashboard/clubs/${club.id}/edit`} className="flex-1">
                        <Button variant="primary" size="sm" className="w-full">
                          {t('common.manage')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
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
    </DashboardLayout>
  );
}
