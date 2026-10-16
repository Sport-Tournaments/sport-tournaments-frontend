'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, Loading, TeamLogo } from '@/components/ui';
import { groupService } from '@/services';

// Per-page-session cache so switching tabs back and forth doesn't refetch.
const groupsCache = new Map<string, any[]>();

interface PublicGroupsPanelProps {
  tournamentId: string;
  ageGroupId?: string;
  emptyMessage: string;
}

/**
 * Groups for one age group. Rendered only when its tab is active (Tabs renders
 * the active panel only), so groups are fetched lazily per age group instead
 * of for every age group on page load.
 */
export default function PublicGroupsPanel({ tournamentId, ageGroupId, emptyMessage }: PublicGroupsPanelProps) {
  const { t } = useTranslation();
  const cacheKey = `${tournamentId}:${ageGroupId ?? 'root'}`;
  const [groups, setGroups] = useState<any[] | null>(() => groupsCache.get(cacheKey) ?? null);

  useEffect(() => {
    const cached = groupsCache.get(cacheKey);
    if (cached) {
      setGroups(cached);
      return;
    }

    let cancelled = false;
    setGroups(null);
    groupService
      .getGroups(tournamentId, ageGroupId)
      .then((res) => {
        const data = (res as any)?.data ?? res ?? [];
        const list = Array.isArray(data) ? data : [];
        groupsCache.set(cacheKey, list);
        if (!cancelled) setGroups(list);
      })
      .catch((err) => {
        console.error('Failed to fetch groups:', err);
        if (!cancelled) setGroups([]);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, tournamentId, ageGroupId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('tournament.groups')}</CardTitle>
      </CardHeader>
      <CardContent>
        {groups === null ? (
          <div className="flex justify-center py-8">
            <Loading size="md" />
          </div>
        ) : groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group: any) => {
              const teamDetails: any[] = Array.isArray(group.teamDetails) ? group.teamDetails : [];
              return (
                <div key={group.id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                    {t('groups.group')} {group.groupLetter}
                  </h4>
                  <div className="space-y-2">
                    {teamDetails.map((teamDetail: any, idx: number) => {
                      const name = teamDetail?.team?.name || teamDetail?.club?.name || `Team ${idx + 1}`;
                      return (
                        <div key={teamDetail?.id || idx} className="flex items-center gap-2 text-sm text-gray-700">
                          <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shrink-0">
                            {idx + 1}
                          </span>
                          <TeamLogo src={teamDetail?.club?.logo} name={teamDetail?.club?.name || name} size="sm" />
                          <span className="truncate">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
