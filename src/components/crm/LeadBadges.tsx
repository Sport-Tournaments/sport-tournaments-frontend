'use client';

import { Badge } from '@/components/ui';
import type { LeadPriority, LeadStatus } from '@/types/crm';
import { followUpState, formatDateTime, priorityMeta, statusMeta } from './crmMeta';

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const m = statusMeta(status);
  return (
    <Badge variant={m.variant} size="sm" dot>
      {m.label}
    </Badge>
  );
}

export function LeadPriorityBadge({ priority }: { priority: LeadPriority }) {
  const m = priorityMeta(priority);
  return (
    <Badge variant={m.variant} size="sm">
      {m.label}
    </Badge>
  );
}

export function FollowUpLabel({ value, status }: { value: string | null; status: LeadStatus }) {
  const state = followUpState(value, status);
  if (!value) return <span className="text-gray-400">—</span>;
  const cls =
    state === 'overdue'
      ? 'text-red-600 font-medium'
      : state === 'today'
        ? 'text-amber-600 font-medium'
        : 'text-gray-700';
  return (
    <span className={cls} title={state === 'overdue' ? 'Overdue' : undefined}>
      {formatDateTime(value)}
      {state === 'overdue' && ' · overdue'}
    </span>
  );
}
