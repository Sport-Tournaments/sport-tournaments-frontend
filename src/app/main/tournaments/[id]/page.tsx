'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Tabs, Loading, Alert, Modal, TournamentMap } from '@/components/ui';
import { tournamentService, registrationService, clubService, fileService } from '@/services';
import { Tournament, TournamentStatus, Registration, Club } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { useAuthStore } from '@/store';
import { RegistrationWizard } from '@/components/registration';

export default function TournamentDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();
  const isPreviewMode = searchParams.get('preview') === 'true';
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([]);
  const [loadingMyRegistrations, setLoadingMyRegistrations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [userClubs, setUserClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [showClubModal, setShowClubModal] = useState(false);
  const [showRegistrationWizard, setShowRegistrationWizard] = useState(false);
  const [wizardAgeGroupId, setWizardAgeGroupId] = useState<string | undefined>();
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [downloadingRegulations, setDownloadingRegulations] = useState(false);
  const [hasValidInvite, setHasValidInvite] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

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

  useEffect(() => {
    if (tournament?.id && isAuthenticated) {
      fetchMyRegistrations(tournament.id);
    } else {
      setMyRegistrations([]);
    }
  }, [tournament?.id, isAuthenticated]);

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
    setAuthRequired(false);
    try {
      const rawId = id as string;
      const response = isUuid(rawId)
        ? await tournamentService.getTournamentById(rawId)
        : await tournamentService.getTournamentBySlug(rawId);
      setTournament(response.data);

      // Fetch registrations for this tournament
      try {
        const regsResponse = await registrationService.getTournamentRegistrations(response.data.id, {
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
        setAuthRequired(true);
        setError(t('tournament.loginRequired', 'You need to log in to view tournament details.'));
      } else if (err.response?.status === 401) {
        setAuthRequired(true);
        setError(t('tournament.loginRequired', 'You need to log in to view tournament details.'));
      } else if (err.response?.status === 404) {
        setError(t('tournament.notFound', 'Tournament not found.'));
      } else {
        setError(err.response?.data?.message || t('tournament.fetchError', 'Failed to load tournament details'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async (tournamentId: string) => {
    setLoadingMyRegistrations(true);
    try {
      const response = await registrationService.getMyRegistrationsForTournament(tournamentId);
      setMyRegistrations(response.data || []);
    } catch (err) {
      console.warn('Failed to fetch user registrations for tournament:', err);
      setMyRegistrations([]);
    } finally {
      setLoadingMyRegistrations(false);
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    // Open the registration wizard for the full flow
    setWizardAgeGroupId(undefined);
    setShowRegistrationWizard(true);
  };

  const handleRegisterForAgeGroup = (ageGroupId?: string) => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    setWizardAgeGroupId(ageGroupId);
    setShowRegistrationWizard(true);
  };

  const handleRegistrationSuccess = (registration: Registration) => {
    fetchTournament();
    if (tournament?.id) {
      fetchMyRegistrations(tournament.id);
    }
    setShowRegistrationWizard(false);
  };

  const handleSimpleRegister = async () => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }

    if (tournament?.ageGroups && tournament.ageGroups.length > 0) {
      setShowRegistrationWizard(true);
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

  const normalizeStatus = (status: TournamentStatus) =>
    status === 'DRAFT' ? 'PUBLISHED' : status;

  const getStatusBadge = (status: TournamentStatus) => {
    const normalizedStatus = normalizeStatus(status);
    const variants: Partial<Record<TournamentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'>> = {
      'PUBLISHED': 'info',
      'ONGOING': 'info',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
    };
    return variants[normalizedStatus] || 'default';
  };

  const getRegistrationStatusVariant = (status?: Registration['status']) => {
    const variants: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      APPROVED: 'success',
      PENDING: 'warning',
      REJECTED: 'danger',
      WITHDRAWN: 'default',
    };
    return (status && variants[status]) || 'default';
  };

  const getAgeGroupLabel = (birthYear: number, displayLabel?: string) => {
    if (displayLabel) return displayLabel;
    const currentYear = new Date().getFullYear();
    return `U${currentYear - birthYear}`;
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
    const isAuthError = authRequired;
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="error">{error || t('tournament.notFound', 'Tournament not found')}</Alert>
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

  const ageGroupTotals = tournament.ageGroups?.reduce(
    (acc, ageGroup) => {
      const ageGroupMaxTeams =
        ageGroup.teamCount ??
        ageGroup.maxTeams ??
        (ageGroup.teamsPerGroup && ageGroup.groupsCount
          ? ageGroup.teamsPerGroup * ageGroup.groupsCount
          : 0);
      const currentTeams = ageGroup.currentTeams ?? 0;
      return {
        maxTeams: acc.maxTeams + (ageGroupMaxTeams || 0),
        currentTeams: acc.currentTeams + currentTeams,
      };
    },
    { maxTeams: 0, currentTeams: 0 }
  );

  const derivedMaxTeams = tournament.ageGroups && tournament.ageGroups.length > 0
    ? ageGroupTotals?.maxTeams
    : tournament.maxTeams;
  const maxTeamsDisplay = derivedMaxTeams && derivedMaxTeams > 0 ? derivedMaxTeams : 0;
  const currentTeamsDisplay = tournament.ageGroups && tournament.ageGroups.length > 0
    ? ageGroupTotals?.currentTeams || 0
    : registrations.length;
  const spotsLeft = Math.max(maxTeamsDisplay - currentTeamsDisplay, 0);

  const tournamentLatitude = typeof tournament.latitude === 'string'
    ? parseFloat(tournament.latitude)
    : tournament.latitude;
  const tournamentLongitude = typeof tournament.longitude === 'string'
    ? parseFloat(tournament.longitude)
    : tournament.longitude;
  const hasValidLocation = typeof tournamentLatitude === 'number'
    && typeof tournamentLongitude === 'number'
    && !isNaN(tournamentLatitude)
    && !isNaN(tournamentLongitude);
  const mapTournaments = hasValidLocation
    ? [{ ...tournament, latitude: tournamentLatitude, longitude: tournamentLongitude }]
    : [];

  const ageGroupById = new Map(
    (tournament.ageGroups || []).map((ageGroup) => [ageGroup.id, ageGroup])
  );

  const isOwner = !!user && (user.id === tournament.organizerId || user.id === tournament.organizer?.id);
  const hasApprovedRegistration = myRegistrations.some(
    (registration) => registration.status === 'APPROVED'
  );

  const tabs = [
    {
      id: 'overview',
      label: t('tournament.tabs.overview'),
      content: (
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.details', 'Tournament Details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tournament.isPrivate && (
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-600">{t('tournament.visibility', 'Visibility')}</span>
                    <Badge variant="warning">{t('tournament.privateTournament', 'Private')}</Badge>
                  </div>
                )}
                {tournament.registrationFee && tournament.registrationFee > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-600">{t('tournament.registrationFee', 'Registration Fee')}</span>
                    <span className="font-medium">€{tournament.registrationFee}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.spotsLeft')}</span>
                  <span className="font-medium">{spotsLeft}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.ageCategory.label')}</span>
                  <span className="font-medium">{tournament.ageCategory || 'Open'}</span>
                </div>
                {tournament.numberOfMatches && (
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <span className="text-gray-600">{t('tournament.numberOfMatches')}</span>
                    <span className="font-medium">{tournament.numberOfMatches}</span>
                  </div>
                )}
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                  <span className="text-gray-600">{t('tournament.teamsRegistered', 'Teams Registered')}</span>
                  <span className="font-medium">{currentTeamsDisplay} / {maxTeamsDisplay}</span>
                </div>
              </div>
            </CardContent>
          </Card>

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

          {/* Age Categories */}
          {tournament.ageGroups && tournament.ageGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('tournaments.ageGroups.title', 'Age Categories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tournament.ageGroups.map((ag, index) => {
                    const displayLabel = getAgeGroupLabel(ag.birthYear, ag.displayLabel);
                    const ageGroupMaxTeams =
                      ag.teamCount ??
                      ag.maxTeams ??
                      (ag.teamsPerGroup && ag.groupsCount
                        ? ag.teamsPerGroup * ag.groupsCount
                        : 0);
                    const ageGroupCurrentTeams = ag.currentTeams ?? 0;
                    const ageGroupRegistration = myRegistrations.find(
                      (registration) => registration.ageGroupId === ag.id
                    );
                    const isRegistered = !!ageGroupRegistration;
                    const statusLabel = ageGroupRegistration?.status?.toLowerCase() || 'pending';
                    const ageGroupSpotsLeft = ageGroupMaxTeams > 0
                      ? Math.max(ageGroupMaxTeams - ageGroupCurrentTeams, 0)
                      : null;
                    const ageGroupIsFull = ageGroupMaxTeams > 0 && ageGroupSpotsLeft === 0;
                    return (
                      <div key={ag.id || index} className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{displayLabel}</span>
                          <div className="flex items-center gap-2">
                            {ag.gameSystem && (
                              <Badge variant="info">{ag.gameSystem}</Badge>
                            )}
                            {isRegistered && (
                              <Badge variant={getRegistrationStatusVariant(ageGroupRegistration?.status)}>
                                {t(`registration.status.${statusLabel}`, ageGroupRegistration?.status)}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span>{t('tournaments.ageGroups.birthYear', 'Birth Year')}: {ag.birthYear}</span>
                          {ag.ageCategory && (
                            <span>{t('tournament.ageCategory.label')}: {t(`tournament.ageCategory.${ag.ageCategory}`)}</span>
                          )}
                          {ag.level && (
                            <span>{t('tournament.level.label')}: {t(`tournament.level.${ag.level}`)}</span>
                          )}
                          {ag.format && (
                            <span>{t('tournament.format.label')}: {t(`tournament.format.${ag.format}`)}</span>
                          )}
                          {ageGroupMaxTeams > 0 && (
                            <span>
                              {t('tournament.teamsRegistered', 'Teams Registered')}: {ageGroupCurrentTeams} / {ageGroupMaxTeams}
                            </span>
                          )}

                          {(ag.registrationStartDate || ag.registrationEndDate || ag.startDate || ag.endDate) && (
                            <div className="col-span-2">
                              <hr className="border-t border-gray-200 my-2" />
                            </div>
                          )}

                          {(ag.registrationStartDate || ag.registrationEndDate || ag.startDate || ag.endDate) && (
                            <div className="col-span-2">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500">
                                {ag.registrationStartDate && (
                                  <div>{t('tournament.registrationOpens', 'Registration Opens')}: {formatDate(ag.registrationStartDate)}</div>
                                )}
                                {ag.registrationEndDate && (
                                  <div>{t('tournament.registrationCloses', 'Registration Closes')}: {formatDate(ag.registrationEndDate)}</div>
                                )}
                                {ag.startDate && (
                                  <div>{t('tournaments.ageGroups.startDate', 'Tournament Starts')}: {formatDate(ag.startDate)}</div>
                                )}
                                {ag.endDate && (
                                  <div>{t('tournaments.ageGroups.endDate', 'Tournament Ends')}: {formatDate(ag.endDate)}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {(ag.registrationStartDate || ag.registrationEndDate || ag.startDate || ag.endDate) && (
                            <div className="col-span-2">
                              <hr className="border-t border-gray-200 my-2" />
                            </div>
                          )}

                          {ag.locationAddress && (
                            <span className="col-span-2">{t('tournaments.ageGroups.locationAddress', 'Location')}: {ag.locationAddress}</span>
                          )}
                          {ag.participationFee !== undefined && ag.participationFee !== null && (
                            <span>{t('tournaments.ageGroups.participationFee', 'Fee')}: €{ag.participationFee}</span>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {ageGroupMaxTeams > 0
                              ? t('tournament.spotsLeft', 'Spots left') + `: ${ageGroupSpotsLeft}`
                              : t('tournament.unlimited', 'Unlimited')}
                          </span>
                          <Button
                            variant={isRegistered ? 'secondary' : 'primary'}
                            size="sm"
                            disabled={isRegistered || ageGroupIsFull}
                            onClick={() => handleRegisterForAgeGroup(ag.id)}
                          >
                            {isRegistered
                              ? t('registration.status.registered', 'Registered')
                              : t('tournament.register')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

          {tournament.whatsappGroupLink && hasApprovedRegistration && (
            <Card>
              <CardHeader>
                <CardTitle>{t('tournament.whatsappGroup', 'WhatsApp Group')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {t('tournament.whatsappGroupAccess', 'Join the tournament WhatsApp group')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('tournament.whatsappGroupHelp', 'Available after your club is approved.')}
                    </p>
                  </div>
                  <a
                    href={tournament.whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" size="sm">
                      {t('tournament.whatsappGroupJoin', 'Open WhatsApp')}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          )}


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
              {normalizeStatus(tournament.status) === 'PUBLISHED'
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

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
            <div className="space-y-6">
              <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {tournament.name}
                </h1>
                <Badge variant={getStatusBadge(tournament.status)}>
                  {t(`tournament.status.${normalizeStatus(tournament.status)}`)}
                </Badge>
              </div>

              {isPreviewMode && isOwner && (
                <div className="mt-3">
                  <Link href={`/dashboard/tournaments/${tournament.id}/edit`}>
                    <Button variant="primary" size="sm">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('common.edit')}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Quick info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">{t('tournament.tournamentStart', 'Tournament Start')}:</span>
                  <span className="font-medium text-gray-900">{formatDate(tournament.startDate)}</span>
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
                  {currentTeamsDisplay} / {maxTeamsDisplay} {t('common.teams')}
                </div>
              </div>
              </div>

              <Tabs tabs={tabs} />
            </div>

            {/* Sidebar */}
            <div className="flex-shrink-0 space-y-4">
              {/* Map */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('tournament.locationMap', 'Location Map')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {mapTournaments.length > 0 ? (
                    <TournamentMap
                      tournaments={mapTournaments}
                      defaultZoom={12}
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-600">{t('tournament.noLocation', 'No location data available')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact + Register */}
              <Card>
                <CardContent className="p-6">
                  {(tournament.organizer?.email || tournament.contactEmail) && (
                    <a
                      href={`mailto:${tournament.contactEmail || tournament.organizer?.email}?subject=${encodeURIComponent(t('tournament.emailSubject', `Question about ${tournament.name}`))}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 mb-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {t('tournament.contactOrganizer', 'Contact Organizer')}
                    </a>
                  )}

                  {tournament.status === 'PUBLISHED' ? (
                    tournament.isRegistrationClosed ? (
                      <Button variant="secondary" fullWidth disabled>
                        {t('tournament.registrationClosed')}
                      </Button>
                    ) : tournament.isPrivate && !hasValidInvite ? (
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

                  {isAuthenticated && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {t('registration.status.title', 'Your Applications')}
                        </h4>
                      </div>
                      {loadingMyRegistrations ? (
                        <div className="flex justify-center py-2">
                          <Loading size="sm" />
                        </div>
                      ) : myRegistrations.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          {t('registration.status.notRegisteredDesc', "You haven't registered for this tournament yet.")}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {myRegistrations.map((registration) => {
                            const ageGroup = registration.ageGroupId
                              ? ageGroupById.get(registration.ageGroupId)
                              : undefined;
                            const ageGroupLabel = ageGroup
                              ? getAgeGroupLabel(ageGroup.birthYear, ageGroup.displayLabel)
                              : t('tournament.ageCategory.open', 'Open');
                            const statusLabel = registration.status?.toLowerCase() || 'pending';
                            return (
                              <div
                                key={registration.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {registration.club?.name || t('common.team', 'Team')}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {ageGroupLabel}
                                  </p>
                                </div>
                                <Badge variant={getRegistrationStatusVariant(registration.status)}>
                                  {t(`registration.status.${statusLabel}`, registration.status)}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
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
          onClose={() => {
            setShowRegistrationWizard(false);
            setWizardAgeGroupId(undefined);
          }}
          onSuccess={handleRegistrationSuccess}
          initialAgeGroupId={wizardAgeGroupId}
        />
      )}
    </MainLayout>
  );
}
