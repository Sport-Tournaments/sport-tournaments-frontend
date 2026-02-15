'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading } from '@/components/ui';
import { playerService } from '@/services';
import type { Player } from '@/types';

export default function PlayerDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const res = await playerService.getPlayerById(params.id as string);
        const data = (res as any)?.data ?? res;
        setPlayer(data);
      } catch {
        setError('Failed to load player');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [params.id]);

  const handleDelete = async () => {
    if (!player || !confirm('Are you sure you want to delete this player?')) return;
    try {
      await playerService.deletePlayer(player.id);
      router.push('/dashboard/players');
    } catch {
      setError('Failed to delete player');
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!player) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Player not found'}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {player.firstname.charAt(0)}{player.lastname.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {player.firstname} {player.lastname}
              </h1>
              <p className="text-gray-600 mt-1">
                Age {calculateAge(player.dateOfBirth)} &middot; Born {new Date(player.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/players/${player.id}/edit`}>
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

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Player Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">First Name</p>
                <p className="font-medium">{player.firstname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="font-medium">{player.lastname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{new Date(player.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium">{calculateAge(player.dateOfBirth)} years</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teams ({player.teams?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {player.teams && player.teams.length > 0 ? (
                <div className="space-y-3">
                  {player.teams.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Link href={`/dashboard/teams/${team.id}`} className="font-medium text-gray-900 hover:text-primary">
                          {team.name}
                        </Link>
                        <p className="text-xs text-gray-500">{team.ageCategory} &middot; {team.club?.name || ''}</p>
                      </div>
                      <Badge variant="info">{team.ageCategory}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Not assigned to any teams yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
