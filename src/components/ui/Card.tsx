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
    default: 'overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100',
    hover: 'overflow-hidden rounded-xl bg-white shadow-sm border border-slate-100 transition-all hover:shadow-md hover:border-slate-200 cursor-pointer',
    flat: 'overflow-hidden rounded-xl bg-white',
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
    <div className={cn('border-b border-slate-100 px-4 py-5 sm:px-6', className)} {...props}>
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
      className={cn('text-base font-semibold text-slate-900', className)}
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
      className={cn('mt-1 text-sm text-slate-500', className)}
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
        'flex items-center gap-4 border-t border-slate-100 bg-white px-4 py-4 sm:px-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
