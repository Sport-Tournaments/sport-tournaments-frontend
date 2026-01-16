import React from 'react';
import { cn } from '@/utils/helpers';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: SpinnerSize;
}

export interface LoadingStateProps {
  message?: string;
  size?: SpinnerSize;
}

export interface LoadingOverlayProps {
  message?: string;
  size?: SpinnerSize;
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn('inline-block animate-spin rounded-full border-2 border-slate-200 border-t-slate-600', sizeClasses[size], className)}
      {...props}
    />
  );
}

export function LoadingState({ message = 'Loading...', size = 'md' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 text-slate-600">
      <Spinner size={size} />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...', size = 'md' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80">
      <LoadingState message={message} size={size} />
    </div>
  );
}

export function Skeleton({ lines = 1, className, ...props }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="h-3 w-full animate-pulse rounded bg-slate-200" />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <Skeleton lines={3} />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <Skeleton lines={1} />
      <Skeleton lines={4} />
    </div>
  );
}

export default function Loading({ size = 'md', className, ...props }: SpinnerProps) {
  return <Spinner size={size} className={className} {...props} />;
}
