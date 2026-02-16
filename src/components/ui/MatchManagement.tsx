'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { groupService } from '@/services';
import type { BracketMatch, PlayoffRound, MatchesResponse } from '@/types';

interface TeamInfo {
  id: string;
  name: string;
  clubName?: string;
}

export interface MatchManagementProps {
  tournamentId: string;
  isOrganizer?: boolean;
  ageGroupId?: string;
}

type MatchWithTeamNames = BracketMatch & {
  team1DisplayName?: string;
  team2DisplayName?: string;
};

export default function MatchManagement({
  tournamentId,
  isOrganizer = false,
  ageGroupId,
}: MatchManagementProps) {
  const { t } = useTranslation();
  const [matchData, setMatchData] = useState<MatchesResponse | null>(null);
  const [teams, setTeams] = useState<Map<string, TeamInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingMatchId, setSavingMatchId] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await groupService.getMatches(tournamentId, ageGroupId);
      const data = response?.data || response;
      setMatchData(data as MatchesResponse);

      // Build teams map
      const teamMap = new Map<string, TeamInfo>();
      if ((data as MatchesResponse)?.teams) {
        (data as MatchesResponse).teams.forEach((team) => {
          teamMap.set(team.id, team);
        });
      }
      setTeams(teamMap);
    } catch (err: any) {
      console.error('Failed to load matches:', err);
      setError(
        t('matches.loadError', 'Failed to load matches. Please try again.')
      );
    } finally {
      setLoading(false);
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
      await fetchMatches();
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
    team1Score: number,
    team2Score: number,
    advancingTeamId?: string
  ) => {
    try {
      setSavingMatchId(matchId);
      setError(null);
      setSuccessMessage(null);
      await groupService.updateMatchScore(tournamentId, matchId, {
        team1Score,
        team2Score,
        advancingTeamId,
      }, ageGroupId);
      setSuccessMessage(
        t('matches.scoreUpdated', 'Match score updated successfully!')
      );
      await fetchMatches();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update score:', err);
      setError(t('matches.scoreError', 'Failed to update match score.'));
    } finally {
      setSavingMatchId(null);
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
      await fetchMatches();
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
          <button
            onClick={handleGenerateBracket}
            disabled={generating}
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <h3 className="text-lg font-semibold text-gray-900">
            {t('matches.title', 'Match Management')}
          </h3>
          <p className="text-sm text-gray-500">
            {matchData?.bracketType
              ? t('matches.bracketType', 'Bracket: {{type}}', {
                  type: matchData.bracketType.replace(/_/g, ' '),
                })
              : ''}
          </p>
        </div>
        {isOrganizer && (
          <div className="flex items-center gap-2">
            <span className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
              </svg>
              {t('matches.manualOverrideHint', 'Click a team name to manually advance them')}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Bracket View */}
      {matchData?.playoffRounds && matchData.playoffRounds.length > 0 ? (
        <div className="space-y-8">
          {matchData.playoffRounds.map((round, idx) => (
            <RoundSection
              key={`${round.roundNumber}-${round.roundName || idx}`}
              round={round}
              getTeamName={getTeamName}
              isOrganizer={isOrganizer}
              onAdvance={handleAdvancement}
              onScoreUpdate={handleScoreUpdate}
              savingMatchId={savingMatchId}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {matchData?.matches?.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              getTeamName={getTeamName}
              isOrganizer={isOrganizer}
              onAdvance={handleAdvancement}
              onScoreUpdate={handleScoreUpdate}
              savingMatchId={savingMatchId}
              t={t}
            />
          ))}
        </div>
      )}
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
  savingMatchId,
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
    advancingTeamId?: string
  ) => Promise<void>;
  savingMatchId: string | null;
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
            savingMatchId={savingMatchId}
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
  savingMatchId,
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
    advancingTeamId?: string
  ) => Promise<void>;
  savingMatchId: string | null;
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

  const isSaving = savingMatchId === match.id;
  const team1Name = match.team1Name || getTeamName(match.team1Id);
  const team2Name = match.team2Name || getTeamName(match.team2Id);
  const isTeam1Winner = match.winnerId === match.team1Id;
  const isTeam2Winner = match.winnerId === match.team2Id;
  const isTied =
    match.team1Score !== undefined &&
    match.team2Score !== undefined &&
    match.team1Score === match.team2Score &&
    match.status === 'COMPLETED';

  const handleSaveScore = async () => {
    const s1 = parseInt(score1) || 0;
    const s2 = parseInt(score2) || 0;
    await onScoreUpdate(
      match.id,
      s1,
      s2,
      s1 === s2 ? selectedWinner || undefined : undefined
    );
    setEditMode(false);
  };

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
            isOrganizer && !!match.team1Id && !!match.team2Id && !isSaving
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
            isOrganizer && !!match.team1Id && !!match.team2Id && !isSaving
          }
          onAdvance={() =>
            match.team2Id && handleDirectAdvance(match.team2Id)
          }
          isSaving={isSaving}
          t={t}
        />

        {/* Tied indication */}
        {isTied && !match.isManualOverride && isOrganizer && (
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

        {/* Score Edit (organizer only) */}
        {isOrganizer && match.team1Id && match.team2Id && (
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

                {/* If scores are tied, show winner selection */}
                {score1 !== '' &&
                  score2 !== '' &&
                  parseInt(score1) === parseInt(score2) && (
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                      <label className="text-xs font-medium text-amber-800 block mb-2">
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
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {team1Name}
                        </button>
                        <button
                          onClick={() => setSelectedWinner(match.team2Id || '')}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            selectedWinner === match.team2Id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {team2Name}
                        </button>
                      </div>
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
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
                className="w-full px-3 py-2 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors font-medium flex items-center justify-center gap-1"
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
      } ${canAdvance ? 'cursor-pointer hover:bg-indigo-50 hover:border-indigo-200' : ''}`}
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
