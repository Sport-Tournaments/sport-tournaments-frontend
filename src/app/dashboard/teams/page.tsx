'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Input, Alert, ViewModeToggle, ViewMode } from '@/components/ui';
import { teamService, clubService } from '@/services';
import type { Team, Club } from '@/types';

export default function TeamsPage() {
  const { t } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClubId, setSelectedClubId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await teamService.getAllTeams({
        clubId: selectedClubId || undefined,
        search: search || undefined,
      });
      const data = (res as any)?.data ?? res;
      setTeams(Array.isArray(data) ? data : (data as any)?.data ?? []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, [search, selectedClubId]);

  const fetchClubs = useCallback(async () => {
    try {
      const res = await clubService.getMyClubs();
      const data = (res as any)?.data ?? res;
      const clubList = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setClubs(clubList);
    } catch {
      // silently fail - clubs dropdown optional
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await teamService.deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete team');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('nav.teams', 'Teams')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage your teams and assign players
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <ViewModeToggle
              mode={viewMode}
              onChange={setViewMode}
              listLabel={t('common.list', 'List')}
              gridLabel={t('common.grid', 'Grid')}
            />
            <Link href="/dashboard/teams/create" className="self-start sm:self-auto">
              <Button variant="primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm"
            value={selectedClubId}
            onChange={(e) => setSelectedClubId(e.target.value)}
          >
            <option value="">All Clubs</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>{club.name}</option>
            ))}
          </select>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-gray-500 mb-4">Create your first team to get started</p>
              <Link href="/dashboard/teams/create">
                <Button variant="primary">Create First Team</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6' : 'space-y-4'}>
            {teams.map((team) => (
              <Card key={team.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/teams/${team.id}`}
                        className="font-semibold text-gray-900 hover:text-primary text-lg"
                      >
                        {team.name}
                      </Link>
                      {team.club && (
                        <p className="text-sm text-gray-500 mt-1">{team.club.name}</p>
                      )}
                    </div>
                    <Badge variant="info">{team.ageCategory}</Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Birth Year: {team.birthyear}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Coach: {team.coach}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Players: {team.players?.length || 0}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Link href={`/dashboard/teams/${team.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        {t('common.view', 'View')}
                      </Button>
                    </Link>
                    <Link href={`/dashboard/teams/${team.id}/edit`} className="flex-1">
                      <Button variant="primary" size="sm" className="w-full">
                        {t('common.edit', 'Edit')}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(team.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
