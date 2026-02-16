'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert } from '@/components/ui';
import { playerService, teamService } from '@/services';
import type { Team } from '@/types';

export default function CreatePlayerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamService.getAllTeams();
        const data = (res as any)?.data ?? res;
        setTeams(Array.isArray(data) ? data : (data as any)?.data ?? []);
      } catch { /* silently fail */ }
    };
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstname || !form.lastname || !form.dateOfBirth) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await playerService.createPlayer({
        ...form,
        teamIds: selectedTeamIds.length > 0 ? selectedTeamIds : undefined,
      });
      router.push('/dashboard/players');
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to create player';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const toggleTeam = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Player</h1>
          <p className="text-gray-600 mt-1">Add a new player and assign to teams</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Player Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  placeholder="e.g. Alex"
                  value={form.firstname}
                  onChange={(e) => setForm({ ...form, firstname: e.target.value })}
                  required
                />
                <Input
                  label="Last Name *"
                  placeholder="e.g. Popescu"
                  value={form.lastname}
                  onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                  required
                />
              </div>

              <Input
                type="date"
                label="Date of Birth *"
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                required
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Assign to Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTeamIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTeamIds.map((id) => {
                    const team = teams.find((t) => t.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                      >
                        {team?.name || id}
                        <button
                          type="button"
                          onClick={() => toggleTeam(id)}
                          className="ml-1 text-primary/60 hover:text-primary"
                        >
                          &times;
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {teams.length > 0 ? (
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {teams.map((team) => (
                    <label
                      key={team.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTeamIds.includes(team.id)}
                        onChange={() => toggleTeam(team.id)}
                        className="rounded border-gray-300"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{team.name}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {team.ageCategory} &middot; {team.club?.name || ''}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No teams available. Create a team first.</p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/players')}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              Add Player
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
