'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loading } from '@/components/ui';
import { crmService } from '@/services';
import type { Lead, LeadFilters, LeadStatus } from '@/types/crm';
import { cn } from '@/utils/helpers';
import { FollowUpLabel, LeadPriorityBadge } from './LeadBadges';
import { LEAD_STATUSES, typeLabel, userName } from './crmMeta';

const PER_COLUMN = 50;

interface LeadsBoardProps {
  /** Pipeline filters, minus status (each column is a status). */
  filters: LeadFilters;
  refreshKey: number;
  onChanged: () => void;
  onError: (message: string) => void;
}

type Column = { leads: Lead[]; total: number };

/** Kanban view of the pipeline; drag a card to another column to move it. */
export default function LeadsBoard({ filters, refreshKey, onChanged, onError }: LeadsBoardProps) {
  const [columns, setColumns] = useState<Record<string, Column>>({});
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { status: _status, page: _page, ...rest } = filters;
      const results = await Promise.all(
        LEAD_STATUSES.map((s) =>
          crmService.getLeads({
            ...rest,
            status: s.value,
            pageSize: PER_COLUMN,
            sortBy: rest.sortBy ?? 'nextFollowUpAt',
            sortOrder: rest.sortOrder ?? 'ASC',
          }),
        ),
      );
      setColumns(
        Object.fromEntries(
          LEAD_STATUSES.map((s, i) => [s.value, { leads: results[i].data ?? [], total: results[i].meta?.total ?? 0 }]),
        ),
      );
    } catch (err: any) {
      onError(err?.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [filters, onError]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const move = async (leadId: string, from: LeadStatus, to: LeadStatus) => {
    if (from === to) return;
    const lead = columns[from]?.leads.find((l) => l.id === leadId);
    if (!lead) return;
    // Optimistic move; reload on failure.
    setColumns((cols) => ({
      ...cols,
      [from]: { leads: cols[from].leads.filter((l) => l.id !== leadId), total: cols[from].total - 1 },
      [to]: { leads: [{ ...lead, status: to }, ...cols[to].leads], total: cols[to].total + 1 },
    }));
    try {
      await crmService.updateLead(leadId, { status: to });
      onChanged();
    } catch (err: any) {
      onError(err?.message || 'Failed to move lead');
      load();
    }
  };

  if (loading && Object.keys(columns).length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STATUSES.map((s) => {
        const col = columns[s.value] ?? { leads: [], total: 0 };
        return (
          <div
            key={s.value}
            className={cn(
              'flex w-72 shrink-0 flex-col rounded-xl bg-gray-50 border',
              dragOver === s.value ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200',
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(s.value);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const [id, from] = e.dataTransfer.getData('text/plain').split('|');
              if (id && from) move(id, from as LeadStatus, s.value);
            }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <span className={cn('size-2.5 rounded-full', s.bar)} />
                <span className="text-sm font-semibold text-gray-800">{s.label}</span>
              </div>
              <span className="text-xs font-medium text-gray-500 tabular-nums">{col.total}</span>
            </div>
            <div className="flex-1 space-y-2 p-2 min-h-[120px] max-h-[70vh] overflow-y-auto">
              {col.leads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', `${lead.id}|${lead.status}`)}
                  className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:shadow active:cursor-grabbing"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/dashboard/admin/crm/${lead.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary hover:underline line-clamp-2"
                    >
                      {lead.name}
                    </Link>
                    <LeadPriorityBadge priority={lead.priority} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 truncate">
                    {typeLabel(lead.type)}
                    {lead.contactName && ` · ${lead.contactName}`}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <FollowUpLabel value={lead.nextFollowUpAt} status={lead.status} />
                    {lead.assignedTo && (
                      <span
                        className="flex size-6 items-center justify-center rounded-full bg-[var(--uefa-blue,#0b2b5b)] text-[10px] font-semibold text-white"
                        title={userName(lead.assignedTo)}
                      >
                        {lead.assignedTo.firstName?.charAt(0)}
                        {lead.assignedTo.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  {/* Keyboard / touch fallback for drag-and-drop. */}
                  <select
                    aria-label="Move to stage"
                    className="mt-2 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600"
                    value={lead.status}
                    onChange={(e) => move(lead.id, lead.status, e.target.value as LeadStatus)}
                  >
                    {LEAD_STATUSES.map((o) => (
                      <option key={o.value} value={o.value}>
                        Move to: {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {col.total > col.leads.length && (
                <p className="px-1 text-center text-xs text-gray-500">
                  +{col.total - col.leads.length} more — use the list view to see all
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
