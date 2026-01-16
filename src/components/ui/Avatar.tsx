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

export default function Avatar({
  src,
  firstName,
  lastName,
  size = 'md',
  alt,
  className,
  ...props
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const name = alt || getFullName(firstName, lastName);

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700 font-semibold overflow-hidden',
        sizeClasses[size],
        className
      )}
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
