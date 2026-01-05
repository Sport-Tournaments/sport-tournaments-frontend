'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Input, Select, Alert } from '@/components/ui';
import { useAuthStore } from '@/store';
import { tournamentService } from '@/services';
import type { Tournament, TournamentStatus } from '@/types';
import { formatDate } from '@/utils/date';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 10;

export default function AdminTournamentsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const fetchTournaments = useCallback(async (page: number) => {
    const params: any = { page, pageSize: PAGE_SIZE };
    if (statusFilter !== 'all') params.status = statusFilter;
    if (search) params.search = search;
    
    const response = await tournamentService.getTournaments(params);
    const resData = response.data as any;
    
    // Handle different response structures
    let tournamentData: Tournament[] = [];
    let totalPages = 1;
    
    if (Array.isArray(resData)) {
      tournamentData = resData;
    } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
      tournamentData = resData.data.items;
      totalPages = resData.data.totalPages || 1;
    } else if (resData?.items && Array.isArray(resData.items)) {
      tournamentData = resData.items;
      totalPages = resData.totalPages || 1;
    } else if (resData?.data && Array.isArray(resData.data)) {
      tournamentData = resData.data;
      totalPages = resData.totalPages || 1;
    }
    
    return {
      items: tournamentData,
      hasMore: page < totalPages,
      totalPages,
    };
  }, [statusFilter, search]);

  const {
    items: tournaments,
    isLoading,
    isFetchingMore,
    hasMore,
    error: fetchError,
    sentinelRef,
    retry,
    reset,
  } = useInfiniteScroll<Tournament>({
    fetchData: fetchTournaments,
    dependencies: [statusFilter, search],
  });

  const handleSearch = () => {
    reset();
  };

  const handleStatusChange = async (tournamentId: string, newStatus: TournamentStatus) => {
    try {
      await tournamentService.adminUpdateTournament(tournamentId, { status: newStatus });
      setSuccess('Tournament status updated');
      reset();
    } catch (err: any) {
      setError('Failed to update tournament status');
    }
  };

  const handleDelete = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) return;
    
    try {
      await tournamentService.deleteTournament(tournamentId);
      setSuccess('Tournament deleted successfully');
      reset();
    } catch (err: any) {
      setError('Failed to delete tournament');
    }
  };

  const getStatusBadge = (status: TournamentStatus) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      DRAFT: 'default',
      PUBLISHED: 'info',
      ONGOING: 'success',
      COMPLETED: 'success',
      CANCELLED: 'danger',
    };
    return variants[status] || 'default';
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'DRAFT', label: t('tournament.status.DRAFT') },
    { value: 'PUBLISHED', label: t('tournament.status.PUBLISHED') },
    { value: 'ONGOING', label: t('tournament.status.ONGOING') },
    { value: 'COMPLETED', label: t('tournament.status.COMPLETED') },
    { value: 'CANCELLED', label: t('tournament.status.CANCELLED') },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Tournament Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage all platform tournaments
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search tournaments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="w-full sm:w-48">
                  <Select
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  />
                </div>
                <Button variant="primary" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tournaments List */}
        {isLoading && tournaments.length === 0 ? (
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
        ) : tournaments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No tournaments found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {tournament.bannerImage ? (
                          <img src={tournament.bannerImage} alt={tournament.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/tournaments/${tournament.id}`}
                              className="font-semibold text-lg text-gray-900 dark:text-white hover:text-primary"
                            >
                              {tournament.name}
                            </Link>
                            <Badge variant={getStatusBadge(tournament.status)}>
                              {t(`tournament.status.${tournament.status}`)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            {tournament.location}{tournament.country ? `, ${tournament.country}` : ''}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
                            <span>{tournament.registeredTeams || 0} / {tournament.maxTeams} teams</span>
                            {(tournament as any).organizer && (
                              <span>by {(tournament as any).organizer.firstName} {(tournament as any).organizer.lastName}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/tournaments/${tournament.id}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                        <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                        {tournament.status === ('DRAFT' as TournamentStatus) && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleStatusChange(tournament.id, 'PUBLISHED' as TournamentStatus)}
                          >
                            Publish
                          </Button>
                        )}
                        {tournament.status === 'PUBLISHED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusChange(tournament.id, 'ONGOING')}
                          >
                            Start Tournament
                          </Button>
                        )}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(tournament.id)}
                        >
                          Delete
                        </Button>
                      </div>
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
