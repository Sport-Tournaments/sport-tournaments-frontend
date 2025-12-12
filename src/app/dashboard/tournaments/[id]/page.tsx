'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Tabs } from '@/components/ui';
import { tournamentService, registrationService } from '@/services';
import type { Tournament, Registration, TournamentStatus, RegistrationStatus } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatCurrency } from '@/utils/helpers';

export default function TournamentDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [tournamentData, registrationsData] = await Promise.all([
        tournamentService.getTournamentById(params.id as string),
        registrationService.getTournamentRegistrations(params.id as string, {}),
      ]);
      setTournament(tournamentData.data);
      setRegistrations(registrationsData.data.items || []);
    } catch (err: any) {
      setError('Failed to load tournament');
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

  const getRegistrationStatusBadge = (status: RegistrationStatus) => {
    const variants: Record<RegistrationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'WITHDRAWN': 'default',
    };
    return variants[status] || 'default';
  };

  const handleStatusChange = async (newStatus: TournamentStatus) => {
    if (!tournament) return;
    try {
      await tournamentService.updateTournament(tournament.id, { status: newStatus } as any);
      setTournament({ ...tournament, status: newStatus });
    } catch (err: any) {
      setError('Failed to update status');
    }
  };

  const handleApproveRegistration = async (registrationId: string) => {
    try {
      await registrationService.approveRegistration(registrationId);
      fetchData();
    } catch (err: any) {
      setError('Failed to approve registration');
    }
  };

  const handleRejectRegistration = async (registrationId: string) => {
    try {
      await registrationService.rejectRegistration(registrationId);
      fetchData();
    } catch (err: any) {
      setError('Failed to reject registration');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tournament) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Tournament not found'}</Alert>
      </DashboardLayout>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: t('tournament.overview'),
      content: (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">{t('common.teams')}</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {tournament.registeredTeams || 0} / {tournament.maxTeams}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{t('tournament.entryFee')}</p>
                <p className="text-2xl font-bold">{formatCurrency(tournament.entryFee || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{t('tournament.prizeMoney')}</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(tournament.prizeMoney || 0)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-500">{t('registration.pending')}</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {registrations.filter(r => (r.status as string) === 'PENDING').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('tournament.dates')}</p>
                  <p className="font-medium">
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('tournament.registrationDeadline')}</p>
                  <p className="font-medium">{tournament.registrationDeadline ? formatDate(tournament.registrationDeadline) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('tournament.location')}</p>
                  <p className="font-medium">{tournament.location}</p>
                  {(tournament as any).venue && <p className="text-gray-500">{(tournament as any).venue}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('common.city')}, {t('common.country')}</p>
                  <p className="font-medium">{tournament.location}, {tournament.country || ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('tournament.ageCategory.label')}</p>
                  <p className="font-medium">{t(`tournament.ageCategory.${tournament.ageCategory}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('tournament.level.label')}</p>
                  <p className="font-medium">{t(`tournament.level.${tournament.level}`)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('tournament.description')}</p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {tournament.description}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'registrations',
      label: `${t('registration.title')} (${registrations.length})`,
      content: (
        <Card>
          <CardContent className="p-0">
            {registrations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('registration.noRegistrations')}
                </h3>
                <p className="text-gray-500">{t('registration.noRegistrationsDesc')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.team')} / {t('common.club')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.status')}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {registration.club?.name || registration.coachName || '-'}
                          </div>
                          {registration.coachPhone && (
                            <div className="text-sm text-gray-500">{registration.coachPhone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(registration.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getRegistrationStatusBadge(registration.status)}>
                            {t(`registration.status.${registration.status}`)}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {registration.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleApproveRegistration(registration.id)}
                              >
                                {t('registration.approve')}
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleRejectRegistration(registration.id)}
                              >
                                {t('registration.reject')}
                              </Button>
                            </>
                          )}
                          <Link href={`/dashboard/registrations/${registration.id}`}>
                            <Button size="sm" variant="ghost">{t('common.view')}</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'groups',
      label: t('tournament.groups'),
      content: (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Groups & Draw
            </h3>
            <p className="text-gray-500 mb-4">Set up groups and perform the draw</p>
            <Button variant="primary">Create Groups</Button>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'matches',
      label: t('tournament.matches'),
      content: (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Match Schedule
            </h3>
            <p className="text-gray-500 mb-4">Generate and manage match schedule</p>
            <Button variant="primary">Generate Schedule</Button>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {tournament.name}
              </h1>
              <Badge variant={getStatusBadge(tournament.status)}>
                {t(`tournament.status.${tournament.status}`)}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {tournament.location}{tournament.country ? `, ${tournament.country}` : ''} • {formatDate(tournament.startDate)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/main/tournaments/${tournament.id}`}>
              <Button variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {t('common.viewPublic')}
              </Button>
            </Link>
            <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
              <Button variant="primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('common.edit')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Actions */}
        {tournament.status === ('DRAFT' as TournamentStatus) && (
          <Alert variant="info" className="flex items-center justify-between">
            <span>This tournament is in draft mode. Publish it to make it visible.</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange('PUBLISHED' as TournamentStatus)}
            >
              Publish Tournament
            </Button>
          </Alert>
        )}

        {tournament.status === 'PUBLISHED' && (
          <Alert variant="info" className="flex items-center justify-between">
            <span>Tournament is published and accepting registrations.</span>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleStatusChange('ONGOING')}
            >
              Start Tournament
            </Button>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab="overview" />
      </div>
    </DashboardLayout>
  );
}
