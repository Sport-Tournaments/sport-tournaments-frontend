'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Tabs, Modal, Input, ClubColorBadge, ClubColorStripes, ClubColorBanner } from '@/components/ui';
import { clubService } from '@/services';
import { Club } from '@/types';

// Player interface for local use until playerService is implemented
interface Player {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  jerseyNumber?: number;
  dateOfBirth?: string;
  clubId: string;
}

export default function ClubDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [addingPlayer, setAddingPlayer] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    firstName: '',
    lastName: '',
    position: '',
    jerseyNumber: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const clubData = await clubService.getClubById(params.id as string);
      const responseData = (clubData as any)?.data || clubData;
      setClub(responseData);
      // Players functionality disabled until playerService is implemented
      setPlayers([]);
    } catch (err: any) {
      setError('Failed to load club');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!newPlayer.firstName || !newPlayer.lastName) return;
    
    setAddingPlayer(true);
    try {
      // playerService.create disabled until implemented
      setError('Player management is not yet available');
      setShowAddPlayer(false);
      setNewPlayer({ firstName: '', lastName: '', position: '', jerseyNumber: '', dateOfBirth: '' });
    } catch (err: any) {
      setError('Failed to add player');
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm('Are you sure you want to remove this player?')) return;
    
    try {
      // playerService.delete disabled until implemented
      setError('Player management is not yet available');
    } catch (err: any) {
      setError('Failed to remove player');
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

  const positionOptions = [
    { value: 'goalkeeper', label: 'Goalkeeper' },
    { value: 'defender', label: 'Defender' },
    { value: 'midfielder', label: 'Midfielder' },
    { value: 'forward', label: 'Forward' },
  ];

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
                <p className="text-xl sm:text-2xl font-bold text-primary">{players.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">{t('common.teams')}</p>
                <p className="text-xl sm:text-2xl font-bold">{club.teamCount || 0}</p>
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
                    showHex
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'players',
      label: `${t('common.players')} (${players.length})`,
      content: (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('common.players')}</CardTitle>
            <Button variant="primary" size="sm" onClick={() => setShowAddPlayer(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Player
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {players.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No players yet
                </h3>
                <p className="text-gray-500 mb-4">Add players to your club roster</p>
                <Button variant="primary" onClick={() => setShowAddPlayer(true)}>
                  Add First Player
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.name')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {players.map((player) => (
                      <tr key={player.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            {player.jerseyNumber || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">
                            {player.firstName} {player.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{player.position || 'N/A'}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {player.dateOfBirth 
                            ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePlayer(player.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            {t('common.remove')}
                          </Button>
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
        {(club.primaryColor || club.secondaryColor) && (
          <ClubColorBanner
            primaryColor={club.primaryColor}
            secondaryColor={club.secondaryColor}
            height="lg"
            pattern="gradient"
            opacity={0.08}
          >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
              <div className="flex items-center gap-6">
                {club.logo ? (
                  <img 
                    src={club.logo} 
                    alt={club.name} 
                    className="w-20 h-20 rounded-xl object-cover shadow-lg" 
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
              <div className="flex gap-2">
                <Link href={`/main/clubs/${club.id}`}>
                  <Button variant="outline">
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
        {!(club.primaryColor || club.secondaryColor) && (
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
              <Link href={`/main/clubs/${club.id}`}>
                <Button variant="outline">
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

        {/* Add Player Modal */}
        <Modal
          isOpen={showAddPlayer}
          onClose={() => setShowAddPlayer(false)}
          title="Add Player"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={newPlayer.firstName}
                onChange={(e) => setNewPlayer({ ...newPlayer, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                value={newPlayer.lastName}
                onChange={(e) => setNewPlayer({ ...newPlayer, lastName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2"
                  value={newPlayer.position}
                  onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                >
                  <option value="">Select position</option>
                  {positionOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <Input
                type="number"
                label="Jersey Number"
                value={newPlayer.jerseyNumber}
                onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
              />
            </div>
            <Input
              type="date"
              label="Date of Birth"
              value={newPlayer.dateOfBirth}
              onChange={(e) => setNewPlayer({ ...newPlayer, dateOfBirth: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowAddPlayer(false)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleAddPlayer}
                isLoading={addingPlayer}
                disabled={!newPlayer.firstName || !newPlayer.lastName}
              >
                Add Player
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
