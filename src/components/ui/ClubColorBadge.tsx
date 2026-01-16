import React from 'react';
import { cn } from '@/utils/helpers';

export interface ClubColorBadgeProps {
  primaryColor?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showHex?: boolean;
  className?: string;
}

export interface ClubColorStripesProps {
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

const sizeClasses: Record<NonNullable<ClubColorBadgeProps['size']>, string> = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

export function ClubColorBadge({
  primaryColor = '#0f172a',
  secondaryColor = '#e2e8f0',
  size = 'md',
  showHex = false,
  className,
}: ClubColorBadgeProps) {
  return (
    <div className={cn('inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3', sizeClasses[size], className)}>
      <span className="inline-flex h-6 w-6 overflow-hidden rounded-full border border-slate-200">
        <span className="block h-full w-1/2" style={{ backgroundColor: primaryColor }} />
        <span className="block h-full w-1/2" style={{ backgroundColor: secondaryColor }} />
      </span>
      <span className="font-medium text-slate-700">Club Colors</span>
      {showHex && (
        <span className="text-xs text-slate-500">
          {primaryColor} / {secondaryColor}
        </span>
      )}
    </div>
  );
}

export function ClubColorStripes({ primaryColor = '#0f172a', secondaryColor = '#e2e8f0', className }: ClubColorStripesProps) {
  return (
    <div className={cn('flex h-2 w-full overflow-hidden rounded-full border border-slate-200', className)}>
      <span className="block h-full w-1/2" style={{ backgroundColor: primaryColor }} />
      <span className="block h-full w-1/2" style={{ backgroundColor: secondaryColor }} />
    </div>
  );
}
