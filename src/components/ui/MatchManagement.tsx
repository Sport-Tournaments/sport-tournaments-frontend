'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { groupService } from '@/services';
import { formatDateTime } from '@/utils/date';

function formatFieldDisplay(fieldName: string): string {
  return /^\d+$/.test(fieldName.trim()) ? `Pitch ${fieldName.trim()}` : fieldName;
}
import type { BracketMatch, PlayoffRound, MatchesResponse, Group } from '@/types';
import StandingsTable from './StandingsTable';
import LeagueMatchSchedule from './LeagueMatchSchedule';
import DoubleEliminationBracket from './DoubleEliminationBracket';

interface TeamInfo {
  id: string;
  name: string;
  clubName?: string;
}

export interface MatchManagementProps {
  tournamentId: string;
  isOrganizer?: boolean;
  ageGroupId?: string;
  isRegistrationOpen?: boolean;
  drawCompleted?: boolean;
  matchPeriodType?: 'ONE_HALF' | 'TWO_HALVES';
  halfDurationMinutes?: number;
  halfTimePauseMinutes?: number;
  pauseBetweenMatchesMinutes?: number;
  fieldsCount?: number;
}

type MatchWithTeamNames = BracketMatch & {
  team1DisplayName?: string;
  team2DisplayName?: string;
};

export default function MatchManagement({
  tournamentId,
  isOrganizer = false,
  ageGroupId,
  isRegistrationOpen = false,
  drawCompleted,
  matchPeriodType,
  halfDurationMinutes,
  halfTimePauseMinutes,
  pauseBetweenMatchesMinutes,
  fieldsCount,
}: MatchManagementProps) {
  const { t } = useTranslation();
  const [matchData, setMatchData] = useState<MatchesResponse | null>(null);
  const [teams, setTeams] = useState<Map<string, TeamInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);
  const [schedulingMatchId, setSchedulingMatchId] = useState<string | null>(null);
  const [bulkScheduling, setBulkScheduling] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMatches = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const response = await groupService.getMatches(tournamentId, ageGroupId);
      const data = response?.data || response;
      const matchesData = data as MatchesResponse;
      setMatchData(matchesData);

      // Build teams map
      const teamMap = new Map<string, TeamInfo>();
      if (matchesData?.teams) {
        matchesData.teams.forEach((team) => {
          teamMap.set(team.id, team);
        });
      }
      setTeams(teamMap);

      // Fetch groups in parallel when bracket type requires them — keeps both
      // data sets ready before loading is cleared, preventing a flash of the
      // combined standings table before per-group tables appear.
      const bt = matchesData?.bracketType;
      if (bt === 'GROUPS_PLUS_KNOCKOUT' || bt === 'GROUPS_ONLY') {
        try {
          const groupsRes = await groupService.getGroups(tournamentId, ageGroupId);
          const groupsData = (groupsRes as any)?.data ?? groupsRes ?? [];
          setGroups(Array.isArray(groupsData) ? groupsData : []);
        } catch {
          setGroups([]);
        }
      }
    } catch (err: any) {
      console.error('Failed to load matches:', err);
      setError(
        t('matches.loadError', 'Failed to load matches. Please try again.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tournamentId, ageGroupId, t]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const getTeamName = (teamId?: string): string => {
    if (!teamId) return t('matches.tbd', 'TBD');
    const team = teams.get(teamId);
    return team?.name || team?.clubName || teamId.substring(0, 8) + '...';
  };

  const handleAdvancement = async (
    matchId: string,
    advancingTeamId: string
  ) => {
    try {
      setSavingMatchId(matchId);
      setError(null);
      setSuccessMessage(null);
      await groupService.setMatchAdvancement(tournamentId, matchId, {
        advancingTeamId,
      }, ageGroupId);
      setSuccessMessage(
        t(
          'matches.advancementSuccess',
          'Team advancement updated successfully!'
        )
      );
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to set advancement:', err);
      setError(
        t('matches.advancementError', 'Failed to update advancement.')
      );
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleScoreUpdate = async (
    matchId: string,
    leg1Team1Score: number | null,
    leg1Team2Score: number | null,
    leg2Team1Score: number | null,
    leg2Team2Score: number | null,
    advancingTeamId?: string
  ) => {
    try {
      setSavingMatchId(matchId);
      setError(null);
      setSuccessMessage(null);
      // When leg2 scores are both null it's a single-match context (SE/non-two-legged):
      // send team1Score/team2Score directly instead of leg fields.
      const isSingleMatch = leg2Team1Score === null && leg2Team2Score === null;
      await groupService.updateMatchScore(tournamentId, matchId, isSingleMatch ? {
        team1Score: leg1Team1Score ?? undefined,
        team2Score: leg1Team2Score ?? undefined,
        advancingTeamId,
      } : {
        leg1Team1Score,
        leg1Team2Score,
        leg2Team1Score,
        leg2Team2Score,
        advancingTeamId,
      }, ageGroupId);
      setSuccessMessage(
        t('matches.scoreUpdated', 'Match score updated successfully!')
      );
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update score:', err);
      setError(t('matches.scoreError', 'Failed to update match score.'));
    } finally {
      setSavingMatchId(null);
    }
  };

  // Single-match score update (group stage / league — no legs, direct team1Score/team2Score)
  const handleSingleMatchScoreUpdate = async (
    matchId: string,
    team1Score: number,
    team2Score: number,
    advancingTeamId?: string,
    hasPenalties?: boolean,
    penaltyTeam1Score?: number,
    penaltyTeam2Score?: number
  ) => {
    try {
      setSavingMatchId(matchId);
      setError(null);
      setSuccessMessage(null);
      await groupService.updateMatchScore(tournamentId, matchId, {
        team1Score,
        team2Score,
        advancingTeamId,
        hasPenalties,
        penaltyTeam1Score,
        penaltyTeam2Score,
      }, ageGroupId);
      setSuccessMessage(
        t('matches.scoreUpdated', 'Match score updated successfully!')
      );
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update score:', err);
      setError(t('matches.scoreError', 'Failed to update match score.'));
    } finally {
      setSavingMatchId(null);
    }
  };

  const handleScheduleMatch = async (
    matchId: string,
    scheduledAt: string,
    fieldName?: string
  ) => {
    try {
      setSchedulingMatchId(matchId);
      setError(null);
      setSuccessMessage(null);
      await groupService.scheduleMatch(
        tournamentId,
        matchId,
        { scheduledAt, fieldName },
        ageGroupId
      );
      setSuccessMessage(
        t('matches.scheduleSuccess', 'Match scheduled successfully!')
      );
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to schedule match:', err);
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          t('matches.scheduleError', 'Failed to schedule match.')
      );
    } finally {
      setSchedulingMatchId(null);
    }
  };

  const handleBulkSchedule = async (
    schedules: Array<{ matchId: string; scheduledAt: string; fieldName?: string }>
  ) => {
    setBulkScheduling(true);
    setError(null);
    let successCount = 0;
    for (const s of schedules) {
      try {
        await groupService.scheduleMatch(
          tournamentId,
          s.matchId,
          { scheduledAt: s.scheduledAt, fieldName: s.fieldName },
          ageGroupId
        );
        successCount++;
      } catch (err: any) {
        console.error('Failed to bulk-schedule match:', s.matchId, err);
      }
    }
    setBulkScheduling(false);
    if (successCount > 0) {
      setSuccessMessage(`${successCount} match${successCount !== 1 ? 'es' : ''} scheduled!`);
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleTiebreakerSet = async (groupId: string, order: string[]) => {
    try {
      setError(null);
      await groupService.setGroupTiebreak(tournamentId, groupId, order, ageGroupId);
      // Re-fetch groups (tieBreakOrder updated) and matches (bracket may have been re-seeded)
      await Promise.all([
        groupService.getGroups(tournamentId, ageGroupId).then((res) => {
          const data = (res as any)?.data ?? res ?? [];
          setGroups(Array.isArray(data) ? data : []);
        }),
        fetchMatches(true),
      ]);
      setSuccessMessage(t('matches.tiebreakSaved', 'Tiebreak order saved!'));
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to save tiebreak:', err);
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          t('matches.tiebreakError', 'Failed to save tiebreak order.')
      );
    }
  };

  const handleGenerateBracket = async () => {
    try {
      setGenerating(true);
      setError(null);
      await groupService.generateBracket(tournamentId, ageGroupId);
      setSuccessMessage(
        t(
          'matches.bracketGenerated',
          'Bracket generated successfully!'
        )
      );
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to generate bracket:', err);
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          t('matches.generateError', 'Failed to generate bracket.')
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateKnockout = async () => {
    try {
      setGenerating(true);
      setError(null);
      await groupService.generateKnockoutBracket(tournamentId, ageGroupId);
      setSuccessMessage('Knockout bracket generated successfully!');
      await fetchMatches(true);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to generate knockout bracket:', err);
      setError(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Failed to generate knockout bracket.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return t('matches.status.completed', 'Completed');
      case 'IN_PROGRESS':
        return t('matches.status.inProgress', 'In Progress');
      case 'PENDING':
      default:
        return t('matches.status.pending', 'Pending');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-500">
          {t('common.loading', 'Loading...')}
        </span>
      </div>
    );
  }

  // No bracket data - show generate button
  const hasMatches =
    matchData &&
    (matchData.matches?.length > 0 ||
      (matchData.playoffRounds && matchData.playoffRounds.length > 0));

  if (!hasMatches) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('matches.noMatches', 'No matches yet')}
        </h3>
        <p className="text-gray-500 mb-6">
          {t(
            'matches.noMatchesDesc',
            'Generate a bracket to create match schedules for this tournament.'
          )}
        </p>
        {isOrganizer && (
          <>
            <button
              onClick={handleGenerateBracket}
              disabled={generating || isRegistrationOpen || drawCompleted === false}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#1e3a5f] hover:bg-[#152a45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('matches.generating', 'Generating...')}
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  {t('matches.generateBracket', 'Generate Bracket')}
                </>
              )}
            </button>
          </>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {t('matches.title', 'Match Management')}
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-gray-400">
                <svg className="animate-spin h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                {t('common.updating', 'Updating...')}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500">
            {matchData?.bracketType
              ? t('matches.bracketType', 'Bracket: {{type}}', {
                  type: matchData.bracketType.replace(/_/g, ' '),
                })
              : ''}
          </p>
        </div>
      </div>

      {/* Messages — fixed-position toast to prevent layout shift when notifications disappear */}
      {(error || successMessage) && (
        <div className="fixed top-4 right-4 z-50 w-80 flex flex-col gap-2">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm flex items-center shadow-sm">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm flex items-center shadow-sm">
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}
        </div>
      )}

      {/* Bracket View — format-aware */}
      {(() => {
        const bracketType = matchData?.bracketType;
        // Build a teamNames map for standings/schedule components
        const teamNamesMap = new Map<string, string>(
          [...teams.entries()].map(([id, info]) => [id, info.name])
        );

        // --- DOUBLE ELIMINATION ---
        if (
          bracketType === 'DOUBLE_ELIMINATION' &&
          matchData?.playoffRounds &&
          matchData.playoffRounds.length > 0
        ) {
          return (
            <div className="space-y-4">
              <AutoSchedulePanel
                playoffRounds={matchData.playoffRounds}
                matchPeriodType={matchPeriodType}
                halfDurationMinutes={halfDurationMinutes}
                halfTimePauseMinutes={halfTimePauseMinutes}
                pauseBetweenMatchesMinutes={pauseBetweenMatchesMinutes}
                fieldsCount={fieldsCount}
                isOrganizer={isOrganizer}
                onBulkSchedule={handleBulkSchedule}
                bulkScheduling={bulkScheduling}
              />
              <DoubleEliminationBracket
                playoffRounds={matchData.playoffRounds}
                teamNames={teamNamesMap}
                isOrganizer={isOrganizer}
                twoLegged={true}
                onAdvance={handleAdvancement}
                onScoreUpdate={handleScoreUpdate}
                onSchedule={handleScheduleMatch}
                savingMatchId={savingMatchId}
                schedulingMatchId={schedulingMatchId}
                t={t}
              />
            </div>
          );
        }

        // --- ROUND ROBIN: standings + flat match list ---
        if (bracketType === 'ROUND_ROBIN') {
          const allMatches = matchData?.matches ?? [];
          return (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Standings</h4>
                <StandingsTable matches={allMatches} teamNames={teamNamesMap} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Match Schedule</h4>
                <LeagueMatchSchedule
                  matches={allMatches}
                  teamNames={teamNamesMap}
                  isOrganizer={isOrganizer}
                  onScoreUpdate={handleSingleMatchScoreUpdate}
                  onSchedule={handleScheduleMatch}
                  savingMatchId={savingMatchId}
                  schedulingMatchId={schedulingMatchId}
                  matchPeriodType={matchPeriodType}
                  halfDurationMinutes={halfDurationMinutes}
                  halfTimePauseMinutes={halfTimePauseMinutes}
                  fieldsCount={fieldsCount}
                  pauseBetweenMatchesMinutes={pauseBetweenMatchesMinutes}
                  onBulkSchedule={handleBulkSchedule}
                  bulkScheduling={bulkScheduling}
                />
              </div>
            </div>
          );
        }

        // --- LEAGUE: standings + schedule ---
        if (bracketType === 'LEAGUE') {
          const allMatches = matchData?.matches ?? [];
          return (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">League Standings</h4>
                <StandingsTable matches={allMatches} teamNames={teamNamesMap} />
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Match Schedule</h4>
                <LeagueMatchSchedule
                  matches={allMatches}
                  teamNames={teamNamesMap}
                  isOrganizer={isOrganizer}
                  onScoreUpdate={handleSingleMatchScoreUpdate}
                  onSchedule={handleScheduleMatch}
                  savingMatchId={savingMatchId}
                  schedulingMatchId={schedulingMatchId}
                  matchPeriodType={matchPeriodType}
                  halfDurationMinutes={halfDurationMinutes}
                  halfTimePauseMinutes={halfTimePauseMinutes}
                  fieldsCount={fieldsCount}
                  pauseBetweenMatchesMinutes={pauseBetweenMatchesMinutes}
                  onBulkSchedule={handleBulkSchedule}
                  bulkScheduling={bulkScheduling}
                />
              </div>
            </div>
          );
        }

        // --- GROUPS PLUS KNOCKOUT: per-group standings + knockout bracket ---
        if (bracketType === 'GROUPS_PLUS_KNOCKOUT' || bracketType === 'GROUPS_ONLY') {
          const allMatches = matchData?.matches ?? [];
          const playoffRounds = matchData?.playoffRounds ?? [];

          // Build per-group match sections when group assignments are available
          const sortedGroups = [...groups].sort((a, b) =>
            a.groupLetter.localeCompare(b.groupLetter)
          );

          const groupPhaseSection = sortedGroups.length > 0 ? (
            sortedGroups.map((group) => {
              const groupMatches = allMatches.filter(
                (m) => m.groupLetter === group.groupLetter
              );
              // Build a team-names map scoped to this group only
              // group.teams is string[] of registration IDs at runtime
              const groupTeamIds = new Set<string>(
                Array.isArray(group.teams)
                  ? group.teams.map((t: any) => (typeof t === 'string' ? t : t?.registrationId ?? t?.id ?? ''))
                  : []
              );
              const groupTeamNames = new Map<string, string>();
              for (const [id, name] of teamNamesMap.entries()) {
                if (groupTeamIds.has(id)) {
                  groupTeamNames.set(id, name);
                }
              }
              // Also include any teams found in matches for this group (fallback)
              for (const m of groupMatches) {
                if (m.team1Id && !groupTeamNames.has(m.team1Id)) {
                  groupTeamNames.set(m.team1Id, teamNamesMap.get(m.team1Id) || m.team1Name || m.team1Id.slice(0, 8));
                }
                if (m.team2Id && !groupTeamNames.has(m.team2Id)) {
                  groupTeamNames.set(m.team2Id, teamNamesMap.get(m.team2Id) || m.team2Name || m.team2Id.slice(0, 8));
                }
              }
              return (
                <div key={group.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Group header */}
                  <div className="px-4 py-3 border-b border-gray-100" style={{ background: '#f0f7ff' }}>
                    <h4 className="text-sm font-bold" style={{ color: '#1e3a5f' }}>
                      Group {group.groupLetter}
                    </h4>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Standings table for this group */}
                    <StandingsTable
                      matches={groupMatches}
                      teamNames={groupTeamNames}
                      highlightTopN={matchData?.advancingTeamsPerGroup ?? 2}
                      canEdit={isOrganizer}
                      tiebreakOrder={group.tieBreakOrder ?? undefined}
                      onTiebreakerSet={(order) => handleTiebreakerSet(group.id, order)}
                    />
                    {/* Matches for this group */}
                    {groupMatches.length > 0 && (
                      <div className="border-t border-gray-100 pt-4">
                        <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                          Matches
                        </h5>
                        <LeagueMatchSchedule
                          matches={groupMatches}
                          teamNames={teamNamesMap}
                          isOrganizer={isOrganizer}
                          onScoreUpdate={handleSingleMatchScoreUpdate}
                          onSchedule={handleScheduleMatch}
                          savingMatchId={savingMatchId}
                          schedulingMatchId={schedulingMatchId}
                          matchPeriodType={matchPeriodType}
                          halfDurationMinutes={halfDurationMinutes}
                          halfTimePauseMinutes={halfTimePauseMinutes}
                          fieldsCount={fieldsCount}
                          pauseBetweenMatchesMinutes={pauseBetweenMatchesMinutes}
                          onBulkSchedule={handleBulkSchedule}
                          bulkScheduling={bulkScheduling}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            // Fallback: combined view when group assignments not yet available
            allMatches.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Group Standings</h4>
                <StandingsTable matches={allMatches} teamNames={teamNamesMap} />
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <h5 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Group Matches</h5>
                  <LeagueMatchSchedule
                    matches={allMatches}
                    teamNames={teamNamesMap}
                    isOrganizer={isOrganizer}
                    onScoreUpdate={handleSingleMatchScoreUpdate}
                    onSchedule={handleScheduleMatch}
                    savingMatchId={savingMatchId}
                    schedulingMatchId={schedulingMatchId}
                    matchPeriodType={matchPeriodType}
                    halfDurationMinutes={halfDurationMinutes}
                    halfTimePauseMinutes={halfTimePauseMinutes}
                    fieldsCount={fieldsCount}
                    pauseBetweenMatchesMinutes={pauseBetweenMatchesMinutes}
                    onBulkSchedule={handleBulkSchedule}
                    bulkScheduling={bulkScheduling}
                  />
                </div>
              </div>
            )
          );

          const allGroupMatchesCompleted =
            allMatches.length > 0 &&
            allMatches.every((m) => m.status === 'COMPLETED');
          const completedCount = allMatches.filter(
            (m) => m.status === 'COMPLETED'
          ).length;

          return (
            <div className="space-y-6">
              {/* Group phase — one card per group */}
              {groupPhaseSection}
              {/* Knockout stage */}
              {bracketType === 'GROUPS_PLUS_KNOCKOUT' && (
                <>
                  {playoffRounds.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Knockout Stage</h4>
                      <DoubleEliminationBracket
                        playoffRounds={playoffRounds}
                        teamNames={teamNamesMap}
                        isOrganizer={isOrganizer}
                        twoLegged={false}
                        onAdvance={handleAdvancement}
                        onScoreUpdate={handleScoreUpdate}
                        onSchedule={handleScheduleMatch}
                        savingMatchId={savingMatchId}
                        schedulingMatchId={schedulingMatchId}
                        t={t}
                      />
                    </div>
                  ) : (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                      <svg
                        className="w-12 h-12 mx-auto text-gray-400 mb-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Knockout Stage
                      </h4>
                      {allMatches.length === 0 ? (
                        <p className="text-sm text-gray-500 mb-4">
                          Generate group matches first to unlock the knockout stage.
                        </p>
                      ) : !allGroupMatchesCompleted ? (
                        <p className="text-sm text-gray-500 mb-4">
                          Complete all group stage matches before generating the knockout bracket.
                          <span className="block mt-1 text-xs text-gray-400">
                            {completedCount} / {allMatches.length} matches completed
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 mb-4">
                          All group matches are completed. Generate the knockout bracket to continue.
                        </p>
                      )}
                      {isOrganizer && allMatches.length > 0 && (
                        <button
                          onClick={handleGenerateKnockout}
                          disabled={generating || !allGroupMatchesCompleted}
                          className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#1e3a5f] hover:bg-[#152a45] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e3a5f] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generating ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                />
                              </svg>
                              Generate Knockout Bracket
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        }

        // --- SINGLE_ELIMINATION (default) + any unrecognised type ---
        if (matchData?.playoffRounds && matchData.playoffRounds.length > 0) {
          return (
            <div className="space-y-4">
              <AutoSchedulePanel
                playoffRounds={matchData.playoffRounds}
                matchPeriodType={matchPeriodType}
                halfDurationMinutes={halfDurationMinutes}
                halfTimePauseMinutes={halfTimePauseMinutes}
                pauseBetweenMatchesMinutes={pauseBetweenMatchesMinutes}
                fieldsCount={fieldsCount}
                isOrganizer={isOrganizer}
                onBulkSchedule={handleBulkSchedule}
                bulkScheduling={bulkScheduling}
              />
              <DoubleEliminationBracket
                playoffRounds={matchData.playoffRounds}
                teamNames={teamNamesMap}
                isOrganizer={isOrganizer}
                twoLegged={false}
                onAdvance={handleAdvancement}
                onScoreUpdate={handleScoreUpdate}
                onSchedule={handleScheduleMatch}
                savingMatchId={savingMatchId}
                schedulingMatchId={schedulingMatchId}
                t={t}
              />
            </div>
          );
        }

        // Flat match list fallback
        return (
          <div className="space-y-4">
            {matchData?.matches?.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                getTeamName={getTeamName}
                isOrganizer={isOrganizer}
                onAdvance={handleAdvancement}
                onScoreUpdate={handleSingleMatchScoreUpdate}
                onSchedule={handleScheduleMatch}
                savingMatchId={savingMatchId}
                schedulingMatchId={schedulingMatchId}
                matchPeriodType={matchPeriodType}
                halfDurationMinutes={halfDurationMinutes}
                halfTimePauseMinutes={halfTimePauseMinutes}
                t={t}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// Round Section Component
function RoundSection({
  round,
  getTeamName,
  isOrganizer,
  onAdvance,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
  matchPeriodType,
  halfDurationMinutes,
  halfTimePauseMinutes,
  t,
}: {
  round: PlayoffRound;
  getTeamName: (id?: string) => string;
  isOrganizer: boolean;
  onAdvance: (matchId: string, teamId: string) => Promise<void>;
  onScoreUpdate: (
    matchId: string,
    s1: number,
    s2: number,
    advancingTeamId?: string,
    hasPenalties?: boolean,
    penaltyTeam1Score?: number,
    penaltyTeam2Score?: number
  ) => Promise<void>;
  onSchedule: (matchId: string, scheduledAt: string, fieldName?: string) => Promise<void>;
  savingMatchId: string | null;
  schedulingMatchId: string | null;
  matchPeriodType?: 'ONE_HALF' | 'TWO_HALVES';
  halfDurationMinutes?: number;
  halfTimePauseMinutes?: number;
  t: any;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h4 className="text-md font-semibold text-gray-800">
          {round.roundName}
        </h4>
        <span className="text-xs text-gray-400">
          {round.matches.length}{' '}
          {round.matches.length === 1
            ? t('matches.match', 'match')
            : t('matches.matchesPlural', 'matches')}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {round.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            getTeamName={getTeamName}
            isOrganizer={isOrganizer}
            onAdvance={onAdvance}
            onScoreUpdate={onScoreUpdate}
            onSchedule={onSchedule}
            savingMatchId={savingMatchId}
            schedulingMatchId={schedulingMatchId}
            matchPeriodType={matchPeriodType}
            halfDurationMinutes={halfDurationMinutes}
            halfTimePauseMinutes={halfTimePauseMinutes}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Match Card Component
function MatchCard({
  match,
  getTeamName,
  isOrganizer,
  onAdvance,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
  matchPeriodType,
  halfDurationMinutes,
  halfTimePauseMinutes,
  t,
}: {
  match: BracketMatch;
  getTeamName: (id?: string) => string;
  isOrganizer: boolean;
  onAdvance: (matchId: string, teamId: string) => Promise<void>;
  onScoreUpdate: (
    matchId: string,
    s1: number,
    s2: number,
    advancingTeamId?: string,
    hasPenalties?: boolean,
    penaltyTeam1Score?: number,
    penaltyTeam2Score?: number
  ) => Promise<void>;
  onSchedule: (matchId: string, scheduledAt: string, fieldName?: string) => Promise<void>;
  savingMatchId: string | null;
  schedulingMatchId: string | null;
  matchPeriodType?: 'ONE_HALF' | 'TWO_HALVES';
  halfDurationMinutes?: number;
  halfTimePauseMinutes?: number;
  t: any;
}) {
  const [editMode, setEditMode] = useState(false);
  const [score1, setScore1] = useState<string>(
    match.team1Score?.toString() ?? ''
  );
  const [score2, setScore2] = useState<string>(
    match.team2Score?.toString() ?? ''
  );
  const [selectedWinner, setSelectedWinner] = useState<string>(
    match.manualWinnerId || match.winnerId || ''
  );
  const [hasPenalties, setHasPenalties] = useState<boolean>(match.hasPenalties ?? false);
  const [penaltyScore1, setPenaltyScore1] = useState<string>(
    match.penaltyTeam1Score?.toString() ?? ''
  );
  const [penaltyScore2, setPenaltyScore2] = useState<string>(
    match.penaltyTeam2Score?.toString() ?? ''
  );
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAtInput, setScheduledAtInput] = useState<string>(() => {
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}T${String(n.getHours()).padStart(2,'00')}:00`;
  });
  const [fieldNameInput, setFieldNameInput] = useState<string>(
    match.fieldName ?? ''
  );

  // Sync inputs when match data changes externally (e.g. after auto-schedule or refetch),
  // but only when the user is not actively editing.
  useEffect(() => {
    if (scheduleMode) return;
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      setScheduledAtInput(
        `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
      );
    }
    setFieldNameInput(match.fieldName ?? '');
  }, [match.scheduledAt, match.fieldName, scheduleMode]);

  const isSaving = savingMatchId === match.id;
  const isScheduling = schedulingMatchId === match.id;
  const team1Name = match.team1Name || getTeamName(match.team1Id);
  const team2Name = match.team2Name || getTeamName(match.team2Id);
  const isTeam1Winner = match.winnerId === match.team1Id;
  const isTeam2Winner = match.winnerId === match.team2Id;
  const hasBothTeams = !!match.team1Id && !!match.team2Id;
  // Consider tied both during and after a completed match with equal scores
  const isTied =
    match.team1Score !== undefined &&
    match.team2Score !== undefined &&
    match.team1Score === match.team2Score;

  const handleSaveScore = async () => {
    const s1 = parseInt(score1) || 0;
    const s2 = parseInt(score2) || 0;
    const isTiedEdit = s1 === s2;
    const p1 = hasPenalties && isTiedEdit ? (parseInt(penaltyScore1) || 0) : undefined;
    const p2 = hasPenalties && isTiedEdit ? (parseInt(penaltyScore2) || 0) : undefined;
    await onScoreUpdate(
      match.id,
      s1,
      s2,
      isTiedEdit && !hasPenalties ? selectedWinner || undefined : undefined,
      hasPenalties && isTiedEdit ? true : undefined,
      p1,
      p2
    );
    setEditMode(false);
  };

  const handleSaveSchedule = async () => {
    if (!scheduledAtInput) return;
    await onSchedule(match.id, new Date(scheduledAtInput).toISOString(), fieldNameInput || undefined);
    setScheduleMode(false);
  };

  // Compute end time based on match duration settings
  const computedEndTime = (() => {
    const startIso = scheduleMode ? scheduledAtInput : match.scheduledAt;
    if (!startIso || !halfDurationMinutes) return null;
    const periods = matchPeriodType === 'ONE_HALF' ? 1 : 2;
    const totalMinutes = periods * halfDurationMinutes + (periods - 1) * (halfTimePauseMinutes ?? 0);
    const endMs = new Date(startIso).getTime() + totalMinutes * 60000;
    const d = new Date(endMs);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  })();

  const handleDirectAdvance = async (teamId: string) => {
    if (!isOrganizer || isSaving) return;
    await onAdvance(match.id, teamId);
  };

  const statusBadgeClass =
    match.status === 'COMPLETED'
      ? 'bg-green-100 text-green-800'
      : match.status === 'IN_PROGRESS'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-gray-100 text-gray-800';

  const statusLabel =
    match.status === 'COMPLETED'
      ? t('matches.status.completed', 'Completed')
      : match.status === 'IN_PROGRESS'
      ? t('matches.status.inProgress', 'In Progress')
      : t('matches.status.pending', 'Pending');

  return (
    <div
      className={`bg-white rounded-xl border-2 transition-all ${
        match.isManualOverride
          ? 'border-amber-300 shadow-amber-100'
          : match.status === 'COMPLETED'
          ? 'border-green-200'
          : 'border-gray-200'
      } shadow-sm hover:shadow-md`}
    >
      {/* Match Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-t-xl border-b">
        <span className="text-xs font-medium text-gray-500">
          {t('matches.matchLabel', 'Match')} #{match.matchNumber}
        </span>
        <div className="flex items-center gap-2">
          {match.isManualOverride && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('matches.manualOverride', 'Manual')}
            </span>
          )}
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Teams */}
      <div className="p-4 space-y-3">
        {/* Team 1 */}
        <TeamRow
          teamId={match.team1Id}
          teamName={team1Name}
          score={match.team1Score}
          isWinner={isTeam1Winner}
          isManualOverride={match.isManualOverride}
          canAdvance={
            isOrganizer && hasBothTeams && !isSaving && isTied && match.status !== 'COMPLETED'
          }
          onAdvance={() =>
            match.team1Id && handleDirectAdvance(match.team1Id)
          }
          isSaving={isSaving}
          t={t}
        />

        {/* VS Divider */}
        <div className="flex items-center px-2">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-xs font-medium text-gray-400">VS</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        {/* Team 2 */}
        <TeamRow
          teamId={match.team2Id}
          teamName={team2Name}
          score={match.team2Score}
          isWinner={isTeam2Winner}
          isManualOverride={match.isManualOverride}
          canAdvance={
            isOrganizer && hasBothTeams && !isSaving && isTied && match.status !== 'COMPLETED'
          }
          onAdvance={() =>
            match.team2Id && handleDirectAdvance(match.team2Id)
          }
          isSaving={isSaving}
          t={t}
        />

        {/* Tied indication: show when scores are tied and match not complete */}
        {isTied && !match.isManualOverride && isOrganizer && match.status !== 'COMPLETED' && (
          <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700 font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {t(
                'matches.tiedMessage',
                'Scores are tied! Click a team name above to manually select the advancing team.'
              )}
            </p>
          </div>
        )}

        {/* Score Edit (organizer only, only when both teams placed) */}
        {isOrganizer && hasBothTeams && (
          <div className="pt-2 border-t border-gray-100">
            {editMode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      {team1Name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={score1}
                      onChange={(e) => setScore1(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <span className="text-gray-400 font-medium pt-5">-</span>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      {team2Name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={score2}
                      onChange={(e) => setScore2(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* If scores are tied, show penalty option or winner selection */}
                {score1 !== '' &&
                  score2 !== '' &&
                  parseInt(score1) === parseInt(score2) && (
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
                      {/* Penalty checkbox */}
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={hasPenalties}
                          onChange={(e) => {
                            setHasPenalties(e.target.checked);
                            if (!e.target.checked) {
                              setPenaltyScore1('');
                              setPenaltyScore2('');
                            }
                          }}
                          className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-400"
                        />
                        <span className="text-xs font-medium text-amber-800">Decided by penalty shootout</span>
                      </label>

                      {hasPenalties ? (
                        /* Penalty score inputs */
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">{team1Name} (pen)</label>
                            <input
                              type="number"
                              min="0"
                              value={penaltyScore1}
                              onChange={(e) => setPenaltyScore1(e.target.value)}
                              className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-amber-400"
                              placeholder="0"
                            />
                          </div>
                          <span className="text-gray-400 font-medium pt-5">-</span>
                          <div className="flex-1">
                            <label className="text-xs text-gray-500 mb-1 block">{team2Name} (pen)</label>
                            <input
                              type="number"
                              min="0"
                              value={penaltyScore2}
                              onChange={(e) => setPenaltyScore2(e.target.value)}
                              className="w-full px-2 py-1.5 border border-amber-300 rounded-lg text-center text-sm focus:ring-2 focus:ring-amber-400"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ) : (
                        /* Manual winner selection (no penalties) */
                        <>
                          <label className="text-xs font-medium text-amber-800 block">
                            {t(
                              'matches.selectWinner',
                              'Scores are tied - Select advancing team:'
                            )}
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedWinner(match.team1Id || '')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedWinner === match.team1Id
                                  ? 'bg-[#1e3a5f] text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {team1Name}
                            </button>
                            <button
                              onClick={() => setSelectedWinner(match.team2Id || '')}
                              className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                selectedWinner === match.team2Id
                                  ? 'bg-[#1e3a5f] text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {team2Name}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSaveScore}
                    disabled={isSaving}
                    className="px-4 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#152a45] transition-colors disabled:opacity-50"
                  >
                    {isSaving
                      ? t('common.saving', 'Saving...')
                      : t('matches.saveScore', 'Save Score')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="w-full px-3 py-2 text-xs text-[#1e3a5f] hover:text-[#152a45] hover:bg-[#dbeafe] rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {match.team1Score !== undefined
                  ? t('matches.editScore', 'Edit Score')
                  : t('matches.enterScore', 'Enter Score')}
              </button>
            )}
          </div>
        )}

        {/* Schedule Info (always visible when set) */}
        {(match.scheduledAt || match.fieldName) && !scheduleMode && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {match.scheduledAt && (
                <span>
                  {formatDateTime(match.scheduledAt)}
                  {computedEndTime && (
                    <span className="text-gray-400"> → {computedEndTime}</span>
                  )}
                </span>
              )}
              {match.fieldName && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#e0f7ff] text-[#0090c7] rounded text-xs font-medium">
                  {formatFieldDisplay(match.fieldName)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Schedule Editor (organizer only) */}
        {isOrganizer && (
          <div className="pt-2 border-t border-gray-100">
            {scheduleMode ? (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {t('matches.scheduledAt', 'Date & Time')}
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAtInput}
                    onChange={(e) => setScheduledAtInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {computedEndTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t('matches.estimatedEnd', 'Estimated end')}: <span className="font-medium text-gray-600">{computedEndTime}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    {t('matches.fieldName', 'Football Field')} ({t('common.optional', 'optional')})
                  </label>
                  <input
                    type="text"
                    value={fieldNameInput}
                    onChange={(e) => setFieldNameInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Pitch 1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setScheduleMode(false)}
                    className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    disabled={isScheduling || !scheduledAtInput}
                    className="px-4 py-1.5 bg-[#1e3a5f] text-white rounded-lg text-xs font-medium hover:bg-[#152a45] transition-colors disabled:opacity-50"
                  >
                    {isScheduling
                      ? t('common.saving', 'Saving...')
                      : t('matches.saveSchedule', 'Save Schedule')}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setScheduleMode(true)}
                className="w-full px-3 py-2 text-xs text-[#0090c7] hover:text-[#1e3a5f] hover:bg-[#e0f7ff] rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {match.scheduledAt
                  ? t('matches.editSchedule', 'Edit Schedule')
                  : t('matches.setSchedule', 'Schedule Match')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Team Row inside Match Card
function TeamRow({
  teamId,
  teamName,
  score,
  isWinner,
  isManualOverride,
  canAdvance,
  onAdvance,
  isSaving,
  t,
}: {
  teamId?: string;
  teamName: string;
  score?: number;
  isWinner: boolean;
  isManualOverride?: boolean;
  canAdvance: boolean;
  onAdvance: () => void;
  isSaving: boolean;
  t: any;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
        isWinner
          ? isManualOverride
            ? 'bg-amber-50 border border-amber-200'
            : 'bg-green-50 border border-green-200'
          : 'bg-gray-50 border border-transparent'
      } ${canAdvance ? 'cursor-pointer hover:bg-[#dbeafe] hover:border-blue-200' : ''}`}
      onClick={canAdvance ? onAdvance : undefined}
      title={
        canAdvance
          ? t('matches.clickToAdvance', 'Click to advance this team')
          : undefined
      }
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* Team indicator */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isWinner
              ? isManualOverride
                ? 'bg-amber-500'
                : 'bg-green-500'
              : teamId
              ? 'bg-gray-300'
              : 'bg-gray-200'
          }`}
        />
        <span
          className={`text-sm font-medium truncate ${
            isWinner ? 'text-gray-900' : teamId ? 'text-gray-700' : 'text-gray-400 italic'
          }`}
        >
          {teamName}
        </span>
        {isWinner && (
          <span className="flex-shrink-0">
            {isManualOverride ? (
              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </span>
        )}
        {isSaving && (
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600 flex-shrink-0"></div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {score !== undefined && (
          <span
            className={`text-lg font-bold tabular-nums ${
              isWinner ? 'text-gray-900' : 'text-gray-500'
            }`}
          >
            {score}
          </span>
        )}
        {canAdvance && !isWinner && (
          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Auto Schedule Panel (for DE / SE / knockout phases) ──────────────────────
const HH_OPTS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MM_OPTS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function AutoSchedulePanel({
  playoffRounds,
  matchPeriodType,
  halfDurationMinutes,
  halfTimePauseMinutes,
  pauseBetweenMatchesMinutes,
  fieldsCount,
  isOrganizer,
  onBulkSchedule,
  bulkScheduling,
}: {
  playoffRounds: PlayoffRound[];
  matchPeriodType?: 'ONE_HALF' | 'TWO_HALVES';
  halfDurationMinutes?: number;
  halfTimePauseMinutes?: number;
  pauseBetweenMatchesMinutes?: number;
  fieldsCount?: number;
  isOrganizer: boolean;
  onBulkSchedule: (schedules: Array<{ matchId: string; scheduledAt: string; fieldName?: string }>) => void;
  bulkScheduling: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [hh, setHH] = useState('10');
  const [mm, setMM] = useState('00');

  if (!isOrganizer) return null;

  const periods = matchPeriodType === 'ONE_HALF' ? 1 : 2;
  const matchDuration = periods * (halfDurationMinutes ?? 0) + (periods - 1) * (halfTimePauseMinutes ?? 0);
  const slotMinutes = matchDuration + (pauseBetweenMatchesMinutes ?? 0);
  const fields = (fieldsCount && fieldsCount > 0) ? fieldsCount : 1;

  function openModal() {
    const now = new Date();
    setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    setHH('10');
    setMM('00');
    setOpen(true);
  }

  function apply() {
    if (!date) return;
    const startMs = new Date(`${date}T${hh}:${mm}:00`).getTime();
    const schedules: Array<{ matchId: string; scheduledAt: string; fieldName?: string }> = [];
    let slotIndex = 0;
    for (const round of playoffRounds) {
      const roundMatches = round.matches;
      const numBatches = Math.ceil(roundMatches.length / fields);
      for (let b = 0; b < numBatches; b++) {
        const batch = roundMatches.slice(b * fields, (b + 1) * fields);
        const slotMs = startMs + slotIndex * slotMinutes * 60000;
        batch.forEach((m, fi) => {
          schedules.push({
            matchId: m.id,
            scheduledAt: new Date(slotMs).toISOString(),
            fieldName: String(fi + 1),
          });
        });
        slotIndex++;
      }
    }
    onBulkSchedule(schedules);
    setOpen(false);
  }

  const round2Time = (() => {
    if (!slotMinutes) return null;
    const d = new Date(`2000-01-01T${hh}:${mm}:00`);
    d.setMinutes(d.getMinutes() + slotMinutes);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  })();

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={openModal}
          disabled={bulkScheduling}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#1e3a5f] text-white hover:bg-[#152a45] transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {bulkScheduling ? (
            <>
              <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Scheduling…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Auto Schedule
            </>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Auto Schedule Matches</h3>
              <p className="text-xs text-gray-500 mt-1">
                All matches will be scheduled sequentially. With <strong>{fields}</strong> field{fields > 1 ? 's' : ''}, each slot is <strong>{slotMinutes} min</strong> ({matchDuration} min match + {pauseBetweenMatchesMinutes ?? 0} min pause).
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                <div className="flex items-center gap-2">
                  <select value={hh} onChange={(e) => setHH(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    {HH_OPTS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-gray-400 font-bold text-lg">:</span>
                  <select value={mm} onChange={(e) => setMM(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
                    {MM_OPTS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 space-y-1">
                <div>Round 1 → <strong>{hh}:{mm}</strong></div>
                {round2Time && <div>Round 2 → <strong>{round2Time}</strong></div>}
                <div className="text-blue-500">Field names will be set to 1, 2, … {fields}</div>
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">
                Cancel
              </button>
              <button
                onClick={apply}
                disabled={!date || slotMinutes === 0}
                className="px-4 py-1.5 text-sm font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#152a45] transition-colors disabled:opacity-50"
              >
                Apply to All Matches
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
