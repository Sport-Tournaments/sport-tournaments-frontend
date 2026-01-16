import React from 'react';
import { cn } from '@/utils';

interface ClubColorBannerProps {
  primaryColor?: string;
  secondaryColor?: string;
  height?: 'sm' | 'md' | 'lg' | 'xl';
  pattern?: 'gradient' | 'stripes' | 'diagonal' | 'radial';
  opacity?: number;
  children?: React.ReactNode;
  className?: string;
}

export function ClubColorBanner({
  primaryColor = '#1E40AF',
  secondaryColor = '#FFFFFF',
  height = 'md',
  pattern = 'gradient',
  opacity = 0.15,
  children,
  className,
}: ClubColorBannerProps) {
  const heightClasses = {
    sm: 'h-32 sm:h-40',
    md: 'h-40 sm:h-48 md:h-56',
    lg: 'h-48 sm:h-56 md:h-64 lg:h-72',
    xl: 'h-56 sm:h-64 md:h-72 lg:h-80 xl:h-96',
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    const base = {
      opacity,
    };

    switch (pattern) {
      case 'gradient':
        return {
          ...base,
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        };
      
      case 'stripes':
        return {
          ...base,
          background: `repeating-linear-gradient(
            90deg,
            ${primaryColor} 0px,
            ${primaryColor} 80px,
            ${secondaryColor} 80px,
            ${secondaryColor} 160px
          )`,
        };
      
      case 'diagonal':
        return {
          ...base,
          background: `repeating-linear-gradient(
            45deg,
            ${primaryColor} 0px,
            ${primaryColor} 60px,
            ${secondaryColor} 60px,
            ${secondaryColor} 120px
          )`,
        };
      
      case 'radial':
        return {
          ...base,
          background: `radial-gradient(circle at 30% 50%, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        };
      
      default:
        return base;
    }
  };

  return (
    <div className={cn('relative w-full overflow-hidden', heightClasses[height], className)}>
      {/* Background Pattern */}
      <div
        className="absolute inset-0 w-full h-full"
        style={getBackgroundStyle()}
      />
      
      {/* Overlay Gradient for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20" />
      
      {/* Content */}
      <div className="relative h-full w-full">
        {children}
      </div>
    </div>
  );
}
