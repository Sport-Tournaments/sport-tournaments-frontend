'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Input, Alert } from '@/components/ui';
import { useAuthStore } from '@/store';
import { clubService } from '@/services';
import type { Club } from '@/types';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 12;

export default function AdminClubsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchClubs = useCallback(async (page: number) => {
    const params: any = { page, pageSize: PAGE_SIZE };
    if (search) params.search = search;
    
    const response = await clubService.getClubs(params);
    const resData = response.data as any;
    
    // Handle different response structures
    let clubData: Club[] = [];
    let totalPages = 1;
    
    if (Array.isArray(resData)) {
      clubData = resData;
    } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
      clubData = resData.data.items;
      totalPages = resData.data.totalPages || 1;
    } else if (resData?.items && Array.isArray(resData.items)) {
      clubData = resData.items;
      totalPages = resData.totalPages || 1;
    } else if (resData?.data && Array.isArray(resData.data)) {
      clubData = resData.data;
      totalPages = resData.totalPages || 1;
    }
    
    return {
      items: clubData,
      hasMore: page < totalPages,
      totalPages,
    };
  }, [search]);

  const {
    items: clubs,
    isLoading,
    isFetchingMore,
    hasMore,
    error: fetchError,
    sentinelRef,
    retry,
    reset,
  } = useInfiniteScroll<Club>({
    fetchData: fetchClubs,
    dependencies: [search],
  });

  const handleSearch = () => {
    reset();
  };

  const handleVerify = async (clubId: string) => {
    try {
      await clubService.verifyClub(clubId);
      setSuccess('Club verified successfully');
      reset();
    } catch (err: any) {
      setError('Failed to verify club');
    }
  };

  const handleDelete = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) return;
    
    try {
      await clubService.deleteClub(clubId);
      setSuccess('Club deleted successfully');
      reset();
    } catch (err: any) {
      setError('Failed to delete club');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Club Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage and verify clubs
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search clubs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="primary" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clubs List */}
        {isLoading && clubs.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : fetchError ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('common.error')}
              </h3>
              <p className="text-gray-500 mb-4">{fetchError.message}</p>
              <Button variant="primary" onClick={retry}>
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No clubs found</p>
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
                        <img src={club.logo} alt={club.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{club.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/clubs/${club.id}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-primary truncate"
                          >
                            {club.name}
                          </Link>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {club.city}, {club.country}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {club.isVerified ? (
                            <Badge variant="success">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning">Unverified</Badge>
                          )}
                          {club.isPremium && (
                            <Badge variant="info">Premium</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {club.owner && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500">Owner</p>
                        <p className="text-sm font-medium">
                          {club.owner.firstName} {club.owner.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{club.owner.email}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link href={`/clubs/${club.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">View</Button>
                      </Link>
                      {!club.isVerified && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerify(club.id)}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(club.id)}
                      >
                        Delete
                      </Button>
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
