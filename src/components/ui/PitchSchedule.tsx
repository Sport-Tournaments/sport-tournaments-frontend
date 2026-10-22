'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { groupService } from '@/services';
import type { BracketMatch, MatchesResponse } from '@/types';
import { formatDateTime } from '@/utils/date';
import { sortMatchesForDisplay } from './matchSorting';
import Loading from './Loading';
import Alert from './Alert';

export interface PitchScheduleProps {
  tournamentId: string;
  ageGroupId?: string;
}

interface PitchSection {
  key: string;
  label: string | null; // null = matches without a pitch
  matches: BracketMatch[];
}

function pitchLabel(fieldName: string): string {
  return /^\d+$/.test(fieldName) ? `Pitch ${fieldName}` : fieldName;
}

// Groups matches by pitch, pitches sorted naturally (Pitch 2 before Pitch 10),
// matches within a pitch by kick-off time; unassigned matches go last.
export function groupMatchesByPitch(matches: BracketMatch[]): PitchSection[] {
  const byPitch = new Map<string, BracketMatch[]>();
  const unassigned: BracketMatch[] = [];

  for (const match of matches) {
    const fieldName = match.fieldName?.trim();
    if (!fieldName) {
      unassigned.push(match);
      continue;
    }
    const list = byPitch.get(fieldName) ?? [];
    list.push(match);
    byPitch.set(fieldName, list);
  }

  const sections: PitchSection[] = [...byPitch.entries()]
    .map(([fieldName, list]) => ({
      key: fieldName,
      label: pitchLabel(fieldName),
      matches: sortMatchesForDisplay(list, 'datetime'),
    }))
    .sort((a, b) =>
      a.label!.localeCompare(b.label!, undefined, { numeric: true, sensitivity: 'base' })
    );

  if (unassigned.length > 0) {
    sections.push({
      key: '__unassigned__',
      label: null,
      matches: sortMatchesForDisplay(unassigned, 'datetime'),
    });
  }

  return sections;
}

export default function PitchSchedule({ tournamentId, ageGroupId }: PitchScheduleProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<MatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    groupService
      .getMatches(tournamentId, ageGroupId)
      .then((response) => {
        if (cancelled) return;
        setData(((response as { data?: MatchesResponse })?.data ?? response) as MatchesResponse);
      })
      .catch((err) => {
        console.error('Failed to load matches:', err);
        if (!cancelled) setError(t('matches.loadError', 'Failed to load matches. Please try again.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tournamentId, ageGroupId, t]);

  const teamNames = useMemo(() => {
    const map = new Map<string, string>();
    data?.teams?.forEach((team) => map.set(team.id, team.name));
    return map;
  }, [data]);

  const sections = useMemo(() => groupMatchesByPitch(data?.matches ?? []), [data]);

  const teamName = (id?: string, name?: string, sourceSlot?: string) =>
    name || (id && teamNames.get(id)) || sourceSlot || t('matches.tbd', 'TBD');

  // Group matches show their group; other matches show the knockout stage or round
  const stageLabel = (match: BracketMatch) => {
    if (match.groupLetter) return `${t('pitches.group', 'Group')} ${match.groupLetter}`;
    if (data?.bracketType === 'GROUPS_PLUS_KNOCKOUT') return t('pitches.knockout', 'Knockout');
    return `${t('pitches.round', 'Round')} ${match.round}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading size="md" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (sections.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12">
        {t('matches.noMatches', 'No matches have been generated yet.')}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.key}>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {section.label ?? t('pitches.unassigned', 'No pitch assigned')}
            <span className="ml-2 font-normal text-gray-500">({section.matches.length})</span>
          </h3>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {section.matches.map((match) => {
              const hasScore = match.team1Score != null && match.team2Score != null;
              return (
                <li
                  key={match.id}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <span className="w-40 shrink-0 text-sm text-gray-500">
                    {match.scheduledAt
                      ? formatDateTime(match.scheduledAt)
                      : t('pitches.notScheduled', 'Not scheduled')}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {teamName(match.team1Id, match.team1Name, match.team1SourceSlot)}
                    <span className="mx-2 text-gray-500">
                      {hasScore ? `${match.team1Score} - ${match.team2Score}` : 'vs'}
                    </span>
                    {teamName(match.team2Id, match.team2Name, match.team2SourceSlot)}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-gray-600 rounded-full bg-gray-100 px-2 py-0.5 self-start sm:self-auto">
                    {stageLabel(match)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
