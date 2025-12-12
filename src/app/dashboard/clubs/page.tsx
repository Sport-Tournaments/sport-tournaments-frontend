'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Loading, Pagination } from '@/components/ui';
import { clubService } from '@/services';
import { Club } from '@/types';

export default function DashboardClubsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchClubs();
  }, [currentPage]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const response = await clubService.getMyClubs();
      const resData = response.data as any;
      
      // Handle different response structures
      let clubData: Club[] = [];
      let pages = 1;
      
      if (Array.isArray(resData)) {
        clubData = resData;
      } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
        clubData = resData.data.items;
        pages = resData.data.totalPages || resData.data.meta?.totalPages || 1;
      } else if (resData?.items && Array.isArray(resData.items)) {
        clubData = resData.items;
        pages = resData.totalPages || resData.meta?.totalPages || 1;
      } else if (resData?.data && Array.isArray(resData.data)) {
        clubData = resData.data;
        pages = resData.totalPages || resData.meta?.totalPages || 1;
      }
      
      setClubs(clubData);
      setTotalPages(pages);
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

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

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
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

            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
