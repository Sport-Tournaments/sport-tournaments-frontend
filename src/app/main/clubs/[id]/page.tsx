'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Tabs, Loading, Alert, Avatar, Badge, ClubColorBadge, ClubColorBanner } from '@/components/ui';
import { clubService } from '@/services';
import { Club, Team } from '@/types';

export default function ClubDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchClub();
    }
  }, [id]);

  const fetchClub = async () => {
    setLoading(true);
    try {
      const response = await clubService.getClubById(id as string);
      setClub(response.data);

      // Fetch teams for this club (placeholder - service method doesn't exist yet)
      // const teamsResponse = await clubService.getClubTeams(id as string);
      // setTeams(teamsResponse.data || []);
      setTeams([]);
    } catch (err) {
      console.error('Failed to fetch club:', err);
      setError('Failed to load club details');
    } finally {
      setLoading(false);
    }
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

  if (error || !club) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-8">
          <Alert variant="error">{error || 'Club not found'}</Alert>
          <Link href="/main/clubs">
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
      label: t('club.tabs.overview'),
      content: (
        <div className="space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>{t('club.about')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">
                {club.description || t('club.noDescription')}
              </p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('club.contactInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {club.contactEmail && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${club.contactEmail}`} className="text-primary hover:underline">
                      {club.contactEmail}
                    </a>
                  </div>
                )}
                {club.contactPhone && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${club.contactPhone}`} className="text-primary hover:underline">
                      {club.contactPhone}
                    </a>
                  </div>
                )}
                {club.website && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {club.website}
                    </a>
                  </div>
                )}
                {club.address && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{club.address}</span>
                  </div>
                )}
                {club.foundedYear && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t('clubs.foundedIn', 'Founded in')} {club.foundedYear}</span>
                  </div>
                )}
                {(club.primaryColor || club.secondaryColor) && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <ClubColorBadge 
                      primaryColor={club.primaryColor} 
                      secondaryColor={club.secondaryColor} 
                      size="md"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'teams',
      label: `${t('club.tabs.teams')} (${teams.length})`,
      content: (
        <Card>
          <CardHeader>
            <CardTitle>{t('club.teams')}</CardTitle>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <p className="text-center text-gray-500 py-8">{t('club.noTeams')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={team.logo}
                        alt={team.name}
                        size="md"
                      />
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-gray-500">
                          {team.ageCategory} • {team.playerCount || 0} {t('common.players')}
                        </p>
                      </div>
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
      id: 'tournaments',
      label: t('club.tabs.tournaments'),
      content: (
        <Card>
          <CardHeader>
            <CardTitle>{t('club.participatedTournaments')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">{t('club.noTournamentsParticipated')}</p>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Color Banner */}
        {(club.primaryColor || club.secondaryColor) && (
          <ClubColorBanner
            primaryColor={club.primaryColor}
            secondaryColor={club.secondaryColor}
            height="xl"
            pattern="radial"
            opacity={0.08}
          >
            <div className="container mx-auto px-4 h-full flex flex-col justify-end pb-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
                {club.logo ? (
                  <img
                    src={club.logo}
                    alt={club.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/90 rounded-xl flex items-center justify-center shadow-xl">
                    <span className="text-4xl font-bold text-primary">{club.name.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left pb-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 drop-shadow-lg">
                      {club.name}
                    </h1>
                    {club.verified && (
                      <Badge variant="success">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t('common.verified')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-700 font-medium drop-shadow">
                    {club.city && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {club.city}, {club.country}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {club.memberCount || 0} {t('common.members')}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {teams.length} {t('common.teams')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ClubColorBanner>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Back button */}
          <Link href="/main/clubs">
            <Button variant="ghost" className="mb-4">
              ← {t('common.back')}
            </Button>
          </Link>

          {/* Header (fallback when no colors) */}
          {!(club.primaryColor || club.secondaryColor) && (
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8 text-center sm:text-left">
              <Avatar
                src={club.logo}
                alt={club.name}
                size="xl"
                className="w-20 h-20 sm:w-24 sm:h-24"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {club.name}
                  </h1>
                  {club.verified && (
                    <Badge variant="success">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {club.city && (
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {club.city}, {club.country}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {club.memberCount || 0} {t('common.members')}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {teams.length} {t('common.teams')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs tabs={tabs} />
        </div>
      </div>
    </MainLayout>
  );
}
