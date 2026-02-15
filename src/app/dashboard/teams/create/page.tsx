'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert } from '@/components/ui';
import { teamService, clubService, playerService } from '@/services';
import type { Club, Player } from '@/types';

export default function CreateTeamPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');

  const [form, setForm] = useState({
    clubId: '',
    name: '',
    ageCategory: '',
    birthyear: new Date().getFullYear() - 15,
    coach: '',
  });

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await clubService.getMyClubs();
        const data = (res as any)?.data ?? res;
        setClubs(Array.isArray(data) ? data : (data as any)?.data ?? []);
      } catch { /* silently fail */ }
    };
    fetchClubs();
  }, []);

  const searchPlayers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setAvailablePlayers([]);
      return;
    }
    try {
      const res = await playerService.searchPlayers({ q: query, limit: 20 });
      const data = (res as any)?.data ?? res;
      setAvailablePlayers(Array.isArray(data) ? data : (data as any)?.data ?? []);
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => searchPlayers(playerSearch), 300);
    return () => clearTimeout(timeout);
  }, [playerSearch, searchPlayers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clubId || !form.name || !form.ageCategory || !form.coach) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await teamService.createTeam({
        ...form,
        playerIds: selectedPlayerIds.length > 0 ? selectedPlayerIds : undefined,
      });
      router.push('/dashboard/teams');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to create team';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Team</h1>
          <p className="text-gray-600 mt-1">Add a new team to one of your clubs</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Team Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Club *</label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2"
                  value={form.clubId}
                  onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                  required
                >
                  <option value="">Select a club</option>
                  {clubs.map((club) => (
                    <option key={club.id} value={club.id}>{club.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Team Name *"
                placeholder="e.g. U17 A"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Age Category *"
                  placeholder="e.g. U17"
                  value={form.ageCategory}
                  onChange={(e) => setForm({ ...form, ageCategory: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  label="Birth Year *"
                  value={String(form.birthyear)}
                  onChange={(e) => setForm({ ...form, birthyear: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <Input
                label="Coach Name *"
                placeholder="e.g. John Smith"
                value={form.coach}
                onChange={(e) => setForm({ ...form, coach: e.target.value })}
                required
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Assign Players (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search players by name..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
              />

              {selectedPlayerIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPlayerIds.map((id) => {
                    const player = availablePlayers.find((p) => p.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {player ? `${player.firstname} ${player.lastname}` : id}
                        <button
                          type="button"
                          onClick={() => togglePlayer(id)}
                          className="ml-1 text-primary/60 hover:text-primary"
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {availablePlayers.length > 0 && (
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {availablePlayers.map((player) => (
                    <label
                      key={player.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlayerIds.includes(player.id)}
                        onChange={() => togglePlayer(player.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {player.firstname} {player.lastname}
                      </span>
                      <span className="text-xs text-gray-500">
                        Born: {new Date(player.dateOfBirth).toLocaleDateString()}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/teams')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Create Team
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
