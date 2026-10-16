'use client';

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Tournament } from '@/types';
import { formatDate } from '@/utils/date';

interface TournamentKeyFactsProps {
  tournament: Tournament;
  registeredTeams: number;
  maxTeams: number;
}

function getDateRange(tournament: Tournament): { start?: string; end?: string } {
  const starts = (tournament.ageGroups ?? []).map((ag) => ag.startDate).filter(Boolean) as string[];
  const ends = (tournament.ageGroups ?? []).map((ag) => ag.endDate).filter(Boolean) as string[];
  return {
    start: tournament.startDate || starts.sort()[0],
    end: tournament.endDate || ends.sort().reverse()[0],
  };
}

export function getFeeRange(tournament: Tournament): { min: number; max: number } | null {
  const fees = (tournament.ageGroups ?? [])
    .map((ag) => ag.participationFee)
    .filter((fee): fee is number => fee !== undefined && fee !== null)
    .map(Number)
    .filter((fee) => Number.isFinite(fee));
  if (fees.length === 0) {
    const fee = Number(tournament.participationFee ?? tournament.registrationFee);
    return Number.isFinite(fee) && fee > 0 ? { min: fee, max: fee } : null;
  }
  return { min: Math.min(...fees), max: Math.max(...fees) };
}

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 min-w-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--uefa-blue,#0b2b5b)]/10 text-[var(--uefa-blue,#0b2b5b)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <div className="text-sm font-medium text-gray-900 break-words">{children}</div>
      </div>
    </div>
  );
}

const iconClass = 'w-4 h-4';

export default function TournamentKeyFacts({ tournament, registeredTeams, maxTeams }: TournamentKeyFactsProps) {
  const { t } = useTranslation();
  const { start, end } = getDateRange(tournament);
  const fee = getFeeRange(tournament);
  const currency = tournament.currency || 'EUR';
  const ageGroupLabels = (tournament.ageGroups ?? [])
    .map((ag) => ag.displayLabel || `U${new Date().getFullYear() - ag.birthYear}`)
    .join(', ');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4">
      {(start || end) && (
        <Fact
          label={t('tournament.dates', 'Dates')}
          icon={
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        >
          {start ? formatDate(start) : '—'}
          {end && end !== start ? ` – ${formatDate(end)}` : ''}
        </Fact>
      )}

      <Fact
        label={t('tournament.venue', 'Venue')}
        icon={
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        {tournament.venueName && <span className="block">{tournament.venueName}</span>}
        <span className={tournament.venueName ? 'block text-xs font-normal text-gray-500' : undefined}>
          {tournament.location || t('common.online')}
        </span>
      </Fact>

      {ageGroupLabels && (
        <Fact
          label={t('tournaments.ageGroups.title', 'Age Categories')}
          icon={
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
        >
          {ageGroupLabels}
        </Fact>
      )}

      <Fact
        label={t('common.teams', 'Teams')}
        icon={
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        {registeredTeams} / {maxTeams > 0 ? maxTeams : '∞'}
      </Fact>

      {fee && (
        <Fact
          label={t('tournaments.ageGroups.participationFee', 'Participation Fee')}
          icon={
            <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          {fee.min === 0 && fee.max === 0
            ? t('tournaments.freeEntry', 'Free entry')
            : fee.min === fee.max
              ? `${fee.min} ${currency}`
              : `${fee.min} – ${fee.max} ${currency}`}
        </Fact>
      )}
    </div>
  );
}
