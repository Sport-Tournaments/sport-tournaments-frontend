'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Alert, Loading, Tabs, InvitationCodeManager, Modal } from '@/components/ui';
import { tournamentService, registrationService, fileService } from '@/services';
import type { Tournament, Registration, TournamentStatus, RegistrationStatus } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatCurrency, getTournamentPublicPath } from '@/utils/helpers';

export default function TournamentDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingRegulations, setDownloadingRegulations] = useState(false);
  const [updatingRegistrations, setUpdatingRegistrations] = useState(false);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRegistrationId, setRejectingRegistrationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Handle downloading/viewing regulations PDF
  const handleDownloadRegulations = async () => {
    if (!tournament?.regulationsDocument) return;
    
    setDownloadingRegulations(true);
    try {
      // Track the download
      await tournamentService.trackRegulationsDownload(tournament.id);
      
      // Get presigned URL with inline disposition for viewing in browser
      const response = await fileService.getFileDownloadUrl(tournament.regulationsDocument, true);
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
      }
    } catch (err) {
      console.error('Failed to download regulations:', err);
      setError(t('tournament.regulationsDownloadError', 'Failed to download regulations. Please try again.'));
    } finally {
      setDownloadingRegulations(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const tournamentData = await tournamentService.getTournamentById(params.id as string);
      setTournament(tournamentData.data);
      
      // Fetch registrations separately to handle errors gracefully
      try {
        const registrationsData = await registrationService.getTournamentRegistrations(params.id as string, {});
        const items = registrationsData?.data?.items || [];
        setRegistrations(Array.isArray(items) ? items : []);
      } catch (regErr) {
        console.error('Failed to load registrations:', regErr);
        setRegistrations([]);
      }
    } catch (err: any) {
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

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

  const getRegistrationStatusBadge = (status: RegistrationStatus) => {
    const variants: Record<RegistrationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'WITHDRAWN': 'default',
    };
    return variants[status] || 'default';
  };

  const handleApproveRegistrationWithPayment = async (registrationId: string) => {
    try {
      await registrationService.approveRegistrationWithPayment(registrationId);
      fetchData();
    } catch (err: any) {
      setError('Failed to approve registration with payment');
    }
  };

  const handleApproveRegistrationWithoutPayment = async (registrationId: string) => {
    try {
      await registrationService.approveRegistrationWithoutPayment(registrationId);
      fetchData();
    } catch (err: any) {
      setError('Failed to approve registration without payment');
    }
  };

  const handleStopRegistrations = async () => {
    if (!tournament) return;
    setUpdatingRegistrations(true);
    setError(null);
    try {
      await tournamentService.updateTournament(tournament.id, {
        isRegistrationClosed: true,
      } as any);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop registrations');
    } finally {
      setUpdatingRegistrations(false);
    }
  };

  const handleRejectRegistration = (registrationId: string) => {
    setRejectingRegistrationId(registrationId);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const confirmRejectRegistration = async () => {
    if (!rejectingRegistrationId || !rejectionReason.trim()) return;
    
    setRejecting(true);
    try {
      await registrationService.rejectRegistration(rejectingRegistrationId, { rejectionReason: rejectionReason.trim() });
      setRejectModalOpen(false);
      setRejectingRegistrationId(null);
      setRejectionReason('');
      fetchData();
    } catch (err: any) {
      setError('Failed to reject registration');
    } finally {
      setRejecting(false);
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

  const derivedMaxTeams = tournament.maxTeams ?? tournament.ageGroups?.reduce((total, ageGroup) => {
    const ageGroupMaxTeams = ageGroup.teamCount
      ?? ageGroup.maxTeams
      ?? (ageGroup.teamsPerGroup && ageGroup.groupsCount
        ? ageGroup.teamsPerGroup * ageGroup.groupsCount
        : 0);
    return total + (ageGroupMaxTeams || 0);
  }, 0);
  const maxTeamsDisplay = derivedMaxTeams && derivedMaxTeams > 0 ? derivedMaxTeams : 0;
  const registeredTeamsDisplay = tournament.registeredTeams ?? registrations.length ?? 0;

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
                  {registeredTeamsDisplay} / {maxTeamsDisplay}
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
                  <p className="text-sm text-gray-500">{t('tournament.startDate')}</p>
                  <p className="font-medium">{formatDate(tournament.startDate)}</p>
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
                  <p className="font-medium">
                    {tournament.ageCategory
                      ? t(`tournament.ageCategory.${tournament.ageCategory}`)
                      : tournament.ageGroups?.[0]?.ageCategory
                        ? t(`tournament.ageCategory.${tournament.ageGroups[0].ageCategory}`)
                        : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('tournament.level.label')}</p>
                  <p className="font-medium">
                    {tournament.level
                      ? t(`tournament.level.${tournament.level}`)
                      : tournament.ageGroups?.[0]?.level
                        ? t(`tournament.level.${tournament.ageGroups[0].level}`)
                        : '—'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('tournament.description')}</p>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {tournament.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Regulations Document */}
          {tournament.regulationsDocument && (
            <Card>
              <CardHeader>
                <CardTitle>{t('tournament.regulationsDocument', 'Regulations Document')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
                        <path d="M8 12h8v2H8zm0 4h8v2H8z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {t('tournament.regulationsPdf', 'Tournament Regulations (PDF)')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('tournament.clickToDownload', 'Click to view or download')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadRegulations}
                    isLoading={downloadingRegulations}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('tournament.viewRegulations', 'View PDF')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Private Tournament Invitation Code */}
          {tournament.isPrivate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('tournament.invitationCode', 'Private Tournament Invitation')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InvitationCodeManager
                  tournamentId={tournament.id}
                  tournamentName={tournament.name}
                  isPrivate={tournament.isPrivate}
                  initialCode={tournament.invitationCode}
                  initialExpiresAt={tournament.invitationCodeExpiresAt}
                />
              </CardContent>
            </Card>
          )}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t('registration.noRegistrations')}
                </h3>
                <p className="text-gray-500">{t('registration.noRegistrationsDesc')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrations.map((registration) => (
                      <tr key={registration.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
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
                                onClick={() => handleApproveRegistrationWithPayment(registration.id)}
                              >
                                {t('registration.approveWithPayment', 'Approve (Paid)')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveRegistrationWithoutPayment(registration.id)}
                              >
                                {t('registration.approveWithoutPayment', 'Approve (Unpaid)')}
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
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pot-Based Draw System</CardTitle>
              <CardDescription>
                Organize teams into pots based on strength and create balanced groups
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Groups & Draw Management
              </h3>
              <p className="text-gray-500 mb-6">
                Assign teams to pots (1-4) and execute a fair draw to create balanced groups
              </p>
              <Link href={`/dashboard/tournaments/${tournament.id}/pots`}>
                <Button variant="primary">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Pots & Draw
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
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
              <h1 className="text-2xl font-bold text-gray-900">
                {tournament.name}
              </h1>
              <Badge variant={getStatusBadge(tournament.status)}>
                {t(`tournament.status.${normalizeStatus(tournament.status)}`)}
              </Badge>
              {tournament.isPrivate && (
                <Badge variant="warning">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('tournament.private', 'Private')}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-1">
              {tournament.location}{tournament.country ? `, ${tournament.country}` : ''} • {formatDate(tournament.startDate)}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`${getTournamentPublicPath(tournament)}?preview=true`}>
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

        {tournament.status === 'PUBLISHED' && !tournament.isRegistrationClosed && (
          <Alert variant="info" className="flex items-center justify-between">
            <span>{t('tournament.registrationOpenMessage')}</span>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleStopRegistrations}
                isLoading={updatingRegistrations}
              >
                {t('tournament.stopRegistrations')}
              </Button>
            </div>
          </Alert>
        )}

        {tournament.status === 'PUBLISHED' && tournament.isRegistrationClosed && (
          <Alert variant="warning" className="flex items-center justify-between">
            <span>{t('tournament.registrationClosed')}</span>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab="overview" />
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingRegistrationId(null);
          setRejectionReason('');
        }}
        title={t('registration.rejectTitle')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('registration.rejectConfirm')}
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('registration.rejectReason')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('registration.rejectReasonPlaceholder')}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRejectModalOpen(false);
                setRejectingRegistrationId(null);
                setRejectionReason('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmRejectRegistration}
              isLoading={rejecting}
              disabled={!rejectionReason.trim()}
            >
              {t('registration.reject')}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
