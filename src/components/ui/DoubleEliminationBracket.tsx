'use client';

import type { BracketMatch, PlayoffRound } from '@/types';
import { formatDateTime } from '@/utils/date';

export interface DoubleEliminationBracketProps {
  playoffRounds: PlayoffRound[];
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onAdvance?: (matchId: string, teamId: string) => void;
  onScoreUpdate?: (matchId: string, t1: number, t2: number) => void;
  onSchedule?: (matchId: string, scheduledAt: string, courtNumber?: number) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t?: (key: string, fallback: string, vars?: any) => string;
}

function resolveTeamName(
  id: string | undefined,
  teamNames?: Map<string, string> | Record<string, string>
): string {
  if (!id) return 'TBD';
  if (!teamNames) return id.slice(0, 8);
  if (teamNames instanceof Map) return teamNames.get(id) ?? id.slice(0, 8);
  return (teamNames as Record<string, string>)[id] ?? id.slice(0, 8);
}

const STATUS_CLS: Record<BracketMatch['status'], string> = {
  PENDING: 'bg-gray-50 border-gray-200',
  IN_PROGRESS: 'bg-yellow-50 border-yellow-300',
  COMPLETED: 'bg-white border-gray-200',
};

interface BracketMatchCardProps {
  match: BracketMatch;
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onAdvance?: (matchId: string, teamId: string) => void;
  onScoreUpdate?: (matchId: string, t1: number, t2: number) => void;
  onSchedule?: (matchId: string, scheduledAt: string, courtNumber?: number) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
}

function DEMatchCard({
  match,
  teamNames,
  isOrganizer,
  onAdvance,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
}: BracketMatchCardProps) {
  const t1Name = resolveTeamName(match.team1Id, teamNames);
  const t2Name = resolveTeamName(match.team2Id, teamNames);
  const isSaving = savingMatchId === match.id;
  const isScheduling = schedulingMatchId === match.id;
  const hasScore = match.team1Score != null && match.team2Score != null;
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div
      className={`border rounded-lg p-2 text-xs min-w-[160px] ${STATUS_CLS[match.status]}`}
    >
      {/* Team 1 */}
      <div
        className={`flex items-center justify-between gap-1 py-1 px-1 rounded ${
          isCompleted && match.winnerId === match.team1Id
            ? 'font-bold text-green-700 bg-green-50'
            : 'text-gray-700'
        } ${isOrganizer && match.team1Id && !isCompleted ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
        title={isOrganizer && !isCompleted ? 'Click to advance' : undefined}
        onClick={() => {
          if (isOrganizer && match.team1Id && !isCompleted && onAdvance) {
            onAdvance(match.id, match.team1Id);
          }
        }}
      >
        <span className="truncate">{t1Name}</span>
        {hasScore && (
          <span className="font-semibold flex-shrink-0">{match.team1Score}</span>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-0.5" />

      {/* Team 2 */}
      <div
        className={`flex items-center justify-between gap-1 py-1 px-1 rounded ${
          isCompleted && match.winnerId === match.team2Id
            ? 'font-bold text-green-700 bg-green-50'
            : 'text-gray-700'
        } ${isOrganizer && match.team2Id && !isCompleted ? 'cursor-pointer hover:bg-indigo-50' : ''}`}
        title={isOrganizer && !isCompleted ? 'Click to advance' : undefined}
        onClick={() => {
          if (isOrganizer && match.team2Id && !isCompleted && onAdvance) {
            onAdvance(match.id, match.team2Id);
          }
        }}
      >
        <span className="truncate">{t2Name}</span>
        {hasScore && (
          <span className="font-semibold flex-shrink-0">{match.team2Score}</span>
        )}
      </div>

      {/* Meta: schedule / court */}
      {(match.scheduledAt || match.courtNumber) && (
        <div className="mt-1 text-gray-400 text-[10px] leading-tight">
          {match.scheduledAt && <div>{formatDateTime(match.scheduledAt)}</div>}
          {match.courtNumber && <div>Court {match.courtNumber}</div>}
        </div>
      )}

      {/* Organizer actions */}
      {isOrganizer && !isCompleted && (
        <div className="mt-1.5 flex gap-1 flex-wrap">
          {onScoreUpdate && (
            <button
              disabled={isSaving}
              className="text-[10px] text-indigo-600 hover:underline disabled:opacity-50"
              onClick={() => {
                const s1 = prompt(`Score ${t1Name}:`, String(match.team1Score ?? 0));
                const s2 = prompt(`Score ${t2Name}:`, String(match.team2Score ?? 0));
                if (s1 !== null && s2 !== null) {
                  onScoreUpdate(match.id, Number(s1), Number(s2));
                }
              }}
            >
              {isSaving ? 'Saving…' : 'Score'}
            </button>
          )}
          {onSchedule && (
            <button
              disabled={isScheduling}
              className="text-[10px] text-purple-600 hover:underline disabled:opacity-50"
              onClick={() => {
                const dt = prompt('DateTime (ISO):', match.scheduledAt ?? '');
                if (dt) {
                  const c = prompt('Court #:', String(match.courtNumber ?? ''));
                  onSchedule(match.id, dt, c ? Number(c) : undefined);
                }
              }}
            >
              {isScheduling ? '…' : 'Schedule'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface BracketColumnProps {
  rounds: PlayoffRound[];
  label: string;
  labelColor: string;
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onAdvance?: (matchId: string, teamId: string) => void;
  onScoreUpdate?: (matchId: string, t1: number, t2: number) => void;
  onSchedule?: (matchId: string, scheduledAt: string, courtNumber?: number) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
}

function BracketColumn({
  rounds,
  label,
  labelColor,
  teamNames,
  isOrganizer,
  onAdvance,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
}: BracketColumnProps) {
  return (
    <div className="flex-1 min-w-0">
      <h4 className={`text-xs font-bold uppercase tracking-wide mb-3 ${labelColor}`}>
        {label}
      </h4>
      <div className="space-y-4">
        {rounds.map((round) => (
          <div key={round.roundNumber}>
            <p className="text-[10px] text-gray-400 uppercase mb-1.5">
              {round.roundName || `Round ${round.roundNumber}`}
            </p>
            <div className="space-y-2">
              {round.matches.map((match) => (
                <DEMatchCard
                  key={match.id}
                  match={match}
                  teamNames={teamNames}
                  isOrganizer={isOrganizer}
                  onAdvance={onAdvance}
                  onScoreUpdate={onScoreUpdate}
                  onSchedule={onSchedule}
                  savingMatchId={savingMatchId}
                  schedulingMatchId={schedulingMatchId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DoubleEliminationBracket({
  playoffRounds,
  teamNames,
  isOrganizer,
  onAdvance,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
}: DoubleEliminationBracketProps) {
  const winnersRounds = playoffRounds.filter((r) => r.bracket === 'winners');
  const losersRounds = playoffRounds.filter((r) => r.bracket === 'losers');
  const grandFinalRounds = playoffRounds.filter((r) => r.bracket === 'grand_final');
  // Fallback: if bracket field not set, show all rounds in winners column
  const untaggedRounds = playoffRounds.filter((r) => !r.bracket);

  const sharedProps = {
    teamNames,
    isOrganizer,
    onAdvance,
    onScoreUpdate,
    onSchedule,
    savingMatchId,
    schedulingMatchId,
  };

  if (untaggedRounds.length > 0 && winnersRounds.length === 0) {
    // Graceful fallback: render as single column
    return (
      <BracketColumn
        rounds={untaggedRounds}
        label="Bracket"
        labelColor="text-gray-700"
        {...sharedProps}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Two main columns: Winners + Losers */}
      <div className="flex gap-6 overflow-x-auto pb-2">
        {winnersRounds.length > 0 && (
          <BracketColumn
            rounds={winnersRounds}
            label="Winners Bracket"
            labelColor="text-indigo-700"
            {...sharedProps}
          />
        )}
        {losersRounds.length > 0 && (
          <BracketColumn
            rounds={losersRounds}
            label="Losers Bracket"
            labelColor="text-orange-600"
            {...sharedProps}
          />
        )}
      </div>

      {/* Grand Final — centered */}
      {grandFinalRounds.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 border-t border-dashed border-gray-300" />
            <span className="text-xs font-bold uppercase tracking-wide text-yellow-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Grand Final
            </span>
            <div className="flex-1 border-t border-dashed border-gray-300" />
          </div>
          <div className="flex justify-center">
            <div className="max-w-sm w-full space-y-2">
              {grandFinalRounds.flatMap((r) =>
                r.matches.map((match) => (
                  <DEMatchCard
                    key={match.id}
                    match={match}
                    {...sharedProps}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
