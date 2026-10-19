'use client';

import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select, Textarea, Alert } from '@/components/ui';
import type { CrmUser, Lead, LeadInput } from '@/types/crm';
import {
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  LEAD_TYPES,
  fromLocalInput,
  toLocalInput,
  userName,
} from './crmMeta';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: LeadInput) => Promise<void>;
  assignees: CrmUser[];
  /** Edit mode when provided. */
  lead?: Lead | null;
}

type FormState = {
  [K in
    | 'name'
    | 'contactName'
    | 'contactEmail'
    | 'contactPhone'
    | 'organiser'
    | 'location'
    | 'country'
    | 'website'
    | 'sourceUrl'
    | 'startDate'
    | 'notes'
    | 'lostReason'
    | 'assignedToId'
    | 'tags'
    | 'nextFollowUpAt']: string;
} & Pick<Lead, 'type' | 'status' | 'priority'>;

const fromLead = (lead?: Lead | null): FormState => ({
  name: lead?.name ?? '',
  type: lead?.type ?? 'TOURNAMENT',
  status: lead?.status ?? 'NEW',
  priority: lead?.priority ?? 'MEDIUM',
  contactName: lead?.contactName ?? '',
  contactEmail: lead?.contactEmail ?? '',
  contactPhone: lead?.contactPhone ?? '',
  organiser: lead?.organiser ?? '',
  location: lead?.location ?? '',
  country: lead?.country ?? '',
  website: lead?.website ?? '',
  sourceUrl: lead?.sourceUrl ?? '',
  startDate: lead?.startDate ?? '',
  notes: lead?.notes ?? '',
  lostReason: lead?.lostReason ?? '',
  assignedToId: lead?.assignedToId ?? '',
  tags: (lead?.tags ?? []).join(', '),
  nextFollowUpAt: toLocalInput(lead?.nextFollowUpAt),
});

export default function LeadFormModal({ isOpen, onClose, onSubmit, assignees, lead }: LeadFormModalProps) {
  const [form, setForm] = useState<FormState>(fromLead(lead));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(lead);

  useEffect(() => {
    if (isOpen) {
      setForm(fromLead(lead));
      setError(null);
    }
  }, [isOpen, lead]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    // Empty strings would fail backend validation (e.g. @IsEmail); send
    // null on edit to clear a field, omit on create.
    const blank = isEdit ? null : undefined;
    const text = (v: string) => (v.trim() ? v.trim() : blank);
    const input: LeadInput = {
      name: form.name.trim(),
      status: form.status,
      priority: form.priority,
      contactName: text(form.contactName),
      contactEmail: text(form.contactEmail),
      contactPhone: text(form.contactPhone),
      organiser: text(form.organiser),
      location: text(form.location),
      country: text(form.country),
      website: text(form.website),
      sourceUrl: text(form.sourceUrl),
      startDate: text(form.startDate),
      notes: text(form.notes),
      lostReason: form.status === 'LOST' ? text(form.lostReason) : undefined,
      assignedToId: form.assignedToId || (isEdit ? null : undefined),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      nextFollowUpAt: fromLocalInput(form.nextFollowUpAt) ?? blank,
    };
    if (!isEdit) input.type = form.type;

    setSaving(true);
    setError(null);
    try {
      await onSubmit(input);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...assignees.map((u) => ({ value: u.id, label: `${userName(u)} (${u.role.toLowerCase()})` })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit lead' : 'New lead'}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="lead-form" isLoading={saving}>
            {isEdit ? 'Save changes' : 'Create lead'}
          </Button>
        </div>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            containerClassName="sm:col-span-2"
            placeholder="Tournament, club or organizer name"
          />
          {!isEdit && (
            <Select
              label="Type"
              options={LEAD_TYPES}
              value={form.type}
              onChange={(e) => set('type', e.target.value as FormState['type'])}
            />
          )}
          <Select
            label="Status"
            options={LEAD_STATUSES}
            value={form.status}
            onChange={(e) => set('status', e.target.value as FormState['status'])}
          />
          <Select
            label="Priority"
            options={LEAD_PRIORITIES}
            value={form.priority}
            onChange={(e) => set('priority', e.target.value as FormState['priority'])}
          />
          <Select
            label="Assigned to"
            options={assigneeOptions}
            value={form.assignedToId}
            onChange={(e) => set('assignedToId', e.target.value)}
          />
          {form.status === 'LOST' && (
            <Input
              label="Lost reason"
              value={form.lostReason}
              onChange={(e) => set('lostReason', e.target.value)}
              containerClassName="sm:col-span-2"
            />
          )}
        </div>

        <h4 className="text-sm font-semibold text-gray-900 pt-2">Contact</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Contact name" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} />
          <Input label="Organisation" value={form.organiser} onChange={(e) => set('organiser', e.target.value)} />
          <Input
            label="Email"
            type="email"
            value={form.contactEmail}
            onChange={(e) => set('contactEmail', e.target.value)}
          />
          <Input label="Phone" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          <Input label="Website" value={form.website} onChange={(e) => set('website', e.target.value)} />
          <Input label="Source URL" value={form.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} />
        </div>

        <h4 className="text-sm font-semibold text-gray-900 pt-2">Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} />
          <Input label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} />
          <Input
            label="Event start date"
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate', e.target.value)}
          />
          <Input
            label="Next follow-up"
            type="datetime-local"
            value={form.nextFollowUpAt}
            onChange={(e) => set('nextFollowUpAt', e.target.value)}
          />
          <Input
            label="Tags"
            helperText="Comma separated"
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            containerClassName="sm:col-span-2"
          />
        </div>

        <Textarea
          label="Internal summary"
          helperText="Pinned summary. Use the timeline on the lead page for dated notes."
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </form>
    </Modal>
  );
}
