'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Loading, Pagination, DataTable } from '@/components/ui';
import { tournamentService } from '@/services';
import { Tournament, TournamentStatus } from '@/types';
import { formatDate } from '@/utils/date';

export default function DashboardTournamentsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTournaments();
  }, [currentPage]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const response = await tournamentService.getMyTournaments();
      setTournaments(Array.isArray(response.data) ? response.data : []);
      setTotalPages(1);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: TournamentStatus) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'DRAFT': 'default',
      'PUBLISHED': 'info',
      'ONGOING': 'info',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return variants[status] || 'default';
  };

  const columns = [
    {
      key: 'name',
      header: t('tournament.name'),
      render: (tournament: Tournament) => (
        <Link href={`/dashboard/tournaments/${tournament.id}`} className="font-medium text-primary hover:underline">
          {tournament.name}
        </Link>
      ),
    },
    {
      key: 'dates',
      header: t('tournament.dates'),
      render: (tournament: Tournament) => (
        <span className="text-sm text-gray-500">
          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
        </span>
      ),
    },
    {
      key: 'teams',
      header: t('common.teams'),
      render: (tournament: Tournament) => (
        <span>{tournament.registeredTeams || 0} / {tournament.maxTeams}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (tournament: Tournament) => (
        <Badge variant={getStatusBadge(tournament.status)}>
          {t(`tournament.status.${tournament.status}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (tournament: Tournament) => (
        <div className="flex gap-2">
          <Link href={`/dashboard/tournaments/${tournament.id}`}>
            <Button variant="ghost" size="sm">
              {t('common.view')}
            </Button>
          </Link>
          <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
            <Button variant="ghost" size="sm">
              {t('common.edit')}
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('nav.myTournaments')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage your tournaments
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
            {loading ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : tournaments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('tournament.noTournaments')}
                </h3>
                <p className="text-gray-500 mb-4">{t('tournament.noTournamentsDesc')}</p>
                <Link href="/dashboard/tournaments/create">
                  <Button variant="primary">{t('tournament.createFirst')}</Button>
                </Link>
              </div>
            ) : (
              <>
                <DataTable columns={columns} data={tournaments} />
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
