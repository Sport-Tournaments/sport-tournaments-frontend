'use client';

import { cn, getInitials } from '@/utils/helpers';
import Image from 'next/image';

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function Avatar({
  src,
  alt = 'Avatar',
  firstName,
  lastName,
  size = 'md',
  className,
}: AvatarProps) {
  const sizeStyles = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
    xl: 'avatar-xl',
  };

  const imageSizes = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  if (src) {
    return (
      <div className={cn(sizeStyles[size], 'overflow-hidden', className)}>
        <Image
          src={src}
          alt={alt}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const initials = getInitials(firstName, lastName);

  return (
    <div className={cn(sizeStyles[size], className)} aria-label={alt}>
      {initials}
    </div>
  );
}
