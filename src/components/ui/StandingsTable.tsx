'use client';

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

export default function StandingsTable({
  matches,
  teamNames,
  groupLabel,
  highlightTopN,
}: StandingsTableProps) {
  const rows = computeStandings(matches, teamNames);

  if (rows.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 text-sm">
        No standings data yet — results will appear here as matches are played.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
            return (
              <tr
                key={row.teamId}
                className={
                  isPromoted
                    ? 'bg-green-50 hover:bg-green-100'
                    : 'bg-white hover:bg-gray-50'
                }
              >
                <td className="px-3 py-2 text-center text-gray-400 font-medium">
                  {rank}
                </td>
                <td className="px-3 py-2 font-medium text-gray-900 flex items-center gap-2">
                  {isPromoted && (
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-green-500 flex-shrink-0"
                      title="Promotion spot"
                    />
                  )}
                  {row.teamName}
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
    </div>
  );
}
