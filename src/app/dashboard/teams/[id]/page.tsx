'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Tabs } from '@/components/ui';
import { teamService } from '@/services';
import type { Team } from '@/types';
import { formatDate } from '@/utils/date';

export default function TeamDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, [params.id]);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await teamService.getTeamById(params.id as string);
      const data = (res as any)?.data ?? res;
      setTeam(data);
    } catch (err: any) {
      setError('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!team || !confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamService.deleteTeam(team.id);
      router.push('/dashboard/teams');
    } catch (err: any) {
      setError('Failed to delete team');
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

  if (!team) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Team not found'}</Alert>
      </DashboardLayout>
    );
  }

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Age Category</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{team.ageCategory}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Birth Year</p>
                <p className="text-xl sm:text-2xl font-bold">{team.birthyear}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Coach</p>
                <p className="text-lg sm:text-xl font-bold truncate">{team.coach}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-xs sm:text-sm text-gray-500">Players</p>
                <p className="text-xl sm:text-2xl font-bold">{team.players?.length || 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Club</p>
                  <p className="font-medium">
                    {team.club ? (
                      <Link href={`/dashboard/clubs/${team.club.id}`} className="text-primary hover:underline">
                        {team.club.name}
                      </Link>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Coach</p>
                  <p className="font-medium">{team.coach}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Age Category</p>
                  <p className="font-medium">{team.ageCategory}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Birth Year</p>
                  <p className="font-medium">{team.birthyear}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'players',
      label: `Players (${team.players?.length || 0})`,
      content: (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Players</CardTitle>
            <Link href={`/dashboard/teams/${team.id}/edit`}>
              <Button variant="primary" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Manage Players
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {!team.players || team.players.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No players assigned</h3>
                <p className="text-gray-500 mb-4">Edit this team to assign players</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date of Birth</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {team.players.map((player) => (
                      <tr key={player.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                          <Link href={`/dashboard/players/${player.id}`} className="hover:text-primary">
                            {player.firstname} {player.lastname}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(player.dateOfBirth)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Link href={`/dashboard/players/${player.id}/edit`}>
                            <Button variant="outline" size="sm">Edit</Button>
                          </Link>
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
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{team.name.charAt(0)}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
                <Badge variant="info">{team.ageCategory}</Badge>
              </div>
              <p className="text-gray-600 mt-1">
                {team.club?.name || 'Unknown Club'} &middot; Birth Year {team.birthyear}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/teams/${team.id}/edit`}>
              <Button variant="primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </div>

        <Tabs tabs={tabs} defaultTab="overview" />
      </div>
    </DashboardLayout>
  );
}
