'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/utils/helpers';

const SIZES = {
  xs: 'w-4 h-4 text-[8px]',
  sm: 'w-5 h-5 text-[9px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
} as const;

export function getTeamInitials(name?: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface TeamLogoProps {
  src?: string | null;
  name?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Club logo with an initials fallback (missing or broken image). */
export default function TeamLogo({ src, name, size = 'sm', className }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZES[size];

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ? `${name} logo` : ''}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(sizeClass, 'shrink-0 rounded-full object-contain bg-white', className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        sizeClass,
        'shrink-0 rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center justify-center leading-none',
        className,
      )}
    >
      {getTeamInitials(name)}
    </span>
  );
}

interface TeamLogoLookup {
  byId: Map<string, string>;
  byName: Map<string, string>;
}

const TeamLogosContext = createContext<TeamLogoLookup | null>(null);

/**
 * Supplies club logos (keyed by registration/team id and by display name) to
 * bracket, schedule and standings components without prop drilling.
 */
export function TeamLogosProvider({
  teams,
  children,
}: {
  teams: Iterable<{ id: string; name?: string; clubName?: string; logo?: string }>;
  children: ReactNode;
}) {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const team of teams) {
    if (!team.logo) continue;
    byId.set(team.id, team.logo);
    if (team.name) byName.set(team.name, team.logo);
    if (team.clubName) byName.set(team.clubName, team.logo);
  }
  return <TeamLogosContext.Provider value={{ byId, byName }}>{children}</TeamLogosContext.Provider>;
}

/** Logo for a match participant; renders initials when the club has no logo. */
export function MatchTeamLogo({
  teamId,
  name,
  size = 'xs',
  className,
}: {
  teamId?: string;
  name?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const lookup = useContext(TeamLogosContext);
  // Outside a provider (or placeholder slots like "TBD"), render nothing.
  if (!lookup || (!teamId && !name)) return null;
  const src = (teamId && lookup.byId.get(teamId)) || (name && lookup.byName.get(name)) || undefined;
  if (!teamId && !src) return null;
  return <TeamLogo src={src} name={name} size={size} className={className} />;
}
