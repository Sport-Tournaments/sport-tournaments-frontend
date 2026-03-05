'use client';

import { useState } from 'react';
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
  /** All completed/in-progress matches for this group or tournament */
  matches: BracketMatch[];
  /** Map from teamId → display name */
  teamNames?: Map<string, string> | Record<string, string>;
  /** Optional header label e.g. "Group A" */
  groupLabel?: string;
  /** Highlight the top N rows (promotion spots) */
  highlightTopN?: number;
  /** If true, show tiebreak controls when a tie is detected and all matches are done */
  canEdit?: boolean;
  /** Current persisted tiebreak order (teamIds in rank order, 1st first) */
  tiebreakOrder?: string[];
  /** Called with the new ordered teamIds when organizer resolves a tie */
  onTiebreakerSet?: (order: string[]) => void;
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

  // Pre-seed all known teams from teamNames so teams with no matches yet still appear
  if (teamNames) {
    if (teamNames instanceof Map) {
      for (const id of teamNames.keys()) ensure(id);
    } else {
      for (const id of Object.keys(teamNames)) ensure(id);
    }
  }

  // Also ensure all teams that appear in any match (even pending ones) are present
  for (const match of matches) {
    if (match.team1Id) ensure(match.team1Id);
    if (match.team2Id) ensure(match.team2Id);
  }

  for (const match of matches) {
    const t1 = match.team1Id;
    const t2 = match.team2Id;
    if (!t1 || !t2) continue;
    // Only count matches that have scores
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

  // Re-compute GD
  for (const row of rows.values()) {
    row.goalDifference = row.goalsFor - row.goalsAgainst;
    // Refresh team name in case it wasn't seeded yet
    row.teamName = resolveTeamName(row.teamId, teamNames);
  }

  // Sort: Pts → GD → GF → Team name
  return [...rows.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName);
  });
}

/** Returns groups of consecutive rows that are exactly equal on pts/GD/GF */
function findTiedGroups(rows: StandingRow[]): StandingRow[][] {
  const groups: StandingRow[][] = [];
  let i = 0;
  while (i < rows.length) {
    const cur = rows[i];
    let j = i + 1;
    while (
      j < rows.length &&
      rows[j].points === cur.points &&
      rows[j].goalDifference === cur.goalDifference &&
      rows[j].goalsFor === cur.goalsFor
    ) {
      j++;
    }
    if (j - i > 1) groups.push(rows.slice(i, j));
    i = j;
  }
  return groups;
}

export default function StandingsTable({
  matches,
  teamNames,
  groupLabel,
  highlightTopN,
  canEdit = false,
  tiebreakOrder,
  onTiebreakerSet,
}: StandingsTableProps) {
  const [saving, setSaving] = useState(false);

  const rows = computeStandings(matches, teamNames);

  // Only show tiebreak UI when all matches in the group have been played
  const allMatchesDone =
    matches.length > 0 &&
    matches.every(
      (m) => m.status === 'COMPLETED' || (m.team1Score != null && m.team2Score != null)
    );

  // Find tied groups that overlap with advancing spots (or affect seeding within them)
  const tiedGroups = allMatchesDone ? findTiedGroups(rows) : [];
  // Only care about ties that touch the highlightTopN boundary or are within advancing spots
  const relevantTiedGroups =
    highlightTopN != null
      ? tiedGroups.filter((g) => {
          const startIdx = rows.indexOf(g[0]);
          const endIdx = rows.indexOf(g[g.length - 1]);
          // Tie overlaps the boundary or is fully within advancing spots
          return startIdx < highlightTopN;
        })
      : tiedGroups;

  const hasTie = canEdit && relevantTiedGroups.length > 0;

  const handlePickWinner = async (tiedTeamIds: string[], pickedFirst: string) => {
    if (!onTiebreakerSet) return;
    // Build full order: put pickedFirst at the top, then the rest in their current order
    const rest = tiedTeamIds.filter((id) => id !== pickedFirst);
    // Compose the full tiebreak array: for all rows, place tied ones in new order
    const fullOrder: string[] = [];
    for (const row of rows) {
      if (tiedTeamIds.includes(row.teamId)) {
        if (row.teamId === pickedFirst && !fullOrder.includes(pickedFirst)) {
          fullOrder.push(pickedFirst);
          rest.forEach((id) => fullOrder.push(id));
        }
        // skip — already pushed via the block above
      } else {
        fullOrder.push(row.teamId);
      }
    }
    setSaving(true);
    try {
      await onTiebreakerSet(fullOrder);
    } finally {
      setSaving(false);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No standings data yet — results will appear here as matches are played.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto space-y-3">
      {groupLabel && (
        <h4 className="text-sm font-semibold text-gray-700 mb-2 px-1">
          {groupLabel}
        </h4>
      )}
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="px-3 py-2 text-center w-8">#</th>
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
          {rows.map((row, idx) => {
            const rank = idx + 1;
            const isPromoted = highlightTopN != null && rank <= highlightTopN;
            // Is this row part of a relevant tie?
            const isTied = relevantTiedGroups.some((g) =>
              g.some((r) => r.teamId === row.teamId)
            );
            // Is this team picked first in the current tiebreakOrder?
            const isTiebreakWinner =
              tiebreakOrder && tiebreakOrder.length > 0
                ? tiebreakOrder[0] === row.teamId
                : false;
            return (
              <tr
                key={row.teamId}
                className={
                  isPromoted
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'bg-white hover:bg-gray-50'
                }
              >
                <td className="px-3 py-2 text-center text-gray-400 font-medium relative">
                  {rank}
                  {isTied && !isTiebreakWinner && (
                    <span className="absolute top-1 right-0.5 text-amber-400 text-xs" title="Tie">
                      ⚠
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900 flex items-center gap-2">
                  {isPromoted && (
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                      title="Promotion spot"
                    />
                  )}
                  {row.teamName}
                  {isTiebreakWinner && (
                    <span className="text-xs text-amber-600 font-normal">(tiebreak winner)</span>
                  )}
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

      {highlightTopN != null && rows.length > highlightTopN && (
        <p className="text-xs text-gray-400 mt-1 px-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />
          Top {highlightTopN} advance
        </p>
      )}

      {/* Tiebreak picker — shown to organizer when teams are perfectly tied */}
      {hasTie &&
        relevantTiedGroups.map((tiedGroup, gi) => {
          const tiedIds = tiedGroup.map((r) => r.teamId);
          const startRank = rows.indexOf(tiedGroup[0]) + 1;
          return (
            <div
              key={gi}
              className="rounded-lg border border-amber-300 bg-amber-50 p-3"
            >
              <p className="text-xs font-semibold text-amber-800 mb-2">
                ⚠ Teams tied at position {startRank}
                {tiedGroup.length > 1 ? `–${startRank + tiedGroup.length - 1}` : ''} — select who finishes 1st:
              </p>
              <div className="flex flex-wrap gap-2">
                {tiedGroup.map((row) => {
                  const isCurrentWinner =
                    tiebreakOrder && tiebreakOrder[0] === row.teamId;
                  return (
                    <button
                      key={row.teamId}
                      disabled={saving}
                      onClick={() => handlePickWinner(tiedIds, row.teamId)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                        isCurrentWinner
                          ? 'bg-[#1e3a5f] text-white ring-2 ring-[#1e3a5f]'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-amber-400'
                      }`}
                    >
                      {row.teamName}
                      {isCurrentWinner && ' ✓'}
                    </button>
                  );
                })}
              </div>
              {saving && (
                <p className="text-xs text-amber-600 mt-2">Saving tiebreak…</p>
              )}
            </div>
          );
        })}
    </div>
  );
}
