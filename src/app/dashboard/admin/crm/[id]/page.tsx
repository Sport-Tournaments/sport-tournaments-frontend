'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading, Select, Textarea, Input, Badge } from '@/components/ui';
import { crmService } from '@/services';
import type { CrmUser, Lead, LeadActivity, LeadInput, LeadPriority, LeadStatus, ManualLeadActivityType } from '@/types/crm';
import { cn } from '@/utils/helpers';
import LeadFormModal from '@/components/crm/LeadFormModal';
import { useCrmAccess } from '@/components/crm/useCrmAccess';
import { FollowUpLabel, LeadPriorityBadge, LeadStatusBadge } from '@/components/crm/LeadBadges';
import {
  ACTIVITY_LABELS,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  formatDate,
  formatDateTime,
  fromLocalInput,
  statusMeta,
  toLocalInput,
  typeLabel,
  userName,
} from '@/components/crm/crmMeta';

const COMPOSER_TYPES: { value: ManualLeadActivityType; label: string; placeholder: string }[] = [
  { value: 'NOTE', label: 'Note', placeholder: 'Internal note — only visible to the team' },
  { value: 'CALL', label: 'Log call', placeholder: 'What was discussed on the call?' },
  { value: 'EMAIL', label: 'Log email', placeholder: 'Summary of the email sent / received' },
  { value: 'MEETING', label: 'Log meeting', placeholder: 'Meeting notes and next steps' },
];

const ACTIVITY_DOT: Record<LeadActivity['type'], string> = {
  NOTE: 'bg-amber-400',
  CALL: 'bg-emerald-500',
  EMAIL: 'bg-blue-500',
  MEETING: 'bg-purple-500',
  STATUS_CHANGE: 'bg-[#94a3b8]',
  ASSIGNMENT: 'bg-[#94a3b8]',
};

/** Follow-up shortcuts: N days from now at 09:00 local time. */
const FOLLOW_UP_PRESETS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 days', days: 3 },
  { label: 'Next week', days: 7 },
  { label: 'In 2 weeks', days: 14 },
];

function presetDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();
  const { user, allowed, isAdmin } = useCrmAccess();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [assignees, setAssignees] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [composerType, setComposerType] = useState<ManualLeadActivityType>('NOTE');
  const [composerText, setComposerText] = useState('');
  const [composerFollowUp, setComposerFollowUp] = useState('');
  const [posting, setPosting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [followUpDraft, setFollowUpDraft] = useState('');
  const [lostPrompt, setLostPrompt] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const loadActivities = useCallback(async () => {
    setActivities(await crmService.getActivities(id));
  }, [id]);

  const load = useCallback(async () => {
    try {
      const [l, a, people] = await Promise.all([
        crmService.getLead(id),
        crmService.getActivities(id),
        crmService.getAssignees(),
      ]);
      setLead(l);
      setActivities(a);
      setAssignees(people);
      setFollowUpDraft(toLocalInput(l.nextFollowUpAt));
    } catch (err: any) {
      setError(err?.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (allowed && id) load();
  }, [allowed, id, load]);

  const patch = async (input: LeadInput) => {
    try {
      const updated = await crmService.updateLead(id, input);
      setLead(updated);
      setFollowUpDraft(toLocalInput(updated.nextFollowUpAt));
      await loadActivities();
    } catch (err: any) {
      setError(err?.message || 'Failed to update lead');
    }
  };

  const changeStatus = (status: LeadStatus) => {
    if (status === 'LOST') {
      setLostReason(lead?.lostReason ?? '');
      setLostPrompt(true);
      return;
    }
    patch({ status });
  };

  const postActivity = async () => {
    if (!composerText.trim()) return;
    setPosting(true);
    try {
      await crmService.addActivity(id, {
        type: composerType,
        content: composerText.trim(),
        nextFollowUpAt: fromLocalInput(composerFollowUp) ?? undefined,
      });
      setComposerText('');
      setComposerFollowUp('');
      // Touchpoints can change status / last-contacted / follow-up.
      const [l] = await Promise.all([crmService.getLead(id), loadActivities()]);
      setLead(l);
      setFollowUpDraft(toLocalInput(l.nextFollowUpAt));
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setPosting(false);
    }
  };

  const saveActivityEdit = async (activityId: string) => {
    try {
      await crmService.updateActivity(id, activityId, editingText);
      setEditingId(null);
      await loadActivities();
    } catch (err: any) {
      setError(err?.message || 'Failed to update note');
    }
  };

  const deleteActivity = async (activityId: string) => {
    if (!confirm('Delete this entry?')) return;
    try {
      await crmService.deleteActivity(id, activityId);
      await loadActivities();
    } catch (err: any) {
      setError(err?.message || 'Failed to delete note');
    }
  };

  const deleteLead = async () => {
    if (!confirm('Delete this lead and its whole timeline? This cannot be undone.')) return;
    try {
      await crmService.deleteLead(id);
      router.push('/dashboard/admin/crm');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete lead');
    }
  };

  if (!user || !allowed || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <Link href="/dashboard/admin/crm" className="text-sm text-blue-600 hover:underline">
            ← Back to CRM
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const assigneeName = (uid?: string | null) => {
    if (!uid) return 'nobody';
    const u = assignees.find((a) => a.id === uid);
    return u ? userName(u) : 'a former teammate';
  };

  const describeSystem = (a: LeadActivity) => {
    if (a.type === 'STATUS_CHANGE') {
      const from = a.metadata?.from ? statusMeta(a.metadata.from as LeadStatus).label : '—';
      const to = a.metadata?.to ? statusMeta(a.metadata.to as LeadStatus).label : '—';
      return `moved the lead from ${from} to ${to}`;
    }
    return a.metadata?.to ? `assigned the lead to ${assigneeName(a.metadata.to)}` : 'unassigned the lead';
  };

  const linked =
    lead.tournament
      ? { label: 'Tournament', name: lead.tournament.name, href: `/main/tournaments/${lead.tournament.id}` }
      : lead.club
        ? { label: 'Club', name: lead.club.name, href: `/main/clubs/${lead.club.id}` }
        : lead.organizer
          ? { label: 'Organizer account', name: `${userName(lead.organizer)} · ${lead.organizer.email}`, href: null }
          : null;

  const composer = COMPOSER_TYPES.find((c) => c.value === composerType)!;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

        <div>
          <Link href="/dashboard/admin/crm" className="text-sm text-blue-600 hover:underline">
            ← Back to CRM
          </Link>
          <div className="mt-2 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{lead.name}</h1>
                <LeadStatusBadge status={lead.status} />
                <LeadPriorityBadge priority={lead.priority} />
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {typeLabel(lead.type)} lead
                {lead.source && ` · source: ${lead.source}`} · created {formatDate(lead.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit details
              </Button>
              {isAdmin && (
                <Button variant="danger" onClick={deleteLead}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Pipeline stage">
              {LEAD_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => s.value !== lead.status && changeStatus(s.value)}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm font-medium transition',
                    s.value === lead.status
                      ? 'border-transparent bg-[var(--uefa-blue,#0b2b5b)] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
            {lostPrompt && (
              <div className="mb-4 flex flex-col sm:flex-row gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <Input
                  placeholder="Why was it lost? (optional)"
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  containerClassName="flex-1"
                />
                <Button
                  variant="danger"
                  onClick={async () => {
                    setLostPrompt(false);
                    await patch({ status: 'LOST', lostReason: lostReason.trim() || undefined });
                  }}
                >
                  Mark as lost
                </Button>
                <Button variant="ghost" onClick={() => setLostPrompt(false)}>
                  Cancel
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Owner"
                options={[
                  { value: '', label: 'Unassigned' },
                  ...assignees.map((u) => ({ value: u.id, label: userName(u) })),
                ]}
                value={lead.assignedToId ?? ''}
                onChange={(e) => patch({ assignedToId: e.target.value || null })}
              />
              <Select
                label="Priority"
                options={LEAD_PRIORITIES}
                value={lead.priority}
                onChange={(e) => patch({ priority: e.target.value as LeadPriority })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next follow-up</label>
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={followUpDraft}
                    onChange={(e) => setFollowUpDraft(e.target.value)}
                    onBlur={() => {
                      const next = fromLocalInput(followUpDraft);
                      if (next !== (lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString() : null)) {
                        patch({ nextFollowUpAt: next });
                      }
                    }}
                  />
                  {lead.nextFollowUpAt && (
                    <Button variant="ghost" size="sm" onClick={() => patch({ nextFollowUpAt: null })}>
                      Clear
                    </Button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {FOLLOW_UP_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => patch({ nextFollowUpAt: presetDate(p.days) })}
                      className="rounded-md bg-[#f1f5f9] px-2 py-1 text-xs text-gray-700 hover:bg-[#e2e8f0]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap gap-1" role="tablist" aria-label="Activity type">
                  {COMPOSER_TYPES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      role="tab"
                      aria-selected={composerType === c.value}
                      onClick={() => setComposerType(c.value)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-sm font-medium',
                        composerType === c.value ? 'bg-[var(--uefa-blue,#0b2b5b)] text-white' : 'text-gray-600 hover:bg-[#f1f5f9]',
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  placeholder={composer.placeholder}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postActivity();
                  }}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    Set follow-up
                    <input
                      type="datetime-local"
                      className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      value={composerFollowUp}
                      onChange={(e) => setComposerFollowUp(e.target.value)}
                    />
                  </label>
                  <Button variant="primary" onClick={postActivity} isLoading={posting} disabled={!composerText.trim()}>
                    {composerType === 'NOTE' ? 'Add note' : 'Log activity'}
                  </Button>
                </div>
                {composerType !== 'NOTE' && lead.status === 'NEW' && (
                  <p className="text-xs text-gray-500">Logging a touchpoint moves this lead to Contacted.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">No activity yet. Add a note or log your first touchpoint.</p>
                ) : (
                  <ol className="relative space-y-5 border-l border-gray-200 pl-5">
                    {activities.map((a) => {
                      const system = a.type === 'STATUS_CHANGE' || a.type === 'ASSIGNMENT';
                      const canEdit = !system && (a.authorId === user.id || isAdmin);
                      return (
                        <li key={a.id} className="relative">
                          <span className={cn('absolute -left-[26px] top-1.5 size-3 rounded-full ring-4 ring-white', ACTIVITY_DOT[a.type])} />
                          <div className="flex flex-wrap items-center gap-x-2 text-sm">
                            <span className="font-medium text-gray-900">{userName(a.author) || 'Someone'}</span>
                            {system ? (
                              <span className="text-gray-600">{describeSystem(a)}</span>
                            ) : (
                              <Badge variant="gray" size="sm">
                                {ACTIVITY_LABELS[a.type]}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-400">{formatDateTime(a.createdAt)}</span>
                          </div>
                          {editingId === a.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea rows={3} value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                              <div className="flex gap-2">
                                <Button size="sm" variant="primary" onClick={() => saveActivityEdit(a.id)} disabled={!editingText.trim()}>
                                  Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            a.content && (
                              <p className={cn('mt-1 whitespace-pre-wrap text-sm', system ? 'text-gray-500 italic' : 'text-gray-800')}>
                                {a.content}
                              </p>
                            )
                          )}
                          {canEdit && editingId !== a.id && (
                            <div className="mt-1 flex gap-3 text-xs">
                              <button
                                type="button"
                                className="text-gray-500 hover:text-gray-800"
                                onClick={() => {
                                  setEditingId(a.id);
                                  setEditingText(a.content ?? '');
                                }}
                              >
                                Edit
                              </button>
                              <button type="button" className="text-red-500 hover:text-red-700" onClick={() => deleteActivity(a.id)}>
                                Delete
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <Field label="Name" value={lead.contactName} />
                  <Field label="Organisation" value={lead.organiser} />
                  <Field
                    label="Email"
                    value={lead.contactEmail && (
                      <a href={`mailto:${lead.contactEmail}`} className="text-blue-600 hover:underline break-all">
                        {lead.contactEmail}
                      </a>
                    )}
                  />
                  <Field
                    label="Phone"
                    value={lead.contactPhone && (
                      <a href={`tel:${lead.contactPhone}`} className="text-blue-600 hover:underline">
                        {lead.contactPhone}
                      </a>
                    )}
                  />
                  <Field label="Website" value={lead.website && <ExternalLink href={lead.website} />} />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  {linked && (
                    <Field
                      label={linked.label}
                      value={
                        linked.href ? (
                          <Link href={linked.href} className="text-blue-600 hover:underline">
                            {linked.name}
                          </Link>
                        ) : (
                          linked.name
                        )
                      }
                    />
                  )}
                  <Field label="Location" value={[lead.location, lead.country].filter(Boolean).join(', ')} />
                  <Field label="Event date" value={lead.startDate && formatDate(lead.startDate)} />
                  <Field label="Next follow-up" value={<FollowUpLabel value={lead.nextFollowUpAt} status={lead.status} />} />
                  <Field label="Last contacted" value={lead.lastContactedAt && formatDateTime(lead.lastContactedAt)} />
                  {lead.status === 'LOST' && <Field label="Lost reason" value={lead.lostReason} />}
                  <Field label="Source URL" value={lead.sourceUrl && <ExternalLink href={lead.sourceUrl} />} />
                  <Field
                    label="Tags"
                    value={
                      lead.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {lead.tags.map((t) => (
                            <span key={t} className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-xs text-gray-700">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )
                    }
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internal summary</CardTitle>
              </CardHeader>
              <CardContent>
                {lead.notes ? (
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{lead.notes}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    No summary yet.{' '}
                    <button type="button" className="text-blue-600 hover:underline" onClick={() => setEditOpen(true)}>
                      Add one
                    </button>
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <LeadFormModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        lead={lead}
        assignees={assignees}
        onSubmit={async (input) => {
          const updated = await crmService.updateLead(id, input);
          setLead(updated);
          setFollowUpDraft(toLocalInput(updated.nextFollowUpAt));
          await loadActivities();
        }}
      />
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-900">{value || <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function ExternalLink({ href }: { href: string }) {
  const url = /^https?:\/\//i.test(href) ? href : `https://${href}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
      {href}
    </a>
  );
}
