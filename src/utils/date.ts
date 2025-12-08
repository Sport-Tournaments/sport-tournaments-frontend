import { format, formatDistance, formatRelative, parseISO, isValid, isFuture, isPast, isToday, differenceInDays, Locale } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';

const locales: Record<string, Locale> = {
  en: enUS,
  ro: ro,
};

export function getLocale(language: string): Locale {
  return locales[language] || enUS;
}

export function formatDate(
  date: string | Date,
  formatStr = 'PPP',
  language = 'en'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, formatStr, { locale: getLocale(language) });
}

export function formatDateTime(
  date: string | Date,
  language = 'en'
): string {
  return formatDate(date, 'PPP p', language);
}

export function formatShortDate(
  date: string | Date,
  language = 'en'
): string {
  return formatDate(date, 'PP', language);
}

export function formatDateRange(
  startDate: string | Date,
  endDate: string | Date,
  language = 'en'
): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  
  if (!isValid(start) || !isValid(end)) return 'Invalid date range';
  
  const startFormatted = format(start, 'MMM d', { locale: getLocale(language) });
  const endFormatted = format(end, 'MMM d, yyyy', { locale: getLocale(language) });
  
  return `${startFormatted} - ${endFormatted}`;
}

export function formatRelativeTime(
  date: string | Date,
  baseDate: Date = new Date(),
  language = 'en'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistance(d, baseDate, { addSuffix: true, locale: getLocale(language) });
}

export function formatRelativeDate(
  date: string | Date,
  baseDate: Date = new Date(),
  language = 'en'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatRelative(d, baseDate, { locale: getLocale(language) });
}

export function isDateInFuture(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) && isFuture(d);
}

export function isDateInPast(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) && isPast(d);
}

export function isDateToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) && isToday(d);
}

export function getDaysUntil(date: string | Date): number {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 0;
  return differenceInDays(d, new Date());
}

export function getDeadlineStatus(
  deadline: string | Date
): 'expired' | 'urgent' | 'soon' | 'normal' {
  const days = getDaysUntil(deadline);
  if (days < 0) return 'expired';
  if (days <= 1) return 'urgent';
  if (days <= 7) return 'soon';
  return 'normal';
}

export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
