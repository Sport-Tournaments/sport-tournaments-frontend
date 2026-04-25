'use client';

import { useState, useEffect } from 'react';
import type { BracketMatch } from '@/types';
import { formatDateTime } from '@/utils/date';

export interface LeagueMatchScheduleProps {
  matches: BracketMatch[];
  teamNames?: Map<string, string> | Record<string, string>;
  isOrganizer?: boolean;
  onScoreUpdate?: (
    matchId: string,
    team1Score: number,
    team2Score: number,
    advancingTeamId?: string,
    hasPenalties?: boolean,
    penaltyTeam1Score?: number,
    penaltyTeam2Score?: number
  ) => void;
  onSchedule?: (
    matchId: string,
    scheduledAt: string,
    fieldName?: string
  ) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
  matchPeriodType?: 'ONE_HALF' | 'TWO_HALVES';
  halfDurationMinutes?: number;
  halfTimePauseMinutes?: number;
  fieldsCount?: number;
  pauseBetweenMatchesMinutes?: number;
  onBulkSchedule?: (schedules: Array<{ matchId: string; scheduledAt: string; fieldName?: string }>) => void;
  bulkScheduling?: boolean;
}

const HH_OPTIONS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0')
);
const MM_OPTIONS = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, '0')
);

interface ScoreModalState {
  match: BracketMatch;
  t1: string;
  t2: string;
  score1: string;
  score2: string;
  hasPenalties: boolean;
  penaltyScore1: string;
  penaltyScore2: string;
}

interface DetailsModalState {
  match: BracketMatch;
  t1: string;
  t2: string;
  date: string;
  hh: string;
  mm: string;
  fieldName: string;
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

const GRID_COLS_CLASS: Record<number, string> = {
  1: 'divide-y divide-gray-100',
  2: 'grid grid-cols-2 gap-3 p-3',
  3: 'grid grid-cols-3 gap-3 p-3',
  4: 'grid grid-cols-4 gap-3 p-3',
};

function GridIcon({ cols, active }: { cols: number; active: boolean }) {
  const color = active ? '#ffffff' : '#6b7280';
  const totalW = 14;
  const totalH = 10;
  const gap = 1.5;
  const colW = (totalW - gap * (cols - 1)) / cols;
  const rects = Array.from({ length: cols }, (_, i) => (
    <rect
      key={i}
      x={i * (colW + gap)}
      y={0}
      width={colW}
      height={totalH}
      rx={1}
      fill={color}
    />
  ));
  return (
    <svg width={totalW} height={totalH} viewBox={`0 0 ${totalW} ${totalH}`} fill="none">
      {rects}
    </svg>
  );
}

/** When a field value is purely numeric, prefix it with "Pitch ". */
function formatFieldDisplay(fieldName: string): string {
  return /^\d+$/.test(fieldName.trim()) ? `Pitch ${fieldName.trim()}` : fieldName;
}

const STATUS_CONFIG: Record<
  BracketMatch['status'],
  { label: string; cls: string }
> = {
  PENDING: { label: 'Pending', cls: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'Live', cls: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: 'Final', cls: 'bg-green-100 text-green-700' },
};

function computeMatchEndTime(
  scheduledAt: string | undefined | null,
  matchPeriodType: 'ONE_HALF' | 'TWO_HALVES' | undefined,
  halfDurationMinutes: number | undefined,
  halfTimePauseMinutes: number | undefined
): string | null {
  if (!scheduledAt || !halfDurationMinutes) return null;
  const periods = matchPeriodType === 'ONE_HALF' ? 1 : 2;
  const totalMinutes = periods * halfDurationMinutes + (periods - 1) * (halfTimePauseMinutes ?? 0);
  const endMs = new Date(scheduledAt).getTime() + totalMinutes * 60000;
  const d = new Date(endMs);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function LeagueMatchSchedule({
  matches,
  teamNames,
  isOrganizer,
  onScoreUpdate,
  onSchedule,
  savingMatchId,
  schedulingMatchId,
  matchPeriodType,
  halfDurationMinutes,
  halfTimePauseMinutes,
  fieldsCount,
  pauseBetweenMatchesMinutes,
  onBulkSchedule,
  bulkScheduling,
}: LeagueMatchScheduleProps) {
  const [scoreModal, setScoreModal] = useState<ScoreModalState | null>(null);
  const [detailsModal, setDetailsModal] = useState<DetailsModalState | null>(null);
  const [autoOpen, setAutoOpen] = useState(false);
  const [autoDate, setAutoDate] = useState('');
  const [autoHH, setAutoHH] = useState('10');
  const [autoMM, setAutoMM] = useState('00');
  const [cols, setCols] = useState(1);

  // Responsive default: 1 col on mobile, 4 cols on desktop; updates on resize
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setCols(e.matches ? 2 : 1);
    setCols(mq.matches ? 2 : 1);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const rounds = groupByRound(matches);
  const sortedRoundNums = [...rounds.keys()].sort((a, b) => a - b);

  function openScoreModal(match: BracketMatch, t1: string, t2: string) {
    setScoreModal({
      match,
      t1,
      t2,
      score1: String(match.team1Score ?? 0),
      score2: String(match.team2Score ?? 0),
      hasPenalties: match.hasPenalties ?? false,
      penaltyScore1: String(match.penaltyTeam1Score ?? ''),
      penaltyScore2: String(match.penaltyTeam2Score ?? ''),
    });
  }

  function openDetailsModal(match: BracketMatch, t1: string, t2: string) {
    let date = '';
    let hh = '08';
    let mm = '00';
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      date = `${y}-${mo}-${day}`;
      hh = String(d.getHours()).padStart(2, '0');
      mm = String(d.getMinutes()).padStart(2, '0');
    } else {
      // Pre-fill today's local date and current hour
      const now = new Date();
      const y = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      date = `${y}-${mo}-${day}`;
      hh = String(now.getHours()).padStart(2, '0');
      mm = '00';
    }
    setDetailsModal({
      match,
      t1,
      t2,
      date,
      hh,
      mm,
      fieldName: match.fieldName ?? '',
    });
  }

  function handleScoreSave() {
    if (!scoreModal || !onScoreUpdate) return;
    const s1 = Number(scoreModal.score1);
    const s2 = Number(scoreModal.score2);
    if (isNaN(s1) || isNaN(s2)) return;
    const hasPenalties = scoreModal.hasPenalties;
    const p1 = hasPenalties ? Number(scoreModal.penaltyScore1) : undefined;
    const p2 = hasPenalties ? Number(scoreModal.penaltyScore2) : undefined;
    onScoreUpdate(scoreModal.match.id, s1, s2, undefined, hasPenalties || undefined, p1, p2);
    setScoreModal(null);
  }

  function handleDetailsSave() {
    if (!detailsModal || !onSchedule) return;
    const { date, hh, mm, fieldName, match } = detailsModal;
    if (!date) return;
    const iso = new Date(`${date}T${hh}:${mm}:00`).toISOString();
    onSchedule(match.id, iso, fieldName || undefined);
    setDetailsModal(null);
  }

  function openAutoSchedule() {
    const now = new Date();
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setAutoDate(`${y}-${mo}-${day}`);
    setAutoHH('10');
    setAutoMM('00');
    setAutoOpen(true);
  }

  function handleAutoScheduleApply() {
    if (!autoDate || !onBulkSchedule) return;
    const periods = matchPeriodType === 'ONE_HALF' ? 1 : 2;
    const matchDuration = periods * (halfDurationMinutes ?? 0) + (periods - 1) * (halfTimePauseMinutes ?? 0);
    const slotMinutes = matchDuration + (pauseBetweenMatchesMinutes ?? 0);
    const startMs = new Date(`${autoDate}T${autoHH}:${autoMM}:00`).getTime();
    const fields = (fieldsCount && fieldsCount > 0) ? fieldsCount : 1;
    const roundMap = groupByRound(matches);
    const sortedRounds = [...roundMap.keys()].sort((a, b) => a - b);
    const schedules: Array<{ matchId: string; scheduledAt: string; fieldName?: string }> = [];
    let slotIndex = 0;
    for (const roundNum of sortedRounds) {
      const roundMatches = roundMap.get(roundNum)!;
      const numBatches = Math.ceil(roundMatches.length / fields);
      for (let batchIdx = 0; batchIdx < numBatches; batchIdx++) {
        const batchMatches = roundMatches.slice(batchIdx * fields, (batchIdx + 1) * fields);
        const slotMs = startMs + slotIndex * slotMinutes * 60000;
        batchMatches.forEach((m, fieldIdx) => {
          schedules.push({
            matchId: m.id,
            scheduledAt: new Date(slotMs).toISOString(),
            fieldName: String(fieldIdx + 1),
          });
        });
        slotIndex++;
      }
    }
    onBulkSchedule(schedules);
    setAutoOpen(false);
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No matches scheduled yet.
      </div>
    );
  }

  return (
    <>
      {/* Toolbar: Auto Schedule + column selector */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {isOrganizer && onBulkSchedule && (
            <button
              onClick={openAutoSchedule}
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
          )}
        </div>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
          {[1, 2, 3, 4].map((c) => (
            <button
              key={c}
              onClick={() => setCols(c)}
              title={`${c} column${c > 1 ? 's' : ''}`}
              className={`flex items-center justify-center w-8 h-7 rounded transition-colors ${
                cols === c
                  ? 'bg-[#1e3a5f] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white'
              }`}
            >
              <GridIcon cols={c} active={cols === c} />
            </button>
          ))}
        </div>
      </div>
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
              <div className={GRID_COLS_CLASS[cols]}>
                {roundMatches.map((match) => {
                  const t1 = resolveTeamName(match.team1Id, teamNames);
                  const t2 = resolveTeamName(match.team2Id, teamNames);
                  const status = STATUS_CONFIG[match.status];
                  const isSaving = savingMatchId === match.id;
                  const isScheduling = schedulingMatchId === match.id;
                  const hasScore =
                    match.team1Score != null && match.team2Score != null;

                  if (cols === 1) {
                    // ── List layout (single column) ──
                    return (
                      <div key={match.id} className="px-4 py-3 bg-white hover:bg-gray-50">
                        <div className="flex items-center justify-between gap-3">
                          {/* Teams + Score */}
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-medium text-gray-900 truncate text-right flex-1">{t1}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {hasScore ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                    {match.team1Score} – {match.team2Score}
                                  </span>
                                  {match.hasPenalties && match.penaltyTeam1Score != null && match.penaltyTeam2Score != null && (
                                    <span className="text-xs text-amber-700 font-medium mt-0.5">
                                      (pen. {match.penaltyTeam1Score}–{match.penaltyTeam2Score})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400 px-2">vs</span>
                              )}
                            </div>
                            <span className="font-medium text-gray-900 truncate flex-1">{t2}</span>
                          </div>
                          {/* Status + meta */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.cls}`}>
                              {status.label}
                            </span>
                            {match.scheduledAt && (
                              <span className="text-xs text-gray-400">
                                {formatDateTime(match.scheduledAt)}
                                {(() => {
                                  const end = computeMatchEndTime(match.scheduledAt, matchPeriodType, halfDurationMinutes, halfTimePauseMinutes);
                                  return end ? <span className="text-gray-300"> → {end}</span> : null;
                                })()}
                              </span>
                            )}
                            {match.fieldName && (
                              <span className="text-xs bg-[#e0f7ff] text-[#0090c7] px-1.5 py-0.5 rounded font-medium">
                                {formatFieldDisplay(match.fieldName)}
                              </span>
                            )}
                          </div>
                        </div>
                        {isOrganizer && onScoreUpdate && match.status !== 'COMPLETED' && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <button
                              disabled={isSaving}
                              onClick={() => openScoreModal(match, t1, t2)}
                              className="text-xs font-medium px-2.5 py-1 rounded bg-[#1e3a5f] text-white hover:bg-[#152a45] disabled:opacity-50 transition-colors"
                            >
                              {isSaving ? 'Saving…' : 'Score'}
                            </button>
                            {onSchedule && (
                              <button
                                disabled={isScheduling}
                                onClick={() => openDetailsModal(match, t1, t2)}
                                className="text-xs font-medium px-2.5 py-1 rounded bg-[#e0f7ff] text-[#0090c7] hover:bg-[#dbeafe] disabled:opacity-50 transition-colors"
                              >
                                {isScheduling ? 'Scheduling…' : 'Details'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ── Card layout (2 / 3 / 4 columns) ──
                  return (
                    <div key={match.id} className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow">
                      {/* Header: status only */}
                      <div className="flex items-center gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${status.cls}`}>
                          {status.label}
                        </span>
                      </div>
                      {/* Teams + score */}
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium text-gray-900 text-xs truncate flex-1 text-right">{t1}</span>
                        <div className="flex-shrink-0 px-1">
                          {hasScore ? (
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                                {match.team1Score}–{match.team2Score}
                              </span>
                              {match.hasPenalties && match.penaltyTeam1Score != null && match.penaltyTeam2Score != null && (
                                <span className="text-xs text-amber-700 font-medium mt-0.5 whitespace-nowrap">
                                  pen. {match.penaltyTeam1Score}–{match.penaltyTeam2Score}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">vs</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 text-xs truncate flex-1">{t2}</span>
                      </div>
                      {/* Date + Field on same row */}
                      {(match.scheduledAt || match.fieldName) && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {match.scheduledAt && (
                            <span className="text-xs text-gray-400 truncate">
                              {formatDateTime(match.scheduledAt)}
                              {(() => {
                                const end = computeMatchEndTime(match.scheduledAt, matchPeriodType, halfDurationMinutes, halfTimePauseMinutes);
                                return end ? <span className="text-gray-300"> → {end}</span> : null;
                              })()}
                            </span>
                          )}
                          {match.fieldName && (
                            <span className="text-xs bg-[#e0f7ff] text-[#0090c7] px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                              {formatFieldDisplay(match.fieldName)}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Organizer actions */}
                      {isOrganizer && onScoreUpdate && match.status !== 'COMPLETED' && (
                        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                          <button
                            disabled={isSaving}
                            onClick={() => openScoreModal(match, t1, t2)}
                            className="flex-1 text-xs font-medium px-2 py-1 rounded bg-[#1e3a5f] text-white hover:bg-[#152a45] disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? 'Saving…' : 'Score'}
                          </button>
                          {onSchedule && (
                            <button
                              disabled={isScheduling}
                              onClick={() => openDetailsModal(match, t1, t2)}
                              className="flex-1 text-xs font-medium px-2 py-1 rounded bg-[#e0f7ff] text-[#0090c7] hover:bg-[#dbeafe] disabled:opacity-50 transition-colors"
                            >
                              {isScheduling ? '…' : 'Details'}
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

      {/* ── Auto Schedule Modal ── */}
      {autoOpen && (() => {
        const periods = matchPeriodType === 'ONE_HALF' ? 1 : 2;
        const matchDuration = periods * (halfDurationMinutes ?? 0) + (periods - 1) * (halfTimePauseMinutes ?? 0);
        const slotMinutes = matchDuration + (pauseBetweenMatchesMinutes ?? 0);
        const fields = (fieldsCount && fieldsCount > 0) ? fieldsCount : 1;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) setAutoOpen(false); }}
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
                    value={autoDate}
                    onChange={(e) => setAutoDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={autoHH}
                      onChange={(e) => setAutoHH(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                    >
                      {HH_OPTIONS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-gray-400 font-bold text-lg">:</span>
                    <select
                      value={autoMM}
                      onChange={(e) => setAutoMM(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                    >
                      {MM_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 space-y-1">
                  <div>Round 1 → <strong>{autoHH}:{autoMM}</strong></div>
                  {slotMinutes > 0 && (
                    <div>Round 2 → <strong>{(() => {
                      const d = new Date(`2000-01-01T${autoHH}:${autoMM}:00`);
                      d.setMinutes(d.getMinutes() + slotMinutes);
                      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                    })()}</strong></div>
                  )}
                  <div className="text-blue-500">Field names will be set to 1, 2, … {fields}</div>
                </div>
              </div>
              <div className="px-5 py-3 bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => setAutoOpen(false)}
                  className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAutoScheduleApply}
                  disabled={!autoDate || slotMinutes === 0}
                  className="px-4 py-1.5 text-sm font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#152a45] transition-colors disabled:opacity-50"
                >
                  Apply to All Matches
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Score Modal ── */}
      {scoreModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setScoreModal(null); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Enter Score</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {scoreModal.t1} <span className="text-gray-400">vs</span> {scoreModal.t2}
              </p>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1 truncate">{scoreModal.t1}</label>
                  <input
                    type="number"
                    min={0}
                    value={scoreModal.score1}
                    onChange={(e) =>
                      setScoreModal((s) => s && { ...s, score1: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
                <span className="text-gray-400 font-bold mt-5">–</span>
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1 truncate">{scoreModal.t2}</label>
                  <input
                    type="number"
                    min={0}
                    value={scoreModal.score2}
                    onChange={(e) =>
                      setScoreModal((s) => s && { ...s, score2: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  />
                </div>
              </div>

              {/* Penalty checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={scoreModal.hasPenalties}
                  onChange={(e) =>
                    setScoreModal((s) => s && { ...s, hasPenalties: e.target.checked, penaltyScore1: '', penaltyScore2: '' })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                />
                <span className="text-xs font-medium text-gray-700">Decided by penalty shootout</span>
              </label>

              {/* Penalty scores (only shown when hasPenalties is checked) */}
              {scoreModal.hasPenalties && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-amber-800">Penalty Shootout Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1 truncate">{scoreModal.t1}</label>
                      <input
                        type="number"
                        min={0}
                        value={scoreModal.penaltyScore1}
                        onChange={(e) =>
                          setScoreModal((s) => s && { ...s, penaltyScore1: e.target.value })
                        }
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="0"
                      />
                    </div>
                    <span className="text-gray-400 font-bold mt-5">–</span>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1 truncate">{scoreModal.t2}</label>
                      <input
                        type="number"
                        min={0}
                        value={scoreModal.penaltyScore2}
                        onChange={(e) =>
                          setScoreModal((s) => s && { ...s, penaltyScore2: e.target.value })
                        }
                        className="w-full border border-amber-300 rounded-lg px-3 py-2 text-center text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setScoreModal(null)}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleScoreSave}
                className="px-4 py-1.5 text-sm font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#152a45] transition-colors"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Details Modal ── */}
      {detailsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setDetailsModal(null); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Match Details</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {detailsModal.t1} <span className="text-gray-400">vs</span> {detailsModal.t2}
              </p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={detailsModal.date}
                  onChange={(e) =>
                    setDetailsModal((s) => s && { ...s, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>

              {/* Time HH:MM dropdowns */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                <div className="flex items-center gap-2">
                  <select
                    value={detailsModal.hh}
                    onChange={(e) =>
                      setDetailsModal((s) => s && { ...s, hh: e.target.value })
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                  >
                    {HH_OPTIONS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-gray-400 font-bold text-lg">:</span>
                  <select
                    value={detailsModal.mm}
                    onChange={(e) =>
                      setDetailsModal((s) => s && { ...s, mm: e.target.value })
                    }
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] bg-white"
                  >
                    {MM_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Football field name */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Football Field
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field A, Pitch 3…"
                  value={detailsModal.fieldName}
                  onChange={(e) =>
                    setDetailsModal((s) => s && { ...s, fieldName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
            </div>
            <div className="px-5 py-3 bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setDetailsModal(null)}
                className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDetailsSave}
                disabled={!detailsModal.date}
                className="px-4 py-1.5 text-sm font-medium bg-[#1e3a5f] text-white rounded-lg hover:bg-[#152a45] transition-colors disabled:opacity-50"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
