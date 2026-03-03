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
    team2Score: number
  ) => void;
  onSchedule?: (
    matchId: string,
    scheduledAt: string,
    fieldName?: string
  ) => void;
  savingMatchId?: string | null;
  schedulingMatchId?: string | null;
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
  const [scoreModal, setScoreModal] = useState<ScoreModalState | null>(null);
  const [detailsModal, setDetailsModal] = useState<DetailsModalState | null>(null);
  const [cols, setCols] = useState(1);

  // Responsive default: 1 col on mobile, 4 cols on desktop; updates on resize
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setCols(e.matches ? 4 : 1);
    setCols(mq.matches ? 4 : 1);
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
    });
  }

  function openDetailsModal(match: BracketMatch, t1: string, t2: string) {
    let date = '';
    let hh = '12';
    let mm = '00';
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      date = d.toISOString().split('T')[0];
      hh = String(d.getHours()).padStart(2, '0');
      mm = String(d.getMinutes()).padStart(2, '0');
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
    onScoreUpdate(scoreModal.match.id, s1, s2);
    setScoreModal(null);
  }

  function handleDetailsSave() {
    if (!detailsModal || !onSchedule) return;
    const { date, hh, mm, fieldName, match } = detailsModal;
    if (!date) return;
    const iso = `${date}T${hh}:${mm}:00.000Z`;
    onSchedule(match.id, iso, fieldName || undefined);
    setDetailsModal(null);
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
      {/* Column layout selector */}
      <div className="flex items-center justify-end mb-3">
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-1">
          {[1, 2, 3, 4].map((c) => (
            <button
              key={c}
              onClick={() => setCols(c)}
              title={`${c} column${c > 1 ? 's' : ''}`}
              className={`items-center justify-center w-8 h-7 rounded transition-colors ${
                c <= 2 ? 'flex md:hidden' : 'hidden md:flex'
              } ${
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
                                <span className="text-sm font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                                  {match.team1Score} – {match.team2Score}
                                </span>
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
                              <span className="text-xs text-gray-400">{formatDateTime(match.scheduledAt)}</span>
                            )}
                            {match.fieldName && (
                              <span className="text-xs bg-[#e0f7ff] text-[#0090c7] px-1.5 py-0.5 rounded font-medium">
                                {match.fieldName}
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
                      {/* Header: status + field */}
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${status.cls}`}>
                          {status.label}
                        </span>
                        {match.fieldName && (
                          <span className="text-xs bg-[#e0f7ff] text-[#0090c7] px-1.5 py-0.5 rounded font-medium truncate max-w-[60%]">
                            {match.fieldName}
                          </span>
                        )}
                      </div>
                      {/* Teams + score */}
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="font-medium text-gray-900 text-xs truncate flex-1 text-right">{t1}</span>
                        <div className="flex-shrink-0 px-1">
                          {hasScore ? (
                            <span className="text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
                              {match.team1Score}–{match.team2Score}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">vs</span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 text-xs truncate flex-1">{t2}</span>
                      </div>
                      {/* Date */}
                      {match.scheduledAt && (
                        <div className="text-xs text-gray-400 truncate">{formatDateTime(match.scheduledAt)}</div>
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
