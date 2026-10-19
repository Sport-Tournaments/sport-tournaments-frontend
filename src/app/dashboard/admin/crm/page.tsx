'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Alert, Loading, Modal } from '@/components/ui';
import { crmService } from '@/services';
import type { CrmUser, LeadFilters, LeadInput, LeadStats, LeadType } from '@/types/crm';
import { cn } from '@/utils/helpers';
import LeadsTable from '@/components/crm/LeadsTable';
import LeadsBoard from '@/components/crm/LeadsBoard';
import CrmDirectory from '@/components/crm/CrmDirectory';
import LeadFormModal from '@/components/crm/LeadFormModal';
import { useCrmAccess } from '@/components/crm/useCrmAccess';
import { LEAD_STATUSES, LEAD_TYPES, downloadBlob } from '@/components/crm/crmMeta';

type TabId = 'list' | 'board' | 'clubs' | 'organizers';

const TABS: { id: TabId; label: string }[] = [
  { id: 'list', label: 'Pipeline' },
  { id: 'board', label: 'Board' },
  { id: 'clubs', label: 'Clubs' },
  { id: 'organizers', label: 'Organizers' },
];

export default function CrmPage() {
  const { user, allowed } = useCrmAccess();
  const [tab, setTab] = useState<TabId>('list');
  const [filters, setFilters] = useState<LeadFilters>({ page: 1 });
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [assignees, setAssignees] = useState<CrmUser[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importTypes, setImportTypes] = useState<LeadType[]>(['TOURNAMENT', 'CLUB', 'ORGANIZER']);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadMeta = useCallback(async () => {
    try {
      const [s, a, t] = await Promise.all([crmService.getStats(), crmService.getAssignees(), crmService.getTags()]);
      setStats(s);
      setAssignees(a);
      setTags(t);
    } catch (err: any) {
      setError(err?.message || 'Failed to load CRM data');
    }
  }, []);

  useEffect(() => {
    if (allowed) loadMeta();
  }, [allowed, loadMeta, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  const onError = useCallback((m: string) => setError(m), []);

  const applyQuickFilter = (patch: Partial<LeadFilters>) => {
    setFilters({ page: 1, ...patch });
    setTab('list');
  };

  const handleCreate = async (input: LeadInput) => {
    await crmService.createLead(input);
    setSuccess('Lead created');
    refresh();
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const res = await crmService.importLeads(importTypes);
      setSuccess(`Imported ${res.created} new lead${res.created === 1 ? '' : 's'} (${res.skipped} already tracked)`);
      setImportOpen(false);
      refresh();
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      downloadBlob(await crmService.exportCsv(filters), `leads-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err: any) {
      setError(err?.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (!user || !allowed) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const openTotal = stats
    ? stats.total - (stats.byStatus.WON ?? 0) - (stats.byStatus.LOST ?? 0)
    : 0;
  const decided = stats ? (stats.byStatus.WON ?? 0) + (stats.byStatus.LOST ?? 0) : 0;
  const winRate = stats && decided > 0 ? Math.round(((stats.byStatus.WON ?? 0) / decided) * 100) : null;

  const statCards = [
    { label: 'Open leads', value: openTotal, hint: `${stats?.total ?? 0} total`, onClick: () => applyQuickFilter({}) },
    {
      label: 'Overdue follow-ups',
      value: stats?.overdueFollowUps ?? 0,
      hint: 'Needs attention',
      tone: (stats?.overdueFollowUps ?? 0) > 0 ? 'text-red-600' : undefined,
      onClick: () => applyQuickFilter({ followUp: 'overdue', sortBy: 'nextFollowUpAt', sortOrder: 'ASC' }),
    },
    {
      label: 'Due today',
      value: stats?.dueToday ?? 0,
      hint: 'Follow-ups',
      tone: (stats?.dueToday ?? 0) > 0 ? 'text-amber-600' : undefined,
      onClick: () => applyQuickFilter({ followUp: 'today' }),
    },
    {
      label: 'My open leads',
      value: stats?.assignedToMe ?? 0,
      hint: 'Assigned to you',
      onClick: () => applyQuickFilter({ assignedToId: 'me' }),
    },
    {
      label: 'Unassigned',
      value: stats?.unassigned ?? 0,
      hint: 'Open, no owner',
      onClick: () => applyQuickFilter({ unassigned: true }),
    },
    {
      label: 'Win rate',
      value: winRate === null ? '—' : `${winRate}%`,
      hint: `${stats?.byStatus.WON ?? 0} won · ${stats?.byStatus.LOST ?? 0} lost`,
      onClick: () => applyQuickFilter({ status: 'WON' }),
    },
  ];

  const funnelMax = Math.max(1, ...LEAD_STATUSES.map((s) => stats?.byStatus[s.value] ?? 0));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">CRM</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Outreach pipeline for tournament organizers and clubs
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import from platform
            </Button>
            <Button variant="outline" onClick={handleExport} isLoading={exporting}>
              Export CSV
            </Button>
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              New lead
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={c.onClick}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow"
            >
              <p className="text-xs font-medium text-gray-500">{c.label}</p>
              <p className={cn('mt-1 text-2xl font-bold tabular-nums text-gray-900', c.tone)}>{c.value}</p>
              <p className="mt-0.5 text-xs text-gray-500">{c.hint}</p>
            </button>
          ))}
        </div>

        {/* Funnel */}
        {stats && stats.total > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {LEAD_STATUSES.map((s) => {
                  const n = stats.byStatus[s.value] ?? 0;
                  const active = filters.status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => applyQuickFilter(active ? {} : { status: s.value })}
                      className={cn('text-left rounded-lg p-2 -m-2 hover:bg-gray-50', active && 'bg-gray-50 ring-1 ring-gray-200')}
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">{s.label}</span>
                        <span className="font-semibold tabular-nums text-gray-900">{n}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-[#f1f5f9]">
                        <div className={cn('h-2 rounded-full', s.bar)} style={{ width: `${(n / funnelMax) * 100}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-gray-500">
                {LEAD_TYPES.map((t) => `${stats.byType[t.value] ?? 0} ${t.label.toLowerCase()}${(stats.byType[t.value] ?? 0) === 1 ? '' : 's'}`).join(' · ')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="CRM views">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  'whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium',
                  tab === t.id
                    ? 'border-[var(--uefa-blue,#0b2b5b)] text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'list' && (
          <LeadsTable
            filters={filters}
            onFiltersChange={setFilters}
            assignees={assignees}
            tags={tags}
            refreshKey={refreshKey}
            onChanged={refresh}
            onError={onError}
          />
        )}
        {tab === 'board' && (
          <LeadsBoard filters={filters} refreshKey={refreshKey} onChanged={loadMeta} onError={onError} />
        )}
        {tab === 'clubs' && <CrmDirectory kind="clubs" refreshKey={refreshKey} onError={onError} />}
        {tab === 'organizers' && <CrmDirectory kind="organizers" refreshKey={refreshKey} onError={onError} />}
      </div>

      <LeadFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        assignees={assignees}
      />

      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import leads from the platform"
        description="Creates a lead for every record that is not in the CRM yet. Existing leads are left untouched."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setImportOpen(false)} disabled={importing}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImport} isLoading={importing} disabled={importTypes.length === 0}>
              Import
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          {LEAD_TYPES.map((t) => (
            <label key={t.value} className="flex items-center gap-3 text-sm text-gray-800">
              <input
                type="checkbox"
                checked={importTypes.includes(t.value)}
                onChange={(e) =>
                  setImportTypes((cur) => (e.target.checked ? [...cur, t.value] : cur.filter((x) => x !== t.value)))
                }
              />
              {t.label}s
            </label>
          ))}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
