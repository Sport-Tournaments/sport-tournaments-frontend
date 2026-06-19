'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Alert, Loading, Tabs, InvitationCodeManager, Modal, MatchManagement, EditGroupsModal } from '@/components/ui';
import { tournamentService, registrationService, fileService, groupService, potDrawService } from '@/services';
import { useInfiniteScroll } from '@/hooks';
import type { Tournament, Registration, TournamentStatus, RegistrationStatus, AgeGroup, RegistrationStatisticsByAgeGroup, AgeGroupRegistrationStatistics } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatCurrency, getTournamentPublicPath } from '@/utils/helpers';


export default function TournamentDetailPage() {
  const TOURNAMENT_REGISTRATIONS_PAGE_SIZE = 200;

  const { t } = useTranslation();
  const params = useParams();
  const searchParams = useSearchParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [statistics, setStatistics] = useState<RegistrationStatisticsByAgeGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingRegulations, setDownloadingRegulations] = useState(false);
  const [updatingRegistrations, setUpdatingRegistrations] = useState(false);
  const [updatingAgeGroupRegistrations, setUpdatingAgeGroupRegistrations] = useState<string | null>(null);
  const [groups, setGroups] = useState<any[]>([]);

  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRegistrationId, setRejectingRegistrationId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [removingRegistration, setRemovingRegistration] = useState<Registration | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeRequiresDrawReset, setRemoveRequiresDrawReset] = useState(false);
  const [removeImpactMessage, setRemoveImpactMessage] = useState<string | null>(null);

  // Edit Groups modal state
  const [editGroupsModalOpen, setEditGroupsModalOpen] = useState(false);
  const [editGroupsAgeGroupId, setEditGroupsAgeGroupId] = useState<string | undefined>(undefined);
  const [regenerateGroupsModalOpen, setRegenerateGroupsModalOpen] = useState(false);
  const [regenerateGroupsAgeGroupId, setRegenerateGroupsAgeGroupId] = useState<string | undefined>(undefined);
  const [regeneratingGroups, setRegeneratingGroups] = useState(false);

  // Infinite scroll for registrations
  const fetchRegistrationsPage = useCallback(async (page: number) => {
    const response = await registrationService.getTournamentRegistrations(
      params.id as string,
      { page, pageSize: TOURNAMENT_REGISTRATIONS_PAGE_SIZE },
    );
    return {
      items: response.data.items,
      hasMore: response.data.hasMore,
      totalPages: response.data.totalPages,
    };
  }, [params.id]);

  const {
    items: registrations,
    isLoading: registrationsLoading,
    isFetchingMore,
    hasMore: hasMoreRegistrations,
    sentinelRef,
    setItems: setRegistrations,
  } = useInfiniteScroll<Registration>({
    fetchData: fetchRegistrationsPage,
    dependencies: [params.id],
  });

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

      // Fetch registration statistics by age group
      try {
        const statsData = await registrationService.getRegistrationStatisticsByAgeGroup(params.id as string);
        if (statsData.data) {
          setStatistics(statsData.data);
        }
      } catch (statsErr) {
        console.error('Failed to load registration statistics:', statsErr);
        setStatistics(null);
      }

      // Fetch groups (populated after draw is executed)
      try {
        const groupsData = await groupService.getGroups(params.id as string);
        setGroups(groupsData.data || []);
      } catch {
        setGroups([]);
      }
    } catch (err: any) {
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const refreshTournamentData = async () => {
    await fetchData();
  };

  const updateRegistrationInList = (updatedRegistration: Registration) => {
    setRegistrations((previous) => previous.map((registration) => {
      if (registration.id !== updatedRegistration.id) {
        return registration;
      }
      return {
        ...registration,
        ...updatedRegistration,
      };
    }));
  };

  const normalizeStatus = (status: TournamentStatus) => status;

  const getStatusBadge = (status: TournamentStatus) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'DRAFT': 'warning',
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
      'PENDING_PAYMENT': 'info',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'WITHDRAWN': 'default',
    };
    return variants[status] || 'default';
  };

  const handleApproveRegistrationWithPayment = async (registrationId: string) => {
    try {
      const response = await registrationService.approveRegistrationWithPayment(registrationId);
      updateRegistrationInList(response.data);
      await refreshTournamentData();
    } catch (err: any) {
      setError('Failed to approve registration with payment');
    }
  };

  const handleApproveRegistrationWithoutPayment = async (registrationId: string) => {
    try {
      const response = await registrationService.approveRegistrationWithoutPayment(registrationId);
      updateRegistrationInList(response.data);
      await refreshTournamentData();
    } catch (err: any) {
      setError('Failed to approve registration without payment');
    }
  };

  const handleMarkAsPaid = async (registrationId: string) => {
    try {
      const response = await registrationService.markRegistrationAsPaid(registrationId);
      updateRegistrationInList(response.data);
      await refreshTournamentData();
    } catch (err: any) {
      setError('Failed to mark registration as paid');
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
      await refreshTournamentData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop registrations');
    } finally {
      setUpdatingRegistrations(false);
    }
  };

  const handleToggleAgeGroupRegistrations = async (ageGroupId: string, close: boolean) => {
    if (!tournament) return;
    setUpdatingAgeGroupRegistrations(ageGroupId);
    setError(null);
    try {
      await tournamentService.setAgeGroupRegistrationClosed(tournament.id, ageGroupId, close);
      await refreshTournamentData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update age group registration status');
    } finally {
      setUpdatingAgeGroupRegistrations(null);
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
      const response = await registrationService.rejectRegistration(rejectingRegistrationId, { rejectionReason: rejectionReason.trim() });
      updateRegistrationInList(response.data);
      setRejectModalOpen(false);
      setRejectingRegistrationId(null);
      setRejectionReason('');
      await refreshTournamentData();
    } catch (err: any) {
      setError('Failed to reject registration');
    } finally {
      setRejecting(false);
    }
  };

  const handleRemoveApprovedRegistration = (registration: Registration) => {
    setRemovingRegistration(registration);
    setRemoveRequiresDrawReset(false);
    setRemoveImpactMessage(null);
    setRemoveModalOpen(true);
  };

  const closeRemoveRegistrationModal = () => {
    if (removing) return;
    setRemoveModalOpen(false);
    setRemovingRegistration(null);
    setRemoveRequiresDrawReset(false);
    setRemoveImpactMessage(null);
  };

  const confirmRemoveApprovedRegistration = async () => {
    if (!removingRegistration || removingRegistration.status !== 'APPROVED') return;

    setRemoving(true);
    setError(null);
    try {
      await registrationService.deleteRegistration(removingRegistration.id, {
        resetDraw: removeRequiresDrawReset,
      });
      setRegistrations((previous) =>
        previous.filter((registration) => registration.id !== removingRegistration.id),
      );
      setRemoveModalOpen(false);
      setRemovingRegistration(null);
      setRemoveRequiresDrawReset(false);
      setRemoveImpactMessage(null);
      await refreshTournamentData();
    } catch (err: any) {
      const errorCode = err.response?.data?.error?.code;
      if (err.response?.status === 409 && errorCode === 'REGISTRATION_DRAW_RESET_REQUIRED') {
        setRemoveRequiresDrawReset(true);
        setRemoveImpactMessage(
          t(
            'registration.removeApprovedResetRequired',
            'This approved registration is already included in groups or matches. Removing it will reset the affected draw and matches, and you will need to regenerate them.',
          ),
        );
        return;
      }

      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          t('registration.removeApprovedError', 'Failed to remove registration'),
      );
    } finally {
      setRemoving(false);
    }
  };

  const handleRegenerateGroups = (ageGroupId?: string) => {
    setRegenerateGroupsAgeGroupId(ageGroupId);
    setRegenerateGroupsModalOpen(true);
  };

  const confirmRegenerateGroups = async () => {
    if (!tournament) return;

    const targetAgeGroup = regenerateGroupsAgeGroupId
      ? tournament.ageGroups?.find((ag) => ag.id === regenerateGroupsAgeGroupId)
      : undefined;
    const approvedRegistrations = getScopedRegistrations(regenerateGroupsAgeGroupId).filter(
      (reg) => reg.status === 'APPROVED',
    );
    const teamCount = approvedRegistrations.length;
    const configuredGroupCount =
      targetAgeGroup?.groupsCount ||
      (targetAgeGroup?.teamsPerGroup
        ? Math.ceil(teamCount / targetAgeGroup.teamsPerGroup)
        : 2);
    const numberOfGroups = Math.max(1, Math.min(configuredGroupCount, teamCount || configuredGroupCount));

    setRegeneratingGroups(true);
    setError(null);
    try {
      await groupService.resetDraw(tournament.id, regenerateGroupsAgeGroupId);
      await potDrawService.clearPotAssignments(tournament.id, regenerateGroupsAgeGroupId);

      if (teamCount < 2) {
        throw new Error('At least 2 approved teams are required to create manual groups.');
      }

      const teamsPerGroup = Array.from({ length: numberOfGroups }, (_, index) => ({
        groupLetter: String.fromCharCode(65 + index),
        teamCount: Math.floor(teamCount / numberOfGroups) + (index < teamCount % numberOfGroups ? 1 : 0),
      }));

      await groupService.configureGroups(tournament.id, {
        numberOfGroups,
        ageGroupId: regenerateGroupsAgeGroupId,
        teamsPerGroup,
      });

      setRegenerateGroupsModalOpen(false);
      setEditGroupsAgeGroupId(regenerateGroupsAgeGroupId);
      await fetchData();
      setEditGroupsModalOpen(true);
    } catch (err: any) {
      console.error('Failed to regenerate groups:', err);
      setError(err.response?.data?.message || err.message || 'Failed to regenerate groups');
    } finally {
      setRegeneratingGroups(false);
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
  const registeredTeamsDisplay = statistics?.overall?.approved ?? tournament.registeredTeams ?? registrations.length ?? 0;

  const inferRegistrationAgeGroupId = (registration: Registration): string | undefined => {
    if (registration.ageGroupId) return registration.ageGroupId;
    if (!tournament.ageGroups || tournament.ageGroups.length === 0) return undefined;

    const team = registration.team as (Registration['team'] & { birthyear?: number; ageCategory?: string }) | undefined;
    if (!team) return undefined;

    if (typeof team.birthyear === 'number') {
      const byBirthYear = tournament.ageGroups.find((ageGroup) => ageGroup.birthYear === team.birthyear);
      if (byBirthYear?.id) return byBirthYear.id;
    }

    return undefined;
  };

  const getScopedRegistrations = (ageGroupId?: string) => {
    if (!ageGroupId) return registrations;
    return registrations.filter(
      (reg) => inferRegistrationAgeGroupId(reg) === ageGroupId,
    );
  };

  const registrationToTeamDetail = (reg: Registration) => ({
    id: reg.id,
    ageGroupId: inferRegistrationAgeGroupId(reg),
    team: (reg as any).team,
    club: (reg as any).club,
    coachName: (reg as any).coachName,
  });

  const getScopedGroups = (ageGroupId?: string) => {
    if (!ageGroupId) return groups;
    return groups.filter((g) => {
      if (g.ageGroupId) return g.ageGroupId === ageGroupId;
      const firstTeam = g.teamDetails?.[0];
      return firstTeam ? firstTeam.ageGroupId === ageGroupId : false;
    });
  };

  const sortGroupsForDisplay = (input: any[]) =>
    [...input].sort((a, b) => {
      const aOrder = typeof a.groupOrder === 'number' ? a.groupOrder : Number.MAX_SAFE_INTEGER;
      const bOrder = typeof b.groupOrder === 'number' ? b.groupOrder : Number.MAX_SAFE_INTEGER;
      const byOrder = aOrder - bOrder;
      return byOrder !== 0 ? byOrder : String(a.groupLetter).localeCompare(String(b.groupLetter));
    });

  const statsByAgeGroupId = new Map(
    (statistics?.byAgeGroup || []).map((stat) => [stat.ageGroupId, stat])
  );

  const getAgeGroupStats = (ageGroupId?: string) =>
    ageGroupId ? statsByAgeGroupId.get(ageGroupId) : undefined;

  const getPendingCount = (
    scopedCount = 0,
    statPending = 0,
    statPendingPayment = 0,
  ) => statPending + statPendingPayment || scopedCount;

  const getAgeGroupLabel = (ageGroup: AgeGroup) => {
    if (ageGroup.displayLabel) return ageGroup.displayLabel;
    if (ageGroup.birthYear) return `${t('tournament.birthYear', 'Birth Year')} ${ageGroup.birthYear}`;
    return t('tournament.ageCategory.label', 'Age Category');
  };

  const getAgeGroupMaxTeams = (ageGroup: AgeGroup) => (
    ageGroup.teamCount
      ?? ageGroup.maxTeams
      ?? (ageGroup.teamsPerGroup && ageGroup.groupsCount
        ? ageGroup.teamsPerGroup * ageGroup.groupsCount
        : 0)
  );

  const renderRegistrationsTable = (items: Registration[]) => (
    <div className="space-y-2 md:overflow-x-auto">
      <div className="space-y-2 md:hidden">
        {items.map((registration) => (
          <div key={registration.id} className="rounded-lg border border-gray-200 bg-white p-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium text-gray-900">
                  {registration.team?.name || 'Not specified'}
                </div>
                <div className="truncate text-sm text-gray-500">
                  {registration.club?.name || '-'}
                </div>
              </div>
              <Badge variant={getRegistrationStatusBadge(registration.status)}>
                {t(`registration.status.${registration.status}`)}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {formatDateTime(registration.createdAt)}
            </div>
            {(registration.coachName || registration.team?.coach) && (
              <div className="mt-1 text-xs text-gray-500">
                Coach: {registration.coachName || registration.team?.coach}
                {(registration.coachPhone || registration.team?.coachPhone) && (
                  <span className="ml-1 text-gray-400">
                    · {registration.coachPhone || registration.team?.coachPhone}
                  </span>
                )}
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5 border-t border-gray-100 pt-2">
              {registration.status === 'PENDING' && (
                <>
                  <Button size="sm" variant="paid" onClick={() => handleApproveRegistrationWithPayment(registration.id)}>
                    {t('registration.approveWithPayment', 'Approve (Paid)')}
                  </Button>
                  <Button size="sm" variant="unpaid" onClick={() => handleApproveRegistrationWithoutPayment(registration.id)}>
                    {t('registration.approveWithoutPayment', 'Approve (Unpaid)')}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleRejectRegistration(registration.id)}>
                    {t('registration.reject')}
                  </Button>
                </>
              )}
              {registration.status === 'PENDING_PAYMENT' && (
                <>
                  {registration.priceAmount != null && Number(registration.priceAmount) > 0 && (
                    <span className="rounded bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700">
                      {registration.priceCurrency || 'EUR'} {Number(registration.priceAmount).toFixed(2)}
                    </span>
                  )}
                  <Button size="sm" variant="paid" onClick={() => handleMarkAsPaid(registration.id)}>
                    {t('registration.markAsPaid', 'Mark as Paid')}
                  </Button>
                </>
              )}
              {registration.status === 'APPROVED' && (
                <Button size="sm" variant="danger" onClick={() => handleRemoveApprovedRegistration(registration)}>
                  {t('registration.removeApproved', 'Remove')}
                </Button>
              )}
              <Link href={`/dashboard/registrations/${registration.id}`}>
                <Button size="sm" variant="view">{t('common.view')}</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
      <table className="hidden min-w-full divide-y divide-gray-200 md:table">
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
          {items.map((registration) => (
            <tr key={registration.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  Team: {registration.team?.name || 'Not specified'}
                </div>
                <div className="text-sm text-gray-500">
                  Club: {registration.club?.name || '-'}
                </div>
                {(registration.coachName || registration.team?.coach) && (
                  <div className="text-sm text-gray-500">
                    Coach: {registration.coachName || registration.team?.coach}
                    {(registration.coachPhone || registration.team?.coachPhone) && (
                      <span className="ml-1 text-gray-400">
                        · {registration.coachPhone || registration.team?.coachPhone}
                      </span>
                    )}
                  </div>
                )}
                {registration.emergencyContact && (
                  <div className="text-sm text-gray-400">
                    Contact: {registration.emergencyContact}
                  </div>
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
                      variant="paid"
                      onClick={() => handleApproveRegistrationWithPayment(registration.id)}
                    >
                      {t('registration.approveWithPayment', 'Approve (Paid)')}
                    </Button>
                    <Button
                      size="sm"
                      variant="unpaid"
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
                {registration.status === 'PENDING_PAYMENT' && (
                  <>
                    {registration.priceAmount != null && Number(registration.priceAmount) > 0 && (
                      <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        {registration.priceCurrency || 'EUR'} {Number(registration.priceAmount).toFixed(2)}
                      </span>
                    )}
                    <Button
                      size="sm"
                      variant="paid"
                      onClick={() => handleMarkAsPaid(registration.id)}
                    >
                      {t('registration.markAsPaid', 'Mark as Paid')}
                    </Button>
                  </>
                )}
                {registration.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRemoveApprovedRegistration(registration)}
                  >
                    {t('registration.removeApproved', 'Remove')}
                  </Button>
                )}
                <Link href={`/dashboard/registrations/${registration.id}`}>
                  <Button size="sm" variant="view">{t('common.view')}</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const buildOverviewTab = (ageGroup?: AgeGroup) => {
    const ageGroupId = ageGroup?.id;
    const scopedRegistrations = getScopedRegistrations(ageGroupId);

    const maxTeams = ageGroup
      ? getAgeGroupMaxTeams(ageGroup)
      : maxTeamsDisplay;

    const ageGroupStats = getAgeGroupStats(ageGroupId);
    const totalApplied = ageGroupId
      ? (ageGroupStats?.total ?? scopedRegistrations.length)
      : (statistics?.overall?.total ?? scopedRegistrations.length);
    const approvedCount = ageGroupId
      ? (ageGroupStats?.approved ?? scopedRegistrations.filter((reg) => reg.status === 'APPROVED').length)
      : (statistics?.overall?.approved ?? scopedRegistrations.filter((reg) => reg.status === 'APPROVED').length);
    const ageGroupPendingPaymentCount = (ageGroupStats as { pendingPayment?: number } | undefined)?.pendingPayment ?? 0;
    const overallPendingPaymentCount = (
      statistics?.overall as ({ pendingPayment?: number } | undefined)
    )?.pendingPayment ?? 0;
    const pendingCount = ageGroupId
      ? getPendingCount(
          scopedRegistrations.filter(
            (reg) =>
              reg.status === 'PENDING' ||
              reg.status === 'PENDING_PAYMENT',
          ).length,
          ageGroupStats?.pending,
          ageGroupPendingPaymentCount,
        )
      : getPendingCount(
          scopedRegistrations.filter(
            (reg) =>
              reg.status === 'PENDING' ||
              reg.status === 'PENDING_PAYMENT',
          ).length,
          statistics?.overall?.pending,
          overallPendingPaymentCount,
        );

    const registeredTeams = ageGroup
      ? approvedCount
      : (statistics?.overall?.approved ?? registeredTeamsDisplay);

    const entryFee = ageGroup?.participationFee ?? tournament.entryFee ?? 0;
    const prizeMoney = tournament.prizeMoney || 0;

    return (
      <div className="space-y-6">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('tournament.info')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">{t('registration.applied', 'Applied')}</p>
                <p className="font-medium">{totalApplied}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('registration.approved', 'Approved')}</p>
                <p className="font-medium">{approvedCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('registration.pending')}</p>
                <p className="font-medium">{pendingCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('common.teams')}</p>
                <p className="font-medium">{registeredTeams} / {maxTeams}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('tournament.entryFee')}</p>
                <p className="font-medium">{formatCurrency(entryFee)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('tournament.prizeMoney')}</p>
                <p className="font-medium">{formatCurrency(prizeMoney)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('tournament.startDate')}</p>
                <p className="font-medium">
                  {ageGroup?.startDate ? formatDate(ageGroup.startDate) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('tournament.registrationDeadline')}</p>
                <p className="font-medium">
                  {ageGroup?.registrationEndDate
                    ? formatDate(ageGroup.registrationEndDate)
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('tournament.location')}</p>
                <p className="font-medium">
                  {ageGroup?.locationAddress || tournament.location}
                </p>
                {(tournament as any).venue && <p className="text-gray-500">{(tournament as any).venue}</p>}
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('common.city')}, {t('common.country')}</p>
                <p className="font-medium">{tournament.location}, {tournament.country || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('tournament.level.label')}</p>
                <p className="font-medium">
                  {ageGroup?.level
                    ? t(`tournament.level.${ageGroup.level}`)
                    : tournament.level
                      ? t(`tournament.level.${tournament.level}`)
                      : '\u2014'}
                </p>
              </div>
            </div>
            {ageGroup?.gameSystem && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('tournament.gameSystem', 'Game System')}</p>
                <p className="text-gray-700 whitespace-pre-wrap">{ageGroup.gameSystem}</p>
              </div>
            )}
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
                  variant="view"
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
    );
  };

  const buildTabsForAgeGroup = (ageGroup?: AgeGroup) => {
    const ageGroupId = ageGroup?.id;
    const scopedRegistrations = getScopedRegistrations(ageGroupId);

    const ageGroupStats = getAgeGroupStats(ageGroupId);
    const totalApplied = ageGroupStats?.total
      ?? (ageGroupId
        ? scopedRegistrations.length
        : statistics?.overall?.total ?? scopedRegistrations.length);

    return [
      {
        id: 'overview',
        label: t('tournament.overview'),
        content: buildOverviewTab(ageGroup),
      },
      {
        id: 'registrations',
        label: `${t('registration.title')} (${totalApplied})`,
        content: (
          <Card>
            <CardContent className="p-0">
              {registrationsLoading && scopedRegistrations.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loading size="md" />
                </div>
              ) : scopedRegistrations.length === 0 ? (
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
                <>
                  {renderRegistrationsTable(scopedRegistrations)}
                  {/* Infinite scroll sentinel */}
                  {hasMoreRegistrations && (
                    <div ref={sentinelRef} className="flex items-center justify-center py-4">
                      {isFetchingMore && <Loading size="sm" />}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ),
      },
      {
        id: 'groups',
        label: t('tournament.groups'),
        content: (() => {
          // Formats without a group phase should not show the pot/manual-groups UI.
          const format = ageGroup?.format;
          const grouplessFormatLabel =
            format === 'SINGLE_ELIMINATION'
              ? 'Single Elimination'
              : format === 'DOUBLE_ELIMINATION'
                ? 'Double Elimination'
                : format === 'LEAGUE'
                  ? 'League'
                  : format === 'ROUND_ROBIN'
                    ? 'Round Robin'
                    : undefined;
          if (grouplessFormatLabel) {
            return (
              <Card>
                <CardContent className="text-center py-12">
                  <svg className="w-14 h-14 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-base font-semibold text-gray-700 mb-2">
                    Groups not available for this format
                  </h3>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    This age group uses{' '}
                    <span className="font-medium text-gray-700">
                      {grouplessFormatLabel}
                    </span>
                    . Matches are generated and managed in the{' '}
                    <span className="font-medium text-gray-700">Matches</span> section.
                  </p>
                </CardContent>
              </Card>
            );
          }

          // Filter by the persisted group.ageGroupId first, and only fall back to
          // teamDetails for legacy data that predates the ageGroupId column.
          const scopedGroups = getScopedGroups(ageGroupId);
          const canRegenerateGroups = ageGroup?.format === 'GROUPS_PLUS_KNOCKOUT';

          if (scopedGroups.length > 0) {
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Draw Results</h2>
                    <p className="text-sm text-gray-500">
                      {scopedGroups.length} group{scopedGroups.length !== 1 ? 's' : ''} | {scopedGroups.reduce((sum, g) => sum + (g.teamDetails?.length ?? g.teams?.length ?? 0), 0)} teams assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/tournaments/${tournament.id}/pots${ageGroupId ? `?ageGroupId=${ageGroupId}` : ''}`} aria-disabled tabIndex={-1} className="pointer-events-none">
                      <Button variant="outline" size="sm" disabled>
                        <Users className="w-4 h-4 mr-2" />
                        Manage Pots & Draw
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setEditGroupsAgeGroupId(ageGroupId);
                        setEditGroupsModalOpen(true);
                      }}
                    >
                      Edit Groups
                    </Button>
                    {canRegenerateGroups && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRegenerateGroups(ageGroupId)}
                      >
                        Start From Zero
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortGroupsForDisplay(scopedGroups).map((group) => {
                    const teamDetails: any[] = group.teamDetails || [];
                    return (
                      <Card key={group.id} className="overflow-hidden">
                        <CardHeader className="py-2 px-3 bg-gray-50 border-b">
                          <CardTitle className="text-base">Group {group.groupLetter}</CardTitle>
                          <p className="text-xs text-gray-500">{teamDetails.length} team{teamDetails.length !== 1 ? 's' : ''}</p>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ul className="divide-y divide-gray-100 w-full">
                            {teamDetails.map((reg: any, idx: number) => (
                              <li key={reg?.id ?? idx} className="flex items-center gap-2 py-1.5 w-full">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
                                  {reg?.team?.name ?? reg?.club?.name ?? reg?.coachName ?? `Team ${idx + 1}`}
                                </span>
                              </li>
                            ))}
                            {teamDetails.length === 0 && (
                              <li className="px-4 py-3 text-sm text-gray-400 italic">No teams assigned</li>
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pot-Based Draw System</CardTitle>
                  <CardDescription>
                    Configure empty groups, assign teams manually, then save to regenerate matches automatically
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
                    {ageGroup ? `${getAgeGroupLabel(ageGroup)} • ` : ''}Start from zero, create empty groups, then assign teams manually
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => handleRegenerateGroups(ageGroupId)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Manual Groups
                  </Button>
                </CardContent>
              </Card>
            </div>
          );
        })()
      },
      {
        id: 'matches',
        label: t('tournament.matches'),
        content: (() => {
          // Formats that require groups to be drawn before matches can be generated
          const format = ageGroup?.format;
          const needsGroups = format === 'GROUPS_PLUS_KNOCKOUT';
          const scopedGroups = getScopedGroups(ageGroupId);
          const groupsNotGenerated = needsGroups && scopedGroups.length === 0;

          return (
            <Card>
              <CardContent className="p-0 sm:p-6">
                {groupsNotGenerated && (
                  <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Groups have not been generated yet</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                          You must run the pot draw to create groups before matches can be generated for this format.
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/tournaments/${tournament.id}/pots${ageGroupId ? `?ageGroupId=${ageGroupId}` : ''}`} className="shrink-0">
                      <Button variant="primary" size="sm">
                        <Users className="w-4 h-4 mr-2" />
                        Go to Pot Draw
                      </Button>
                    </Link>
                  </div>
                )}
                {!groupsNotGenerated && (
                  <MatchManagement
                    tournamentId={tournament.id}
                    isOrganizer={true}
                    ageGroupId={ageGroupId}
                    isRegistrationOpen={!ageGroup?.isRegistrationClosed}
                    drawCompleted={ageGroup?.drawCompleted}
                    matchPeriodType={ageGroup?.matchPeriodType}
                    halfDurationMinutes={ageGroup?.halfDurationMinutes}
                    halfTimePauseMinutes={ageGroup?.halfTimePauseMinutes}
                    pauseBetweenMatchesMinutes={ageGroup?.pauseBetweenMatchesMinutes}
                    fieldsCount={ageGroup?.fieldsCount}
                    ageGroupFormat={ageGroup?.format}
                  />
                )}
              </CardContent>
            </Card>
          );
        })(),
      },
    ];
  };

  const tabs = buildTabsForAgeGroup();

  const getPendingCountForAgeGroup = (ageGroupId?: string) => {
    const ageGroupStats = getAgeGroupStats(ageGroupId);
    if (ageGroupStats) {
      const pendingPaymentCount = (ageGroupStats as { pendingPayment?: number } | undefined)?.pendingPayment ?? 0;
      return (ageGroupStats.pending || 0) + pendingPaymentCount;
    }
    if (!ageGroupId) {
      const overallPendingPaymentCount = (
        statistics?.overall as ({ pendingPayment?: number } | undefined)
      )?.pendingPayment ?? 0;
      const pendingFromStats = statistics?.overall
        ? (statistics.overall.pending || 0) + overallPendingPaymentCount
        : undefined;
      if (pendingFromStats != null) {
        return pendingFromStats;
      }

      return getScopedRegistrations().filter(
        (reg) =>
          reg.status === 'PENDING' || reg.status === 'PENDING_PAYMENT',
      ).length;
    }
    return getScopedRegistrations(ageGroupId).filter(
      (reg) => reg.status === 'PENDING' || reg.status === 'PENDING_PAYMENT',
    ).length;
  };

  const getPendingBadgeCount = (ageGroupId?: string) => {
    const pendingCount = getPendingCountForAgeGroup(ageGroupId);
    return pendingCount > 0 ? pendingCount : undefined;
  };

  const ageGroupTabs = tournament.ageGroups && tournament.ageGroups.length > 0
    ? tournament.ageGroups.map((ageGroup, index) => ({
        id: ageGroup.id ?? `age-group-${index}`,
        label: getAgeGroupLabel(ageGroup),
        count: getPendingBadgeCount(ageGroup.id),
        content: (
          <div className="space-y-4">
            {tournament.status === 'PUBLISHED' && ageGroup.id && !ageGroup.isRegistrationClosed && (
              <Alert variant="info" className="flex items-center justify-between">
                <div className="flex w-full items-center gap-3">
                  <span className="min-w-0">Registrations are open for {getAgeGroupLabel(ageGroup)}.</span>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleToggleAgeGroupRegistrations(ageGroup.id!, true)}
                    isLoading={updatingAgeGroupRegistrations === ageGroup.id}
                  >
                    Stop Registrations
                  </Button>
                </div>
              </Alert>
            )}
            {tournament.status === 'PUBLISHED' && ageGroup.id && ageGroup.isRegistrationClosed && (
              <Alert variant="warning" className="flex items-center justify-between">
                <div className="flex w-full items-center gap-3">
                  <span className="min-w-0">Registrations are closed for {getAgeGroupLabel(ageGroup)}.</span>
                  <Button
                    variant="success"
                    size="sm"
                    className="ml-auto"
                    onClick={() => handleToggleAgeGroupRegistrations(ageGroup.id!, false)}
                    isLoading={updatingAgeGroupRegistrations === ageGroup.id}
                  >
                    Open Registrations
                  </Button>
                </div>
              </Alert>
            )}
            <Tabs
              tabs={buildTabsForAgeGroup(ageGroup)}
              defaultTab={searchParams.get('tab') ?? 'overview'}
              variant="pills-gray"
              queryParam="tab"
            />
          </div>
        ),
      }))
    : tabs;

  return (
    <DashboardLayout>
      <div className="min-w-0 space-y-4 overflow-x-hidden sm:space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex min-w-0 flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="min-w-0 break-words text-xl font-bold text-gray-900 sm:text-2xl">
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
            <p className="mt-1 break-words text-gray-600">
              {tournament.location}{tournament.country ? `, ${tournament.country}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`${getTournamentPublicPath(tournament)}?preview=true`}>
              <Button variant="view">
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

        {tournament.status === 'PUBLISHED' && !tournament.isRegistrationClosed && (!tournament.ageGroups || tournament.ageGroups.length === 0) && (
          <Alert variant="info" className="flex items-center justify-between">
            <div className="flex w-full items-center gap-3">
              <span className="min-w-0">{t('tournament.registrationOpenMessage')}</span>
              <Button
                variant="danger"
                size="sm"
                className="ml-auto"
                onClick={handleStopRegistrations}
                isLoading={updatingRegistrations}
              >
                {t('tournament.stopRegistrations')}
              </Button>
            </div>
          </Alert>
        )}

        {tournament.status === 'PUBLISHED' && tournament.isRegistrationClosed && (!tournament.ageGroups || tournament.ageGroups.length === 0) && (
          <Alert variant="warning" className="flex items-center justify-between">
            <span>{t('tournament.registrationClosed')}</span>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          tabs={ageGroupTabs}
          defaultTab={
            // When no age groups, tabs ARE the inner (overview/groups/matches) tabs — respect ?tab= param
            (!tournament.ageGroups || tournament.ageGroups.length === 0)
              ? (searchParams.get('tab') ?? ageGroupTabs[0]?.id)
              : (searchParams.get('ageGroup') ?? ageGroupTabs[0]?.id)
          }
          queryParam={
            (!tournament.ageGroups || tournament.ageGroups.length === 0)
              ? 'tab'
              : 'ageGroup'
          }
        />
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

      <Modal
        isOpen={removeModalOpen}
        onClose={closeRemoveRegistrationModal}
        title={t('registration.removeApprovedTitle', 'Remove Approved Registration')}
      >
        <div className="space-y-4">
          {removeRequiresDrawReset ? (
            <Alert variant="warning">
              {removeImpactMessage ||
                t(
                  'registration.removeApprovedResetRequired',
                  'This approved registration is already included in groups or matches. Removing it will reset the affected draw and matches, and you will need to regenerate them.',
                )}
            </Alert>
          ) : (
            <p className="text-gray-600">
              {t(
                'registration.removeApprovedConfirm',
                'Are you sure you want to remove this approved registration? This action cannot be undone.',
              )}
            </p>
          )}
          {removingRegistration && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-medium text-gray-900">
                {removingRegistration.team?.name || t('common.team', 'Team')}
              </p>
              <p>{removingRegistration.club?.name || '-'}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={closeRemoveRegistrationModal}
              disabled={removing}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmRemoveApprovedRegistration}
              isLoading={removing}
            >
              {removeRequiresDrawReset
                ? t('registration.removeAndResetDraw', 'Remove and reset draw')
                : t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={regenerateGroupsModalOpen}
        onClose={() => {
          if (!regeneratingGroups) {
            setRegenerateGroupsModalOpen(false);
            setRegenerateGroupsAgeGroupId(undefined);
          }
        }}
        title="Start Manual Groups From Zero"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will delete the current groups, clear existing pot assignments, and create empty groups for this age group.
          </p>
          <p className="text-gray-600">
            After confirmation, the manual group editor opens. Assign all teams once and save; matches are regenerated automatically from the saved groups.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setRegenerateGroupsModalOpen(false);
                setRegenerateGroupsAgeGroupId(undefined);
              }}
              disabled={regeneratingGroups}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmRegenerateGroups}
              isLoading={regeneratingGroups}
            >
              Start From Zero
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Groups Modal */}
        {tournament && (
        <EditGroupsModal
          isOpen={editGroupsModalOpen}
          onClose={() => setEditGroupsModalOpen(false)}
          onSuccess={() => {
            setEditGroupsModalOpen(false);
            refreshTournamentData();
          }}
          tournamentId={tournament.id}
          groups={getScopedGroups(editGroupsAgeGroupId)}
          availableTeams={getScopedRegistrations(editGroupsAgeGroupId)
            .filter((reg) => reg.status === 'APPROVED')
            .map(registrationToTeamDetail)}
        />
      )}
    </DashboardLayout>
  );
}
