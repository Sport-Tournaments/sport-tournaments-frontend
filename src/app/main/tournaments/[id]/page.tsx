'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Tabs, Loading, Alert, Modal } from '@/components/ui';
import { tournamentService, registrationService, clubService, fileService } from '@/services';
import { Tournament, TournamentStatus, Registration, Club } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { useAuthStore } from '@/store';
import { RegistrationWizard, RegistrationStatus } from '@/components/registration';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [downloadingRegulations, setDownloadingRegulations] = useState(false);
  const [hasValidInvite, setHasValidInvite] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);

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
        // Open the PDF in a new tab
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
    if (id) {
      fetchTournament();
    }
  }, [id]);

  // Validate invitation code for private tournaments
  useEffect(() => {
    const validateInviteCode = async () => {
      if (!tournament || !tournament.isPrivate || !inviteCode) {
        setHasValidInvite(false);
        return;
      }

      setValidatingInvite(true);
      try {
        const response = await tournamentService.validateInvitationCode(inviteCode);
        if (response.success && response.data?.tournament?.id === tournament.id) {
          setHasValidInvite(true);
        } else {
          setHasValidInvite(false);
        }
      } catch (err) {
        console.error('Invalid invitation code:', err);
        setHasValidInvite(false);
      } finally {
        setValidatingInvite(false);
      }
    };

    validateInviteCode();
  }, [tournament?.id, tournament?.isPrivate, inviteCode]);

  const fetchTournament = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tournamentService.getTournamentById(id as string);
      setTournament(response.data);

      // Fetch registrations for this tournament
      try {
        const regsResponse = await registrationService.getTournamentRegistrations(id as string, {
          status: 'APPROVED' as any,
        });
        const items = regsResponse?.data?.items;
        setRegistrations(Array.isArray(items) ? items : []);
      } catch (regErr: any) {
        // Registrations might require auth, but tournament should still display
        console.warn('Failed to fetch registrations (may require auth):', regErr);
        setRegistrations([]); // Always set to empty array on error
        if (regErr.response?.status !== 401 && regErr.response?.status !== 403) {
          throw regErr;
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch tournament:', err);
      if (err.response?.status === 403) {
        setError('You need to log in to view tournament details.');
      } else if (err.response?.status === 401) {
        setError('You need to log in to view tournament details.');
      } else if (err.response?.status === 404) {
        setError('Tournament not found.');
      } else {
        setError(err.response?.data?.message || 'Failed to load tournament details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    // Open the registration wizard for the full flow
    setShowRegistrationWizard(true);
  };

  const handleRegistrationSuccess = (registration: Registration) => {
    fetchTournament();
    setShowRegistrationWizard(false);
  };

  const handleSimpleRegister = async () => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    // Fetch user's clubs if not already loaded
    if (userClubs.length === 0) {
      setLoadingClubs(true);
      try {
        const response = await clubService.getMyClubs();
        const clubs = response.data || [];
        setUserClubs(clubs);
        
        if (clubs.length === 0) {
          setError(t('tournament.noClubsToRegister', 'You need to be part of a club to register for tournaments.'));
          return;
        } else if (clubs.length === 1) {
          // Auto-select if user has only one club
          setSelectedClubId(clubs[0].id);
          await performRegistration(clubs[0].id);
        } else {
          // Show modal for club selection
          setShowClubModal(true);
        }
      } catch (err) {
        console.error('Failed to fetch clubs:', err);
        setError(t('tournament.fetchClubsError', 'Failed to load your clubs. Please try again.'));
      } finally {
        setLoadingClubs(false);
      }
      return;
    }

    // If clubs already loaded
    if (userClubs.length === 1) {
      await performRegistration(userClubs[0].id);
    } else {
      setShowClubModal(true);
    }
  };

  const performRegistration = async (clubId: string) => {
    setRegistering(true);
    setShowClubModal(false);
    setError(null);
    try {
      await registrationService.registerForTournament(id as string, { clubId });
      fetchTournament();
    } catch (err: any) {
      console.error('Registration failed:', err);
      
      // Handle specific error codes
      if (err.response?.status === 409) {
        setError(t('club.alreadyRegistered', 'You are already registered for this tournament.'));
      } else if (err.response?.status === 400) {
        setError(err.response?.data?.message || t('tournament.registrationFailed', 'Registration failed. Please try again.'));
      } else if (err.response?.status === 403) {
        setError(t('tournament.registrationNotAllowed', 'You are not allowed to register for this tournament.'));
      } else {
        setError(err.response?.data?.message || t('tournament.registrationFailed', 'Registration failed. Please try again.'));
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleClubSelect = async () => {
    if (!selectedClubId) {
      setError(t('tournament.selectClub', 'Please select a club to register with.'));
      return;
    }
    await performRegistration(selectedClubId);
  };

  const getStatusBadge = (status: TournamentStatus) => {
    const variants: Partial<Record<TournamentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'>> = {
      'DRAFT': 'default',
      'PUBLISHED': 'info',
      'ONGOING': 'info',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loading size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (error || !tournament) {
    const isAuthError = error?.includes('log in');
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="error">{error || 'Tournament not found'}</Alert>
          <div className="flex gap-4 mt-4">
            <Link href="/main/tournaments">
              <Button variant="ghost">
                ← {t('common.back')}
              </Button>
            </Link>
            {isAuthError && !isAuthenticated && (
              <Link href="/auth/login">
                <Button variant="primary">
                  {t('auth.login', 'Log In')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </MainLayout>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: t('tournament.tabs.overview'),
      content: (
        <div className="space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{tournament.description}</p>
            </CardContent>
          </Card>

          {/* Rules */}
          {tournament.rules && (
            <Card>
              <CardHeader>
                <CardTitle>{t('tournament.rules')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{tournament.rules}</p>
              </CardContent>
            </Card>
          )}

          {/* Regulations Document Download */}
          {tournament.regulationsDocument && (
            <Card>
              <CardHeader>
                <CardTitle>{t('tournament.regulationsDocument', 'Regulations Document')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
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

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.schedule')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.registrationStart')}</span>
                  <span className="font-medium">{tournament.registrationStartDate ? formatDateTime(tournament.registrationStartDate) : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.registrationEnd')}</span>
                  <span className="font-medium">{tournament.registrationEndDate ? formatDateTime(tournament.registrationEndDate) : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.tournamentStart')}</span>
                  <span className="font-medium">{formatDateTime(tournament.startDate)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.tournamentEnd')}</span>
                  <span className="font-medium">{formatDateTime(tournament.endDate)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'teams',
      label: `${t('tournament.tabs.teams')} (${registrations.length})`,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>{t('tournament.registeredTeams')}</CardTitle>
          </CardHeader>
          <CardContent>
            {registrations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('tournament.noTeamsYet')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      {registration.club?.logo ? (
                        <img
                          src={registration.club.logo}
                          alt={registration.club.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary font-semibold">
                          {registration.club?.name?.charAt(0) || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{registration.club?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(registration.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'groups',
      label: t('tournament.tabs.groups'),
      content: (
        <Card>
          <CardHeader>
            <CardTitle>{t('tournament.groups')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              {tournament.status === 'PUBLISHED'
                ? t('tournament.groupsNotDrawn')
                : t('tournament.noGroups')}
            </p>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'matches',
      label: t('tournament.tabs.matches'),
      content: (
        <Card>
          <CardHeader>
            <CardTitle>{t('tournament.matches')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">{t('tournament.noMatches')}</p>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Link href="/main/tournaments">
          <Button variant="ghost" className="mb-4">
            ← {t('common.back')}
          </Button>
        </Link>

        {/* Header */}
        <div className="relative">
          {tournament.bannerImage && (
            <div className="relative h-64 rounded-xl overflow-hidden mb-6">
              <img
                src={tournament.bannerImage}
                alt={tournament.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {tournament.name}
                </h1>
                <Badge variant={getStatusBadge(tournament.status)}>
                  {t(`tournament.status.${tournament.status}`)}
                </Badge>
              </div>

              {/* Quick info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {tournament.location || t('common.online')}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {registrations.length} / {tournament.maxTeams} {t('common.teams')}
                </div>
              </div>
            </div>

            {/* Registration card */}
            <Card className="lg:w-80 flex-shrink-0">
              <CardContent className="p-6">
                {/* Private tournament badge */}
                {tournament.isPrivate && (
                  <div className="flex items-center gap-2 mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-700">
                      {t('tournament.privateTournament', 'Private Tournament')}
                    </span>
                  </div>
                )}

                {tournament.registrationFee && tournament.registrationFee > 0 && (
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-primary">
                      €{tournament.registrationFee}
                    </span>
                    <span className="text-gray-500 ml-1">/ {t('common.team')}</span>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('tournament.spotsLeft')}</span>
                    <span className="font-medium">
                      {tournament.maxTeams - registrations.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('tournament.ageCategory.label')}</span>
                    <span className="font-medium">{tournament.ageCategory || 'Open'}</span>
                  </div>
                  {tournament.numberOfMatches && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('tournament.numberOfMatches')}</span>
                      <span className="font-medium">{tournament.numberOfMatches}</span>
                    </div>
                  )}
                  {/* <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('tournament.format.label')}</span>
                    <span className="font-medium">{tournament.format || 'Groups + Knockout'}</span>
                  </div> */}
                </div>

                {/* Age Categories */}
                {tournament.ageGroups && tournament.ageGroups.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {t('tournaments.ageGroups.title', 'Age Categories')}
                    </h4>
                    <div className="space-y-2">
                      {tournament.ageGroups.map((ag, index) => {
                        const currentYear = new Date().getFullYear();
                        const displayLabel = ag.displayLabel || `U${currentYear - ag.birthYear}`;
                        return (
                          <div key={ag.id || index} className="p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{displayLabel}</span>
                              {ag.gameSystem && (
                                <Badge variant="info">{ag.gameSystem}</Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                              <span>{t('tournaments.ageGroups.birthYear', 'Birth Year')}: {ag.birthYear}</span>
                              {ag.teamCount && <span>{t('tournaments.ageGroups.teamCount', 'Max Teams')}: {ag.teamCount}</span>}
                              {ag.startDate && <span>{t('tournaments.ageGroups.startDate', 'Start')}: {formatDate(ag.startDate)}</span>}
                              {ag.participationFee !== undefined && ag.participationFee !== null && (
                                <span>{t('tournaments.ageGroups.participationFee', 'Fee')}: €{ag.participationFee}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Registration button logic */}
                {tournament.status === 'PUBLISHED' ? (
                  tournament.isPrivate && !hasValidInvite ? (
                    // Private tournament without valid invite
                    <div className="space-y-3">
                      {validatingInvite ? (
                        <Button variant="secondary" fullWidth disabled isLoading>
                          {t('tournament.invitation.validating', 'Validating invite...')}
                        </Button>
                      ) : (
                        <>
                          <Button variant="secondary" fullWidth disabled>
                            {t('tournament.invitation.required', 'Invitation Required')}
                          </Button>
                          <p className="text-xs text-center text-gray-500">
                            {t('tournament.invitation.contactOrganizer', 'Contact the organizer to get an invitation link.')}
                          </p>
                          <Link href="/main/tournaments/join" className="block">
                            <Button variant="outline" fullWidth size="sm">
                              {t('tournament.invitation.haveCode', 'Have an invitation code?')}
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  ) : (
                    // Public tournament OR private with valid invite
                    <>
                      <Button
                        variant="primary"
                        fullWidth
                        onClick={handleRegister}
                        isLoading={registering || loadingClubs}
                      >
                        {t('tournament.register')}
                      </Button>
                      {hasValidInvite && (
                        <p className="text-xs text-center text-green-600 mt-2 flex items-center justify-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('tournament.invitation.validInvite', 'Valid invitation')}
                        </p>
                      )}
                    </>
                  )
                ) : (
                  <Button variant="secondary" fullWidth disabled>
                    {tournament.status === 'ONGOING' || tournament.status === 'COMPLETED'
                      ? t('tournament.registrationClosed')
                      : t('tournament.registrationNotOpen')}
                  </Button>
                )}

                {!isAuthenticated && tournament.status === 'PUBLISHED' && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {t('tournament.loginToRegister')}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <Tabs tabs={tabs} />
        </div>
      </div>

      {/* Club Selection Modal */}
      <Modal
        isOpen={showClubModal}
        onClose={() => setShowClubModal(false)}
        title={t('tournament.selectClubTitle', 'Select a Club')}
        description={t('tournament.selectClubDescription', 'Choose which club you want to register for this tournament.')}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowClubModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleClubSelect}
              isLoading={registering}
              disabled={!selectedClubId}
            >
              {t('tournament.register')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {userClubs.map((club) => (
            <label
              key={club.id}
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedClubId === club.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="club"
                value={club.id}
                checked={selectedClubId === club.id}
                onChange={(e) => setSelectedClubId(e.target.value)}
                className="w-4 h-4 text-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {club.name}
                </div>
                <div className="text-sm text-gray-500">
                  {club.city}, {club.country}
                </div>
              </div>
              {club.logo && (
                <img
                  src={club.logo}
                  alt={club.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
            </label>
          ))}
        </div>
      </Modal>

      {/* Registration Wizard Modal */}
      {tournament && (
        <RegistrationWizard
          tournament={tournament}
          isOpen={showRegistrationWizard}
          onClose={() => setShowRegistrationWizard(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </MainLayout>
  );
}
