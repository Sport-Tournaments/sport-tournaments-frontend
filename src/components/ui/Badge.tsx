'use client';

import { cn } from '@/utils/helpers';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  icon,
}: BadgeProps) {
  // Map aliases to actual variants
  const normalizedVariant = variant === 'danger' ? 'error' : variant === 'default' ? 'neutral' : variant;
  
  const variantStyles = {
    primary: 'badge-primary',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        variantStyles[normalizedVariant],
        sizeStyles[size],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
