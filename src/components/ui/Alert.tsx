import React from 'react';
import { cn } from '@/utils/helpers';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onClose?: () => void;
  accentBorder?: boolean;
}

const variantStyles: Record<AlertVariant, { container: string; title: string; text: string; border: string; icon: string }> = {
  success: {
    container: 'bg-green-50',
    title: 'text-green-800',
    text: 'text-green-700',
    border: 'border-green-400',
    icon: 'text-green-500',
  },
  error: {
    container: 'bg-red-50',
    title: 'text-red-800',
    text: 'text-red-700',
    border: 'border-red-400',
    icon: 'text-red-500',
  },
  warning: {
    container: 'bg-yellow-50',
    title: 'text-yellow-800',
    text: 'text-yellow-700',
    border: 'border-yellow-400',
    icon: 'text-yellow-500',
  },
  info: {
    container: 'bg-blue-50',
    title: 'text-blue-800',
    text: 'text-blue-700',
    border: 'border-blue-400',
    icon: 'text-blue-500',
  },
};

const icons: Record<AlertVariant, React.ReactNode> = {
  success: (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm2.707-10.707a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293a1 1 0 10-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.516 11.59c.75 1.334-.213 2.999-1.742 2.999H3.483c-1.53 0-2.492-1.665-1.742-2.999L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 9a1 1 0 112 0v5a1 1 0 11-2 0V9zm1-4a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 5z" clipRule="evenodd" />
    </svg>
  ),
};

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  accentBorder = false,
  className,
  ...props
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 p-4',
        accentBorder ? 'border-l-4' : 'rounded-md',
        styles.container,
        accentBorder && styles.border,
        className
      )}
      {...props}
    >
      <div className={cn('shrink-0', styles.icon)}>{icons[variant]}</div>
      <div className={cn('flex-1 text-sm', styles.text)}>
        {title && <h3 className={cn('font-medium', styles.title)}>{title}</h3>}
        <div className={cn(title && 'mt-1')}>{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-3 inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Dismiss</span>
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
}
