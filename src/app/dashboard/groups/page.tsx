'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Loading, Select, ViewModeToggle, ViewMode } from '@/components/ui';
import { tournamentService, groupService, registrationService } from '@/services';
import { Tournament, Group, AgeGroup } from '@/types';
import { useAuthStore } from '@/store';

export default function GroupsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const isOrganizer = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchGroups(selectedTournament);
    }
  }, [selectedTournament]);

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const allTournaments: Tournament[] = [];
      const seenIds = new Set<string>();

      // Fetch organizer's tournaments
      try {
        const response = await tournamentService.getMyTournaments();
        const resData = response.data as any;
        
        let tournamentData: Tournament[] = [];
        if (Array.isArray(resData)) {
          tournamentData = resData;
        } else if (resData?.data && Array.isArray(resData.data)) {
          tournamentData = resData.data;
        } else if (resData?.items && Array.isArray(resData.items)) {
          tournamentData = resData.items;
        }
        
        tournamentData.forEach(t => {
          if (!seenIds.has(t.id)) {
            seenIds.add(t.id);
            allTournaments.push(t);
          }
        });
      } catch {
        // Organizer tournaments might fail for participants, that's OK
      }

      // Also fetch tournaments from user's registrations
      try {
        const regResponse = await registrationService.getMyRegistrations();
        const regData = regResponse.data as any;
        
        let registrations: any[] = [];
        if (Array.isArray(regData)) {
          registrations = regData;
        } else if (regData?.data && Array.isArray(regData.data)) {
          registrations = regData.data;
        } else if (regData?.items && Array.isArray(regData.items)) {
          registrations = regData.items;
        }

        // Extract unique tournaments from registrations
        for (const reg of registrations) {
          if (reg.tournament && !seenIds.has(reg.tournament.id)) {
            seenIds.add(reg.tournament.id);
            allTournaments.push(reg.tournament);
          }
        }

        // For tournaments without ageGroups loaded, fetch full details
        for (let i = 0; i < allTournaments.length; i++) {
          if (!allTournaments[i].ageGroups || allTournaments[i].ageGroups!.length === 0) {
            try {
              const fullTournament = await tournamentService.getTournamentById(allTournaments[i].id);
              if (fullTournament.data) {
                allTournaments[i] = fullTournament.data;
              }
            } catch {
              // Keep partial data
            }
          }
        }
      } catch {
        // Registrations might not be available
      }

      setTournaments(allTournaments);
      if (allTournaments.length > 0) {
        setSelectedTournament(allTournaments[0].id);
        // Auto-select first age group if available
        const firstAgeGroups = allTournaments[0].ageGroups;
        if (firstAgeGroups && firstAgeGroups.length > 0 && firstAgeGroups[0].id) {
          setSelectedAgeGroup(firstAgeGroups[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (tournamentId: string) => {
    setLoadingGroups(true);
    try {
      const response = await groupService.getGroups(tournamentId);
      const resData = response.data as any;
      
      let groupData: Group[] = [];
      if (Array.isArray(resData)) {
        groupData = resData;
      } else if (resData?.data && Array.isArray(resData.data)) {
        groupData = resData.data;
      } else if (resData?.items && Array.isArray(resData.items)) {
        groupData = resData.items;
      }
      
      setGroups(groupData);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleExecuteDraw = async () => {
    if (!selectedTournament) return;
    
    try {
      const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
      const ageGroup = selectedTournamentData?.ageGroups?.find(ag => ag.id === selectedAgeGroup);
      const numberOfGroups = ageGroup?.groupsCount || 4;
      
      await groupService.executeDraw(selectedTournament, { numberOfGroups });
      fetchGroups(selectedTournament);
    } catch (error) {
      console.error('Failed to execute draw:', error);
    }
  };

  const handleResetDraw = async () => {
    if (!selectedTournament) return;
    if (!confirm(t('groups.confirmReset'))) return;
    
    try {
      await groupService.resetDraw(selectedTournament);
      setGroups([]);
    } catch (error) {
      console.error('Failed to reset draw:', error);
    }
  };

  const tournamentOptions = tournaments.map(t => ({
    value: t.id,
    label: t.name,
  }));

  const selectedTournamentData = tournaments.find(t => t.id === selectedTournament);
  const ageGroupOptions = (selectedTournamentData?.ageGroups || []).map(ag => ({
    value: ag.id || '',
    label: `${ag.displayLabel || ag.ageCategory || 'Category'} (Birth Year: ${ag.birthYear})`,
  }));

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tournamentId = e.target.value;
    setSelectedTournament(tournamentId);
    // Auto-select first age group of the new tournament
    const tournament = tournaments.find(t => t.id === tournamentId);
    const firstAgeGroup = tournament?.ageGroups?.[0];
    setSelectedAgeGroup(firstAgeGroup?.id || null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('groups.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('groups.subtitle', 'Manage tournament groups and draw')}
            </p>
          </div>
          <ViewModeToggle
            mode={viewMode}
            onChange={setViewMode}
            listLabel={t('common.list', 'List')}
            gridLabel={t('common.grid', 'Grid')}
            className="self-start sm:self-auto"
          />
        </div>

        {/* Tournament Selector */}
        {tournaments.length > 0 ? (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:max-w-md">
                    <Select
                      label={t('groups.selectTournament', 'Select Tournament')}
                      options={tournamentOptions}
                      value={selectedTournament || ''}
                      onChange={handleTournamentChange}
                    />
                  </div>
                  {ageGroupOptions.length > 0 && (
                    <div className="w-full sm:max-w-xs">
                      <Select
                        label={t('groups.selectAgeGroup', 'Age Group')}
                        options={ageGroupOptions}
                        value={selectedAgeGroup || ''}
                        onChange={(e) => setSelectedAgeGroup(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                {isOrganizer && (
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button
                      variant="primary"
                      onClick={handleExecuteDraw}
                      disabled={!selectedTournament || loadingGroups}
                    >
                      {t('groups.executeDraw')}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={handleResetDraw}
                      disabled={!selectedTournament || groups.length === 0 || loadingGroups}
                    >
                      {t('groups.resetDraw')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('groups.noTournaments', 'No Tournaments Found')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('groups.noTournamentsDesc', 'Create a tournament first to manage groups')}
              </p>
              <Link href="/dashboard/tournaments/create">
                <Button variant="primary">
                  {t('tournament.createNew')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Groups Display */}
        {loadingGroups ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : groups.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4'}>
            {groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{t('groups.group')} {group.groupLetter}</span>
                    <Badge variant="info">{group.teams?.length || 0} {t('common.teams')}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {group.teams && group.teams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {t('groups.team')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              {t('groups.played')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              {t('groups.won')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              {t('groups.drawn')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              {t('groups.lost')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500">
                              {t('groups.points')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {group.teams.map((team: any, index: number) => (
                            <tr key={team.id || index}>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                                {team.name || team.clubName || `Team ${index + 1}`}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500">
                                {team.played || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500">
                                {team.won || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500">
                                {team.drawn || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500">
                                {team.lost || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
                                {team.points || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-4">
                      {t('groups.noTeams', 'No teams in this group')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : selectedTournament ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('groups.noGroups', 'No Groups Yet')}
              </h3>
              <p className="text-gray-500 mb-4">
                {isOrganizer 
                  ? t('groups.noGroupsDesc', 'Execute a draw to create groups for this tournament')
                  : t('groups.noGroupsParticipant', 'Groups have not been drawn yet for this tournament')
                }
              </p>
              {isOrganizer && (
                <Button variant="primary" onClick={handleExecuteDraw}>
                  {t('groups.executeDraw')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
