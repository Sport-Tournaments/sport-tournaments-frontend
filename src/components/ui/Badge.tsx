'use client';

import { cn } from '@/utils/helpers';

export interface BadgeProps {
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'danger' | 'default' | 'gray' | 'red' | 'yellow' | 'green' | 'blue' | 'indigo' | 'purple' | 'pink';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  dot?: boolean;
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className,
  icon,
  dot,
}: BadgeProps) {
  // Map aliases to color variants
  const colorMap: Record<string, string> = {
    primary: 'teal',
    success: 'green',
    error: 'red',
    danger: 'red',
    warning: 'yellow',
    info: 'blue',
    neutral: 'gray',
    default: 'gray',
  };

  const color = colorMap[variant] || variant;
  
  const colorStyles: Record<string, string> = {
    gray: 'bg-slate-100 text-slate-600',
    red: 'bg-red-50 text-red-700',
    yellow: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    purple: 'bg-purple-50 text-purple-700',
    pink: 'bg-pink-50 text-pink-700',
    teal: 'bg-teal-50 text-teal-700',
  };

  const dotColorStyles: Record<string, string> = {
    gray: 'fill-slate-500',
    red: 'fill-red-500',
    yellow: 'fill-amber-500',
    green: 'fill-emerald-500',
    blue: 'fill-blue-500',
    indigo: 'fill-indigo-500',
    purple: 'fill-purple-500',
    pink: 'fill-pink-500',
    teal: 'fill-teal-500',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-x-1.5 rounded-full font-medium',
        colorStyles[color] || colorStyles.gray,
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <svg viewBox="0 0 6 6" aria-hidden="true" className={cn('size-1.5', dotColorStyles[color] || dotColorStyles.gray)}>
          <circle r={3} cx={3} cy={3} />
        </svg>
      )}
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {children}
    </span>
  );
}
