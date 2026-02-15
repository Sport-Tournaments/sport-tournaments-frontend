'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Tabs, Modal, ClubColorBadge, ClubColorStripes, ClubColorBanner } from '@/components/ui';
import { clubService, teamService } from '@/services';
import { Club, Team } from '@/types';

export default function ClubDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [clubData, teamsData] = await Promise.all([
        clubService.getClubById(params.id as string),
        teamService.getTeamsByClub(params.id as string),
      ]);
      const responseData = (clubData as any)?.data || clubData;
      setClub(responseData);
      const teamsList = (teamsData as any)?.data ?? teamsData;
      setTeams(Array.isArray(teamsList) ? teamsList : (teamsList as any)?.data ?? []);
    } catch (err: any) {
      setError('Failed to load club');
    } finally {
      setLoading(false);
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

  if (!club) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Club not found'}</Alert>
      </DashboardLayout>
    );
  }

  const openImagePreview = (url: string, alt: string) => {
    setPreviewImage({ url, alt });
  };

  const tabs = [
    {
      id: 'overview',
      label: t('common.overview'),
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">{t('common.players')}</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{teams.reduce((acc, t) => acc + (t.players?.length || 0), 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">{t('common.teams')}</p>
                <p className="text-xl sm:text-2xl font-bold">{teams.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Founded</p>
                <p className="text-xl sm:text-2xl font-bold">{club.foundedYear || '-'}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('clubs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {club.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">{t('common.description')}</p>
                  <p className="text-gray-700">{club.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">{t('common.location')}</p>
                  <p className="font-medium">{club.city}, {club.country}</p>
                  {club.address && <p className="text-gray-500">{club.address}</p>}
                </div>
                {club.foundedYear && (
                  <div>
                    <p className="text-sm text-gray-500">{t('clubs.foundedYear')}</p>
                    <p className="font-medium">{club.foundedYear}</p>
                  </div>
                )}
                {club.contactEmail && (
                  <div>
                    <p className="text-sm text-gray-500">{t('common.email')}</p>
                    <a href={`mailto:${club.contactEmail}`} className="text-primary hover:underline">
                      {club.contactEmail}
                    </a>
                  </div>
                )}
                {club.contactPhone && (
                  <div>
                    <p className="text-sm text-gray-500">{t('common.phone')}</p>
                    <p className="font-medium">{club.contactPhone}</p>
                  </div>
                )}
                {club.website && (
                  <div>
                    <p className="text-sm text-gray-500">{t('common.website')}</p>
                    <a href={club.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {club.website}
                    </a>
                  </div>
                )}
              </div>
              
              {/* Club Colors Display */}
              {(club.primaryColor || club.secondaryColor) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-3">{t('clubs.colors', 'Club Colors')}</p>
                  <ClubColorStripes primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} className="mb-3" />
                  <ClubColorBadge 
                    primaryColor={club.primaryColor} 
                    secondaryColor={club.secondaryColor} 
                    size="lg"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'teams',
      label: `${t('common.teams')} (${teams.length})`,
      content: (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('common.teams')}</CardTitle>
            <Link href="/dashboard/teams/create">
              <Button variant="primary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Team
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                <p className="text-gray-500 mb-4">Create a team for this club</p>
                <Link href="/dashboard/teams/create">
                  <Button variant="primary">Create First Team</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {teams.map((team) => (
                  <div key={team.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <Link href={`/dashboard/teams/${team.id}`} className="font-medium text-gray-900 hover:text-primary">
                        {team.name}
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="info">{team.ageCategory}</Badge>
                        <span className="text-sm text-gray-500">Birth Year: {team.birthyear}</span>
                        <span className="text-sm text-gray-500">Coach: {team.coach}</span>
                        <span className="text-sm text-gray-500">{team.players?.length || 0} players</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/teams/${team.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <Link href={`/dashboard/teams/${team.id}/edit`}>
                        <Button variant="primary" size="sm">Edit</Button>
                      </Link>
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
      id: 'registrations',
      label: 'Registrations',
      content: (
        <Card>
          <CardContent className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tournament Registrations
            </h3>
            <p className="text-gray-500 mb-4">View and manage tournament registrations for this club</p>
            <Link href="/main/tournaments">
              <Button variant="primary">Browse Tournaments</Button>
            </Link>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Color Banner */}
        {(club.logo || club.primaryColor || club.secondaryColor) && (
          <ClubColorBanner
            primaryColor={club.primaryColor}
            secondaryColor={club.secondaryColor}
            backgroundImageUrl={club.logo}
            height="lg"
            pattern="gradient"
            opacity={0.08}
          >
            {club.logo && (
              <button
                type="button"
                onClick={() => openImagePreview(club.logo as string, club.name)}
                className="absolute inset-0 z-0 cursor-zoom-in"
                aria-label="Preview cover image"
              />
            )}
            <div className="container mx-auto px-4 h-full flex items-center justify-between relative z-10 pointer-events-none">
              <div className="flex items-center gap-6 pointer-events-auto">
                {club.logo ? (
                  <img 
                    src={club.logo} 
                    alt={club.name} 
                    className="w-20 h-20 rounded-xl object-cover shadow-lg cursor-zoom-in"
                    onClick={() => openImagePreview(club.logo as string, club.name)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-white/90 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl font-bold text-primary">{club.name.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-gray-900 drop-shadow-md">
                      {club.name}
                    </h1>
                    {club.verified && (
                      <Badge variant="success">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t('common.verified')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-700 mt-1 font-medium drop-shadow">
                    {club.city}, {club.country}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pointer-events-auto">
                <Link href={`/main/clubs/${club.id}?preview=true`}>
                  <Button variant="view">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t('common.viewPublic')}
                  </Button>
                </Link>
                <Link href={`/dashboard/clubs/${club.id}/edit`}>
                  <Button variant="primary">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('common.edit')}
                  </Button>
                </Link>
              </div>
            </div>
          </ClubColorBanner>
        )}
        
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header (fallback when no colors) */}
        {!(club.logo || club.primaryColor || club.secondaryColor) && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {club.logo ? (
                <img src={club.logo} alt={club.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{club.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {club.name}
                  </h1>
                  {club.verified && (
                    <Badge variant="success">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  {club.city}, {club.country}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/main/clubs/${club.id}?preview=true`}>
                <Button variant="view">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {t('common.viewPublic')}
                </Button>
              </Link>
              <Link href={`/dashboard/clubs/${club.id}/edit`}>
                <Button variant="primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {t('common.edit')}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs tabs={tabs} defaultTab="overview" />

        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title={previewImage?.alt}
          size="xl"
        >
          {previewImage && (
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-h-[80vh] w-auto mx-auto rounded-lg"
            />
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
