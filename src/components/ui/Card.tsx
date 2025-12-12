'use client';

import { HTMLAttributes } from 'react';
import { cn } from '@/utils/helpers';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  className,
  variant = 'default',
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: 'overflow-hidden rounded-lg bg-white shadow-sm dark:bg-gray-800/50 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/10',
    hover: 'overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md cursor-pointer dark:bg-gray-800/50 dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/10 dark:hover:ring-white/20',
    flat: 'overflow-hidden rounded-lg bg-white dark:bg-gray-800/50',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'px-4 py-5 sm:p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('border-b border-gray-200 px-4 py-5 sm:px-6 dark:border-white/10', className)} {...props}>
      {children}
    </div>
  );
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export function CardTitle({
  className,
  as: Component = 'h3',
  children,
  ...props
}: CardTitleProps) {
  return (
    <Component
      className={cn('text-base font-semibold text-gray-900 dark:text-white', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({
  className,
  children,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('px-4 py-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6 dark:border-white/10 dark:bg-gray-700/25',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
