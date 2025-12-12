'use client';

import { cn } from '@/utils/helpers';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  accentBorder?: boolean;
}

export default function Alert({
  variant = 'info',
  title,
  children,
  className,
  onClose,
  accentBorder = false,
}: AlertProps) {
  const variantStyles = {
    success: accentBorder
      ? 'border-l-4 border-green-400 bg-green-50 dark:bg-green-500/10 dark:border-green-500'
      : 'rounded-md bg-green-50 dark:bg-green-500/10',
    error: accentBorder
      ? 'border-l-4 border-red-400 bg-red-50 dark:bg-red-500/10 dark:border-red-500'
      : 'rounded-md bg-red-50 dark:bg-red-500/10',
    warning: accentBorder
      ? 'border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 dark:border-yellow-500'
      : 'rounded-md bg-yellow-50 dark:bg-yellow-500/10',
    info: accentBorder
      ? 'border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-500/10 dark:border-blue-500'
      : 'rounded-md bg-blue-50 dark:bg-blue-500/10',
  };

  const iconColorStyles = {
    success: 'text-green-400 dark:text-green-500',
    error: 'text-red-400 dark:text-red-500',
    warning: 'text-yellow-400 dark:text-yellow-500',
    info: 'text-blue-400 dark:text-blue-500',
  };

  const titleColorStyles = {
    success: 'text-green-800 dark:text-green-400',
    error: 'text-red-800 dark:text-red-400',
    warning: 'text-yellow-800 dark:text-yellow-300',
    info: 'text-blue-800 dark:text-blue-400',
  };

  const textColorStyles = {
    success: 'text-green-700 dark:text-green-300',
    error: 'text-red-700 dark:text-red-300',
    warning: 'text-yellow-700 dark:text-yellow-200',
    info: 'text-blue-700 dark:text-blue-300',
  };

  const closeButtonStyles = {
    success: 'text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50 dark:hover:bg-green-500/20 dark:focus:ring-offset-transparent',
    error: 'text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50 dark:hover:bg-red-500/20 dark:focus:ring-offset-transparent',
    warning: 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50 dark:hover:bg-yellow-500/20 dark:focus:ring-offset-transparent',
    info: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50 dark:hover:bg-blue-500/20 dark:focus:ring-offset-transparent',
  };

  const icons = {
    success: (
      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <div className={cn('p-4', variantStyles[variant], className)} role="alert">
      <div className="flex">
        <div className={cn('shrink-0', iconColorStyles[variant])}>{icons[variant]}</div>
        <div className="ml-3 flex-1">
          {title && <h3 className={cn('text-sm font-medium', titleColorStyles[variant])}>{title}</h3>}
          <div className={cn('text-sm', textColorStyles[variant], title && 'mt-2')}>{children}</div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  closeButtonStyles[variant]
                )}
                aria-label="Dismiss"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
