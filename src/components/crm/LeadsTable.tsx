'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Input, Select, Loading, Pagination } from '@/components/ui';
import { crmService } from '@/services';
import type { CrmUser, Lead, LeadFilters, LeadPriority, LeadStatus } from '@/types/crm';
import { FollowUpLabel, LeadPriorityBadge, LeadStatusBadge } from './LeadBadges';
import { LEAD_PRIORITIES, LEAD_STATUSES, LEAD_TYPES, formatDate, typeLabel, userName } from './crmMeta';

const PAGE_SIZE = 25;

const SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Newest first' },
  { value: 'updatedAt:DESC', label: 'Recently updated' },
  { value: 'nextFollowUpAt:ASC', label: 'Follow-up soonest' },
  { value: 'lastContactedAt:ASC', label: 'Least recently contacted' },
  { value: 'priority:DESC', label: 'Priority' },
  { value: 'startDate:ASC', label: 'Event date' },
  { value: 'name:ASC', label: 'Name A–Z' },
];

interface LeadsTableProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  assignees: CrmUser[];
  tags: string[];
  /** Bumped by the parent to force a reload (after import, create, ...). */
  refreshKey: number;
  onChanged: () => void;
  onError: (message: string) => void;
}

export default function LeadsTable({
  filters,
  onFiltersChange,
  assignees,
  tags,
  refreshKey,
  onChanged,
  onError,
}: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(filters.search ?? '');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const page = filters.page ?? 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmService.getLeads({ ...filters, pageSize: PAGE_SIZE });
      setLeads(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      onError(err?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filters, onError]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    setSelected(new Set());
  }, [filters, refreshKey]);

  useEffect(() => {
    setSearch(filters.search ?? '');
  }, [filters.search]);

  const update = (patch: Partial<LeadFilters>) => onFiltersChange({ ...filters, ...patch, page: 1 });

  const assigneeValue = filters.unassigned ? '__none' : (filters.assignedToId ?? '');
  const assigneeOptions = [
    { value: '', label: 'Anyone' },
    { value: 'me', label: 'Assigned to me' },
    { value: '__none', label: 'Unassigned' },
    ...assignees.map((u) => ({ value: u.id, label: userName(u) })),
  ];

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = leads.length > 0 && leads.every((l) => selected.has(l.id));

  const runBulk = async (changes: { status?: LeadStatus; priority?: LeadPriority; assignedToId?: string | null }) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await crmService.bulkUpdate([...selected], changes);
      setSelected(new Set());
      onChanged();
    } catch (err: any) {
      onError(err?.message || 'Bulk update failed');
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search name, organiser, contact, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && update({ search: search || undefined })}
              containerClassName="flex-1"
            />
            <Button variant="primary" onClick={() => update({ search: search || undefined })}>
              Search
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <Select
              aria-label="Status"
              options={[{ value: '', label: 'All stages' }, ...LEAD_STATUSES]}
              value={filters.status ?? ''}
              onChange={(e) => update({ status: (e.target.value || undefined) as LeadStatus | undefined })}
            />
            <Select
              aria-label="Type"
              options={[{ value: '', label: 'All types' }, ...LEAD_TYPES]}
              value={filters.type ?? ''}
              onChange={(e) => update({ type: (e.target.value || undefined) as LeadFilters['type'] })}
            />
            <Select
              aria-label="Priority"
              options={[{ value: '', label: 'Any priority' }, ...LEAD_PRIORITIES]}
              value={filters.priority ?? ''}
              onChange={(e) => update({ priority: (e.target.value || undefined) as LeadPriority | undefined })}
            />
            <Select
              aria-label="Assignee"
              options={assigneeOptions}
              value={assigneeValue}
              onChange={(e) => {
                const v = e.target.value;
                update(
                  v === '__none'
                    ? { unassigned: true, assignedToId: undefined }
                    : { unassigned: undefined, assignedToId: v || undefined },
                );
              }}
            />
            <Select
              aria-label="Follow-up"
              options={[
                { value: '', label: 'Any follow-up' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'today', label: 'Due today' },
                { value: 'week', label: 'Next 7 days' },
                { value: 'none', label: 'Not scheduled' },
              ]}
              value={filters.followUp ?? ''}
              onChange={(e) => update({ followUp: (e.target.value || undefined) as LeadFilters['followUp'] })}
            />
            <Select
              aria-label="Tag"
              options={[{ value: '', label: 'Any tag' }, ...tags.map((t) => ({ value: t, label: `#${t}` }))]}
              value={filters.tag ?? ''}
              onChange={(e) => update({ tag: e.target.value || undefined })}
            />
            <Select
              aria-label="Sort"
              options={SORT_OPTIONS}
              value={`${filters.sortBy ?? 'createdAt'}:${filters.sortOrder ?? 'DESC'}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split(':') as [LeadFilters['sortBy'], LeadFilters['sortOrder']];
                update({ sortBy, sortOrder });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-medium text-blue-900">{selected.size} selected</span>
          <Select
            aria-label="Set stage"
            disabled={bulkBusy}
            options={[{ value: '', label: 'Set stage…' }, ...LEAD_STATUSES]}
            value=""
            onChange={(e) => e.target.value && runBulk({ status: e.target.value as LeadStatus })}
            containerClassName="w-40"
          />
          <Select
            aria-label="Set priority"
            disabled={bulkBusy}
            options={[{ value: '', label: 'Set priority…' }, ...LEAD_PRIORITIES]}
            value=""
            onChange={(e) => e.target.value && runBulk({ priority: e.target.value as LeadPriority })}
            containerClassName="w-40"
          />
          <Select
            aria-label="Assign"
            disabled={bulkBusy}
            options={[
              { value: '', label: 'Assign to…' },
              { value: '__none', label: 'Unassign' },
              ...assignees.map((u) => ({ value: u.id, label: userName(u) })),
            ]}
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) runBulk({ assignedToId: v === '__none' ? null : v });
            }}
            containerClassName="w-48"
          />
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No leads match these filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={allSelected}
                        onChange={() =>
                          setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)))
                        }
                      />
                    </th>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Next follow-up</th>
                    <th className="px-4 py-3">Last contacted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${lead.name}`}
                          checked={selected.has(lead.id)}
                          onChange={() => toggle(lead.id)}
                        />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <Link
                          href={`/dashboard/admin/crm/${lead.id}`}
                          className="font-medium text-gray-900 hover:text-primary hover:underline"
                        >
                          {lead.name}
                        </Link>
                        <div className="text-xs text-gray-500 truncate">
                          {typeLabel(lead.type)}
                          {lead.location && ` · ${lead.location}`}
                          {lead.startDate && ` · ${formatDate(lead.startDate)}`}
                        </div>
                        {lead.tags?.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lead.tags.map((t) => (
                              <span key={t} className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[11px] text-gray-600">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><LeadStatusBadge status={lead.status} /></td>
                      <td className="px-4 py-3"><LeadPriorityBadge priority={lead.priority} /></td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{lead.contactName || <span className="text-gray-400">—</span>}</div>
                        {lead.contactEmail && (
                          <a href={`mailto:${lead.contactEmail}`} className="text-xs text-blue-600 hover:underline">
                            {lead.contactEmail}
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {lead.assignedTo ? userName(lead.assignedTo) : <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <FollowUpLabel value={lead.nextFollowUpAt} status={lead.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(lead.lastContactedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{total} lead{total === 1 ? '' : 's'}</p>
        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => onFiltersChange({ ...filters, page: p })}
          />
        )}
      </div>
    </div>
  );
}
