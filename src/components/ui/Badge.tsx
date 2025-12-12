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
    primary: 'indigo',
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
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-400/10 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/10 dark:text-yellow-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-400/10 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-400/10 dark:text-pink-400',
  };

  const dotColorStyles: Record<string, string> = {
    gray: 'fill-gray-500 dark:fill-gray-400',
    red: 'fill-red-500 dark:fill-red-400',
    yellow: 'fill-yellow-500 dark:fill-yellow-300',
    green: 'fill-green-500 dark:fill-green-400',
    blue: 'fill-blue-500 dark:fill-blue-400',
    indigo: 'fill-indigo-500 dark:fill-indigo-400',
    purple: 'fill-purple-500 dark:fill-purple-400',
    pink: 'fill-pink-500 dark:fill-pink-400',
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
