'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Input, Alert, ViewModeToggle, ViewMode } from '@/components/ui';
import { playerService } from '@/services';
import type { Player } from '@/types';

export default function PlayersPage() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await playerService.getPlayers({
        search: search || undefined,
        pageSize: 50,
      });
      const data = (res as any)?.data ?? res;
      setPlayers(Array.isArray(data) ? data : (data as any)?.data ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    try {
      await playerService.deletePlayer(id);
      setPlayers((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete player');
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('nav.players', 'Players')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage players across your teams
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ViewModeToggle
              mode={viewMode}
              onChange={setViewMode}
              listLabel={t('common.list', 'List')}
              gridLabel={t('common.grid', 'Grid')}
            />
            <Link href="/dashboard/players/create" className="self-start sm:self-auto">
              <Button variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Player
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search players by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : players.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No players yet</h3>
              <p className="text-gray-500 mb-4">Add your first player to get started</p>
              <Link href="/dashboard/players/create">
                <Button variant="primary">Add First Player</Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === 'list' ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date of Birth
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Age
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Teams
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {players.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-semibold text-primary">
                                {player.firstname.charAt(0)}{player.lastname.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <Link
                                href={`/dashboard/players/${player.id}`}
                                className="font-medium text-gray-900 hover:text-primary"
                              >
                                {player.firstname} {player.lastname}
                              </Link>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(player.dateOfBirth).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {calculateAge(player.dateOfBirth)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {player.teams && player.teams.length > 0 ? (
                              player.teams.map((team) => (
                                <Badge key={team.id} variant="info">
                                  {team.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-gray-400">No teams</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/dashboard/players/${player.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(player.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {players.map((player) => (
              <Card key={player.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {player.firstname.charAt(0)}{player.lastname.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <Link href={`/dashboard/players/${player.id}`} className="font-medium text-gray-900 hover:text-primary">
                        {player.firstname} {player.lastname}
                      </Link>
                      <p className="text-sm text-gray-500">
                        {calculateAge(player.dateOfBirth)} years old
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    DOB: {new Date(player.dateOfBirth).toLocaleDateString()}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {player.teams && player.teams.length > 0 ? (
                      player.teams.map((team) => (
                        <Badge key={team.id} variant="info">
                          {team.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No teams</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/players/${player.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(player.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
