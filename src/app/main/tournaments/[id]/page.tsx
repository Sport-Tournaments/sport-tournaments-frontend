'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Tabs, Loading, Alert, Modal } from '@/components/ui';
import { tournamentService, registrationService, clubService } from '@/services';
import { Tournament, TournamentStatus, Registration, Club } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';
import { useAuthStore } from '@/store';

export default function TournamentDetailPage() {
  const { id } = useParams();
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
  const [loadingClubs, setLoadingClubs] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTournament();
    }
  }, [id]);

  const fetchTournament = async () => {
    setLoading(true);
    try {
      const response = await tournamentService.getTournamentById(id as string);
      setTournament(response.data);

      // Fetch registrations for this tournament
      const regsResponse = await registrationService.getTournamentRegistrations(id as string, {
        status: 'APPROVED' as any,
      });
      setRegistrations(regsResponse.data.items || []);
    } catch (err) {
      console.error('Failed to fetch tournament:', err);
      setError('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
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
    try {
      await registrationService.registerForTournament(id as string, { clubId });
      setError(null);
      fetchTournament();
    } catch (err: any) {
      console.error('Registration failed:', err);
      const message = err.response?.data?.message || t('tournament.registrationFailed', 'Registration failed. Please try again.');
      setError(message);
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
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="error">{error || 'Tournament not found'}</Alert>
          <Link href="/main/tournaments">
            <Button variant="ghost" className="mt-4">
              ← {t('common.back')}
            </Button>
          </Link>
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

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.schedule')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">{t('tournament.registrationStart')}</span>
                  <span className="font-medium">{tournament.registrationStartDate ? formatDateTime(tournament.registrationStartDate) : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">{t('tournament.registrationEnd')}</span>
                  <span className="font-medium">{tournament.registrationEndDate ? formatDateTime(tournament.registrationEndDate) : 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">{t('tournament.tournamentStart')}</span>
                  <span className="font-medium">{formatDateTime(tournament.startDate)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">{t('tournament.tournamentEnd')}</span>
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
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournament.name}
                </h1>
                <Badge variant={getStatusBadge(tournament.status)}>
                  {t(`tournament.status.${tournament.status}`)}
                </Badge>
              </div>

              {/* Quick info */}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('tournament.format.label')}</span>
                    <span className="font-medium">{tournament.format || 'Groups + Knockout'}</span>
                  </div>
                </div>

                {tournament.status === 'PUBLISHED' ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleRegister}
                    isLoading={registering || loadingClubs}
                  >
                    {t('tournament.register')}
                  </Button>
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
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                <div className="font-medium text-gray-900 dark:text-white">
                  {club.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
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
    </MainLayout>
  );
}
