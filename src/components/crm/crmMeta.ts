import type { BadgeProps } from '@/components/ui/Badge';
import type { LeadActivityType, LeadPriority, LeadStatus, LeadType } from '@/types/crm';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

/** Pipeline stages in funnel order. */
export const LEAD_STATUSES: { value: LeadStatus; label: string; variant: BadgeVariant; bar: string }[] = [
  { value: 'NEW', label: 'New', variant: 'gray', bar: 'bg-[#94a3b8]' },
  { value: 'CONTACTED', label: 'Contacted', variant: 'blue', bar: 'bg-blue-500' },
  { value: 'QUALIFIED', label: 'Qualified', variant: 'indigo', bar: 'bg-indigo-500' },
  { value: 'NEGOTIATION', label: 'Negotiation', variant: 'purple', bar: 'bg-purple-500' },
  { value: 'WON', label: 'Won', variant: 'green', bar: 'bg-emerald-500' },
  { value: 'LOST', label: 'Lost', variant: 'red', bar: 'bg-red-400' },
];

export const LEAD_TYPES: { value: LeadType; label: string }[] = [
  { value: 'TOURNAMENT', label: 'Tournament' },
  { value: 'CLUB', label: 'Club' },
  { value: 'ORGANIZER', label: 'Organizer' },
];

export const LEAD_PRIORITIES: { value: LeadPriority; label: string; variant: BadgeVariant }[] = [
  { value: 'HIGH', label: 'High', variant: 'red' },
  { value: 'MEDIUM', label: 'Medium', variant: 'yellow' },
  { value: 'LOW', label: 'Low', variant: 'gray' },
];

export const ACTIVITY_LABELS: Record<LeadActivityType, string> = {
  NOTE: 'Note',
  CALL: 'Call',
  EMAIL: 'Email',
  MEETING: 'Meeting',
  STATUS_CHANGE: 'Status change',
  ASSIGNMENT: 'Assignment',
};

export const statusMeta = (s: LeadStatus) => LEAD_STATUSES.find((x) => x.value === s) ?? LEAD_STATUSES[0];
export const priorityMeta = (p: LeadPriority) => LEAD_PRIORITIES.find((x) => x.value === p) ?? LEAD_PRIORITIES[1];
export const typeLabel = (t: LeadType) => LEAD_TYPES.find((x) => x.value === t)?.label ?? t;

export const isClosed = (s: LeadStatus) => s === 'WON' || s === 'LOST';

export function userName(u?: { firstName?: string; lastName?: string; email?: string } | null): string {
  if (!u) return '';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.email || '';
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** 'overdue' | 'today' | 'upcoming' | null — for follow-up highlighting. */
export function followUpState(value: string | null, status: LeadStatus, now = new Date()) {
  if (!value || isClosed(status)) return null;
  const d = new Date(value);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  if (d < start) return 'overdue' as const;
  if (d <= end) return 'today' as const;
  return 'upcoming' as const;
}

/** ISO string → value for <input type="datetime-local"> (local time). */
export function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value → ISO string (or null when empty). */
export function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function canUseCrm(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

/** Country code assumed for national-format numbers (e.g. "0722 123 456"). */
const DEFAULT_COUNTRY_CODE = '40';

/** Split a phone field that may hold several numbers ("+40… / +40…"). */
export function splitPhones(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[/;,]|\s+or\s+/i)
    .map((p) => p.trim())
    .filter((p) => /\d{6,}/.test(p.replace(/\D/g, '')));
}

/** E.164 digits without '+', or null when the number can't be normalised. */
export function internationalDigits(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return DEFAULT_COUNTRY_CODE + digits.slice(1);
  return digits;
}

export function telHref(phone: string): string {
  const digits = internationalDigits(phone);
  return digits ? `tel:+${digits}` : `tel:${phone.replace(/[^\d+]/g, '')}`;
}

export function whatsappHref(phone: string): string | null {
  const digits = internationalDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}
