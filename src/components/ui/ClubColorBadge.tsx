import React from 'react';
import { cn } from '@/utils';

interface ClubColorBadgeProps {
  primaryColor?: string;
  secondaryColor?: string;
  size?: 'sm' | 'md' | 'lg';
  showHex?: boolean;
  className?: string;
}

export function ClubColorBadge({
  primaryColor,
  secondaryColor,
  size = 'md',
  showHex = false,
  className,
}: ClubColorBadgeProps) {
  if (!primaryColor && !secondaryColor) return null;

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const containerClass = cn('inline-flex items-center gap-2', className);

  return (
    <div className={containerClass}>
      {primaryColor && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              sizeClasses[size],
              'rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-110'
            )}
            style={{ backgroundColor: primaryColor }}
            title={`Primary: ${primaryColor}`}
          />
          {showHex && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">Primary</span>
              <span className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                {primaryColor}
              </span>
            </div>
          )}
        </div>
      )}
      
      {secondaryColor && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              sizeClasses[size],
              'rounded-lg border-2 border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-110'
            )}
            style={{ backgroundColor: secondaryColor }}
            title={`Secondary: ${secondaryColor}`}
          />
          {showHex && (
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 dark:text-gray-400">Secondary</span>
              <span className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                {secondaryColor}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface ClubColorStripesProps {
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

export function ClubColorStripes({
  primaryColor = '#1E40AF',
  secondaryColor = '#FFFFFF',
  className,
}: ClubColorStripesProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg h-20 w-full shadow-md', className)}>
      {/* Vertical stripes pattern */}
      <div className="flex h-full">
        <div className="flex-1" style={{ backgroundColor: primaryColor }} />
        <div className="flex-1" style={{ backgroundColor: secondaryColor }} />
        <div className="flex-1" style={{ backgroundColor: primaryColor }} />
        <div className="flex-1" style={{ backgroundColor: secondaryColor }} />
        <div className="flex-1" style={{ backgroundColor: primaryColor }} />
      </div>
      
      {/* Overlay gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
    </div>
  );
}
