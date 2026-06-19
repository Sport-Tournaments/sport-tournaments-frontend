import React from 'react';
import { cn, getInitials, getFullName } from '@/utils/helpers';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  firstName?: string;
  lastName?: string;
  size?: AvatarSize;
  alt?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'size-6 text-xs',
  sm: 'size-8 text-sm',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

const fallbackColors = [
  { background: '#dbeafe', color: '#1e3a8a' },
  { background: '#dcfce7', color: '#166534' },
  { background: '#fef3c7', color: '#92400e' },
  { background: '#fce7f3', color: '#9d174d' },
  { background: '#ede9fe', color: '#5b21b6' },
  { background: '#cffafe', color: '#155e75' },
  { background: '#fee2e2', color: '#991b1b' },
];

function getInitialsFromName(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getFallbackColor(value: string) {
  const hash = value.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackColors[hash % fallbackColors.length];
}

export default function Avatar({
  src,
  firstName,
  lastName,
  size = 'md',
  alt,
  className,
  ...props
}: AvatarProps) {
  const name = alt || getFullName(firstName, lastName);
  const initials = firstName || lastName
    ? getInitials(firstName, lastName)
    : getInitialsFromName(name);
  const fallbackColor = getFallbackColor(name);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold overflow-hidden',
        sizeClasses[size],
        className
      )}
      style={!src ? fallbackColor : undefined}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span aria-label={name}>{initials}</span>
      )}
    </div>
  );
}
