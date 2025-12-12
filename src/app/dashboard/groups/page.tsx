'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Loading, Select } from '@/components/ui';
import { tournamentService, groupService } from '@/services';
import { Tournament, Group } from '@/types';

export default function GroupsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

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
      
      setTournaments(tournamentData);
      if (tournamentData.length > 0) {
        setSelectedTournament(tournamentData[0].id);
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
      await groupService.executeDraw(selectedTournament, { numberOfGroups: 4 });
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
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('groups.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('groups.subtitle', 'Manage tournament groups and draw')}
            </p>
          </div>
        </div>

        {/* Tournament Selector */}
        {tournaments.length > 0 ? (
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col gap-4">
                <div className="w-full sm:max-w-md">
                  <Select
                    label={t('groups.selectTournament', 'Select Tournament')}
                    options={tournamentOptions}
                    value={selectedTournament || ''}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                  />
                </div>
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
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('groups.noTournaments', 'No Tournaments Found')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                              {t('groups.team')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {t('groups.played')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {t('groups.won')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {t('groups.drawn')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {t('groups.lost')}
                            </th>
                            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                              {t('groups.points')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {group.teams.map((team: any, index: number) => (
                            <tr key={team.id || index}>
                              <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {team.name || team.clubName || `Team ${index + 1}`}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                {team.played || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                {team.won || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                {team.drawn || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                                {team.lost || 0}
                              </td>
                              <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 dark:text-white">
                                {team.points || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
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
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('groups.noGroups', 'No Groups Yet')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('groups.noGroupsDesc', 'Execute a draw to create groups for this tournament')}
              </p>
              <Button variant="primary" onClick={handleExecuteDraw}>
                {t('groups.executeDraw')}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
