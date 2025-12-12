'use client';

import { cn, getInitials } from '@/utils/helpers';
import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'busy' | 'away';
}

export default function Avatar({
  src,
  alt = 'Avatar',
  firstName,
  lastName,
  size = 'md',
  className,
  status,
}: AvatarProps) {
  const sizeStyles = {
    xs: 'size-6',
    sm: 'size-8',
    md: 'size-10',
    lg: 'size-12',
    xl: 'size-14',
  };

  const imageSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  const statusSizes = {
    xs: 'size-1.5',
    sm: 'size-2',
    md: 'size-2.5',
    lg: 'size-3',
    xl: 'size-3.5',
  };

  const statusColors = {
    online: 'bg-green-400',
    offline: 'bg-gray-400',
    busy: 'bg-red-400',
    away: 'bg-yellow-400',
  };

  const renderStatus = () => {
    if (!status) return null;
    return (
      <span
        className={cn(
          'absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900',
          statusSizes[size],
          statusColors[status]
        )}
      />
    );
  };

  if (src) {
    return (
      <span className={cn('relative inline-block', className)}>
        <Image
          src={src}
          alt={alt}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className={cn(sizeStyles[size], 'rounded-full object-cover')}
        />
        {renderStatus()}
      </span>
    );
  }

  const initials = getInitials(firstName, lastName);

  if (!initials) {
    // Placeholder icon avatar
    return (
      <span className={cn('relative inline-block', className)}>
        <span
          className={cn(
            sizeStyles[size],
            'inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700'
          )}
          aria-label={alt}
        >
          <svg className="size-[60%] text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </span>
        {renderStatus()}
      </span>
    );
  }

  return (
    <span className={cn('relative inline-block', className)}>
      <span
        className={cn(
          sizeStyles[size],
          textSizes[size],
          'inline-flex items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
        )}
        aria-label={alt}
      >
        {initials}
      </span>
      {renderStatus()}
    </span>
  );
}
