'use client';

import type { BracketMatch } from '@/types';
import { formatDateTime } from '@/utils/date';

export interface LeagueMatchScheduleProps {
  matches: BracketMatch[];
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onScoreUpdate?: (
    matchId: string,
    team1Score: number,
    team2Score: number
  ) => void;
  onSchedule?: (
    matchId: string,
    scheduledAt: string,
    courtNumber?: number
  ) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
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

function groupByRound(matches: BracketMatch[]): Map<number, BracketMatch[]> {
  const map = new Map<number, BracketMatch[]>();
  for (const m of matches) {
    const arr = map.get(m.round) ?? [];
    arr.push(m);
    map.set(m.round, arr);
  }
  return map;
}

const STATUS_CONFIG: Record<
  BracketMatch['status'],
  { label: string; cls: string }
> = {
  PENDING: { label: 'Pending', cls: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'Live', cls: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Final', cls: 'bg-green-100 text-green-700' },
};

export default function LeagueMatchSchedule({
  matches,
  teamNames,
  isOrganizer,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
}: LeagueMatchScheduleProps) {
  const rounds = groupByRound(matches);
  const sortedRoundNums = [...rounds.keys()].sort((a, b) => a - b);

  if (matches.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No matches scheduled yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sortedRoundNums.map((roundNum) => {
        const roundMatches = rounds.get(roundNum)!;
        return (
          <div key={roundNum} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Round {roundNum}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {roundMatches.map((match) => {
                const t1 = resolveTeamName(match.team1Id, teamNames);
                const t2 = resolveTeamName(match.team2Id, teamNames);
                const status = STATUS_CONFIG[match.status];
                const isSaving = savingMatchId === match.id;
                const isScheduling = schedulingMatchId === match.id;
                const hasScore =
                  match.team1Score != null && match.team2Score != null;

                return (
                  <div key={match.id} className="px-4 py-3 bg-white hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      {/* Teams + Score */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium text-gray-900 truncate text-right flex-1">
                          {t1}
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {hasScore ? (
                            <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                              {match.team1Score} – {match.team2Score}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 px-2">vs</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 truncate flex-1">
                          {t2}
                        </span>
                      </div>

                      {/* Right side: status + schedule */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}
                        >
                          {status.label}
                        </span>
                        {match.scheduledAt && (
                          <span className="text-xs text-gray-400">
                            {formatDateTime(match.scheduledAt)}
                          </span>
                        )}
                        {match.courtNumber && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                            Court {match.courtNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Organizer actions */}
                    {isOrganizer && onScoreUpdate && match.status !== 'COMPLETED' && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <button
                          disabled={isSaving}
                          onClick={() => {
                            const s1 = prompt(`Score for ${t1}:`, String(match.team1Score ?? 0));
                            const s2 = prompt(`Score for ${t2}:`, String(match.team2Score ?? 0));
                            if (s1 !== null && s2 !== null) {
                              onScoreUpdate(match.id, Number(s1), Number(s2));
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                        >
                          {isSaving ? 'Saving…' : 'Enter score'}
                        </button>
                        {onSchedule && (
                          <button
                            disabled={isScheduling}
                            onClick={() => {
                              const dt = prompt('Scheduled date/time (ISO):', match.scheduledAt ?? '');
                              if (dt) {
                                const court = prompt('Court number (optional):', String(match.courtNumber ?? ''));
                                onSchedule(match.id, dt, court ? Number(court) : undefined);
                              }
                            }}
                            className="text-purple-600 hover:text-purple-800 disabled:opacity-50"
                          >
                            {isScheduling ? 'Scheduling…' : 'Set schedule'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
