'use client';

import { useState, useCallback } from 'react';
import type { BracketMatch } from '@/types';

interface StandingRow {
  teamId: string;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingsTableProps {
  matches: BracketMatch[];
  teamNames?: Map<string, string> | Record<string, string>;
  groupLabel?: string;
  highlightTopN?: number;
  canEdit?: boolean;
  tiebreakOrder?: string[];
  teamOrder?: string[];
  onTiebreakerSet?: (order: string[]) => void;
  selectedTeamIds?: string[];
  onSelectedTeamIdsChange?: (teamIds: string[]) => void;
}

function resolveTeamName(
  id: string,
  teamNames?: Map<string, string> | Record<string, string>
): string {
  if (!teamNames) return id.slice(0, 8);
  if (teamNames instanceof Map) return teamNames.get(id) ?? id.slice(0, 8);
  return (teamNames as Record<string, string>)[id] ?? id.slice(0, 8);
}

function computeStandings(
  matches: BracketMatch[],
  teamNames?: Map<string, string> | Record<string, string>
): StandingRow[] {
  const rows = new Map<string, StandingRow>();

  const ensure = (id: string) => {
    if (!rows.has(id)) {
      rows.set(id, {
        teamId: id,
        teamName: resolveTeamName(id, teamNames),
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      });
    }
    return rows.get(id)!;
  };

  if (teamNames) {
    if (teamNames instanceof Map) {
      for (const id of teamNames.keys()) ensure(id);
    } else {
      for (const id of Object.keys(teamNames)) ensure(id);
    }
  }

  for (const match of matches) {
    if (match.team1Id) ensure(match.team1Id);
    if (match.team2Id) ensure(match.team2Id);
  }

  for (const match of matches) {
    const t1 = match.team1Id;
    const t2 = match.team2Id;
    if (!t1 || !t2) continue;
    if (match.team1Score == null || match.team2Score == null) continue;

    const r1 = ensure(t1);
    const r2 = ensure(t2);
    const s1 = match.team1Score;
    const s2 = match.team2Score;

    r1.played++;
    r2.played++;
    r1.goalsFor += s1;
    r1.goalsAgainst += s2;
    r2.goalsFor += s2;
    r2.goalsAgainst += s1;

    if (s1 > s2) {
      r1.won++;
      r1.points += 3;
      r2.lost++;
    } else if (s2 > s1) {
      r2.won++;
      r2.points += 3;
      r1.lost++;
    } else {
      r1.drawn++;
      r1.points++;
      r2.drawn++;
      r2.points++;
    }
  }

  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    row.teamName = resolveTeamName(row.teamId, teamNames);
  }

  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}

function applyTiebreakOrder(
  rows: StandingRow[],
  tiebreakOrder?: string[]
): StandingRow[] {
  if (!tiebreakOrder || tiebreakOrder.length === 0) return rows;

  const orderMap = new Map(tiebreakOrder.map((id, i) => [id, i]));
  const hasAll = rows.every((r) => orderMap.has(r.teamId));

  if (!hasAll) return rows;

  return [...rows].sort((a, b) => {
    return (orderMap.get(a.teamId) ?? 999) - (orderMap.get(b.teamId) ?? 999);
  });
}

function applyTeamOrder(rows: StandingRow[], teamOrder?: string[]): StandingRow[] {
  if (!teamOrder || teamOrder.length === 0) return rows;

  const orderMap = new Map(teamOrder.map((id, index) => [id, index]));
  return [...rows].sort((a, b) => {
    const aOrder = orderMap.get(a.teamId);
    const bOrder = orderMap.get(b.teamId);

    if (aOrder != null && bOrder != null) return aOrder - bOrder;
    if (aOrder != null) return -1;
    if (bOrder != null) return 1;

    return rows.indexOf(a) - rows.indexOf(b);
  });
}

export default function StandingsTable({
  matches,
  teamNames,
  groupLabel,
  highlightTopN,
  canEdit = false,
  tiebreakOrder,
  teamOrder,
  onTiebreakerSet,
  selectedTeamIds,
  onSelectedTeamIdsChange,
}: StandingsTableProps) {
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const computedRows = computeStandings(matches, teamNames);
  const groupOrderedRows = applyTeamOrder(computedRows, teamOrder);
  const orderedRows = applyTiebreakOrder(groupOrderedRows, tiebreakOrder);
  const selectedTeams = new Set(selectedTeamIds ?? orderedRows.map((row) => row.teamId));
  const isSelectable = !!onSelectedTeamIdsChange;
  const allSelected =
    orderedRows.length > 0 &&
    orderedRows.every((row) => selectedTeams.has(row.teamId));

  const hasActiveOverride =
    tiebreakOrder != null &&
    tiebreakOrder.length > 0 &&
    tiebreakOrder.length === computedRows.length;

  const buildCascadedOrder = useCallback(
    (teamId: string, newPosition: number) => {
      const currentIndex = orderedRows.findIndex((r) => r.teamId === teamId);
      const targetIndex = newPosition - 1;

      if (currentIndex === targetIndex) return null;

      const newOrder = orderedRows.map((r) => r.teamId);
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, teamId);
      return newOrder;
    },
    [orderedRows]
  );

  const handlePositionChange = async (teamId: string, newPosition: number) => {
    if (!onTiebreakerSet) return;

    const newOrder = buildCascadedOrder(teamId, newPosition);
    if (!newOrder) return;

    setSaving(true);
    try {
      await onTiebreakerSet(newOrder);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveUp = async (teamId: string) => {
    if (!onTiebreakerSet) return;
    const currentIndex = orderedRows.findIndex((r) => r.teamId === teamId);
    if (currentIndex <= 0) return;
    const newOrder = buildCascadedOrder(teamId, currentIndex);
    if (!newOrder) return;
    setSaving(true);
    try {
      await onTiebreakerSet(newOrder);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveDown = async (teamId: string) => {
    if (!onTiebreakerSet) return;
    const currentIndex = orderedRows.findIndex((r) => r.teamId === teamId);
    if (currentIndex >= orderedRows.length - 1) return;
    const newOrder = buildCascadedOrder(teamId, currentIndex + 2);
    if (!newOrder) return;
    setSaving(true);
    try {
      await onTiebreakerSet(newOrder);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!onTiebreakerSet) return;
    setSaving(true);
    try {
      await onTiebreakerSet([]);
    } finally {
      setSaving(false);
    }
  };

  const setAllSelected = (selectAll: boolean) => {
    onSelectedTeamIdsChange?.(selectAll ? orderedRows.map((row) => row.teamId) : []);
  };

  const toggleTeamSelection = (teamId: string) => {
    if (!onSelectedTeamIdsChange) return;

    const next = new Set(selectedTeams);
    if (next.has(teamId)) {
      next.delete(teamId);
    } else {
      next.add(teamId);
    }

    onSelectedTeamIdsChange([...next]);
  };

  if (computedRows.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No standings data yet — results will appear here as matches are played.
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-3">
      {groupLabel && (
        <h4 className="text-sm font-semibold text-gray-700 mb-2 px-1">
          {groupLabel}
        </h4>
      )}

      {isSelectable && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <button
            type="button"
            onClick={() => setAllSelected(!allSelected)}
            className="inline-flex items-center gap-1.5 rounded bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <span
              className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                allSelected
                  ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                  : 'border-gray-300 bg-white'
              }`}
              aria-hidden="true"
            >
              {allSelected && (
                <svg className="h-2.5 w-2.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.415 0l-3.5-3.5a1.004 1.004 0 011.42-1.42l2.79 2.795 6.795-6.795a1 1 0 011.41 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            {allSelected ? 'Clear teams' : 'Select all teams'}
          </button>
          <span className="text-xs text-gray-400">
            {selectedTeams.size} / {orderedRows.length} teams selected
          </span>
        </div>
      )}

      {canEdit && onTiebreakerSet && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditMode(!editMode)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                editMode
                  ? 'bg-[#1e3a5f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid="toggle-edit-mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M2.695 14.762l-1.262 4.202a.5.5 0 00.603.603l4.202-1.262a2.75 2.75 0 001.943-1.136l7.293-8.394a2 2 0 00-.05-2.655l-.78-.78a2 2 0 00-2.655-.05L4.396 12.82a2.75 2.75 0 00-1.136 1.943zM14.128 2.83a1 1 0 011.414 0l.78.78a1 1 0 010 1.414l-7.293 8.394a1.75 1.75 0 01-1.237.723l-2.975.893.893-2.975a1.75 1.75 0 01.723-1.237L14.128 2.83z" />
              </svg>
              {editMode ? 'Editing Positions' : 'Edit Positions'}
            </button>
            {hasActiveOverride && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"
                title="Manual position override is active"
                data-testid="override-badge"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 00-6 0V9h6z" clipRule="evenodd" />
                </svg>
                Manual override
              </span>
            )}
          </div>
          {editMode && hasActiveOverride && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
              data-testid="reset-override"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
              </svg>
              Reset to default
            </button>
          )}
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
        <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            {isSelectable && (
              <th className="px-2 py-2 text-center w-10">
                <span className="sr-only">Filter</span>
              </th>
            )}
            <th className="px-3 py-2 text-center w-12">#</th>
            {canEdit && onTiebreakerSet && editMode && (
              <th className="px-1 py-2 text-center w-16" data-testid="actions-col-header">
                <span className="sr-only">Actions</span>
              </th>
            )}
            <th className="px-3 py-2 text-left">Team</th>
            <th className="px-3 py-2 text-center w-10" title="Played">P</th>
            <th className="px-3 py-2 text-center w-10" title="Won">W</th>
            <th className="px-3 py-2 text-center w-10" title="Drawn">D</th>
            <th className="px-3 py-2 text-center w-10" title="Lost">L</th>
            <th className="px-3 py-2 text-center w-10" title="Goals For">GF</th>
            <th className="px-3 py-2 text-center w-10" title="Goals Against">GA</th>
            <th className="px-3 py-2 text-center w-12" title="Goal Difference">GD</th>
            <th className="px-3 py-2 text-center w-12 font-bold text-gray-700">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orderedRows.map((row, idx) => {
            const rank = idx + 1;
            const isPromoted = highlightTopN != null && rank <= highlightTopN;
            const isFirst = idx === 0;
            const isLast = idx === orderedRows.length - 1;
            return (
              <tr
                key={row.teamId}
                className={
                  isPromoted
                    ? 'bg-green-50 hover:bg-green-100 transition-colors'
                    : 'bg-white hover:bg-gray-50 transition-colors'
                }
              >
                {isSelectable && (
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTeams.has(row.teamId)}
                      onChange={() => toggleTeamSelection(row.teamId)}
                      className="h-4 w-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                      aria-label={`Show matches for ${row.teamName}`}
                    />
                  </td>
                )}
                <td className="px-3 py-2 text-center text-gray-400 font-medium">
                  {canEdit && onTiebreakerSet && editMode ? (
                    <select
                      value={rank}
                      disabled={saving}
                      onChange={(e) => handlePositionChange(row.teamId, parseInt(e.target.value))}
                      className="text-xs font-medium rounded border border-gray-200 bg-white px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1e3a5f] focus:border-[#1e3a5f] disabled:opacity-50 cursor-pointer"
                      style={{ minWidth: '2rem' }}
                      data-testid={`position-select-${rank}`}
                    >
                      {orderedRows.map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isPromoted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {rank}
                    </span>
                  )}
                </td>
                {canEdit && onTiebreakerSet && editMode && (
                  <td className="px-1 py-2 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(row.teamId)}
                        disabled={isFirst || saving}
                        className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
                        title={`Move ${row.teamName} up`}
                        data-testid={`move-up-${rank}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M9.47 6.47a.75.75 0 011.06 0l4.25 4.25a.75.75 0 11-1.06 1.06L10 8.06l-3.72 3.72a.75.75 0 01-1.06-1.06l4.25-4.25z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveDown(row.teamId)}
                        disabled={isLast || saving}
                        className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-500 transition-colors"
                        title={`Move ${row.teamName} down`}
                        data-testid={`move-down-${rank}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
                <td className="px-3 py-2 font-medium text-gray-900">
                  <button
                    type="button"
                    onClick={() => toggleTeamSelection(row.teamId)}
                    disabled={!isSelectable}
                    className={`flex items-center gap-2 text-left ${
                      isSelectable ? 'hover:text-[#1e3a5f]' : ''
                    }`}
                  >
                  {isPromoted && (
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                      title="Advancing spot"
                    />
                  )}
                    {row.teamName}
                  </button>
                </td>
                <td className="px-3 py-2 text-center text-gray-600">{row.played}</td>
                <td className="px-3 py-2 text-center text-gray-600">{row.won}</td>
                <td className="px-3 py-2 text-center text-gray-600">{row.drawn}</td>
                <td className="px-3 py-2 text-center text-gray-600">{row.lost}</td>
                <td className="px-3 py-2 text-center text-gray-600">{row.goalsFor}</td>
                <td className="px-3 py-2 text-center text-gray-600">{row.goalsAgainst}</td>
                <td
                  className={`px-3 py-2 text-center font-medium ${
                    row.goalDifference > 0
                      ? 'text-green-600'
                      : row.goalDifference < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </td>
                <td className="px-3 py-2 text-center font-bold text-gray-900">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>

      {highlightTopN != null && computedRows.length > highlightTopN && (
        <p className="text-xs text-gray-400 mt-1 px-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
          Top {highlightTopN} advance
        </p>
      )}

      {saving && (
        <p className="text-xs text-amber-600 px-1">Saving positions…</p>
      )}
    </div>
  );
}
