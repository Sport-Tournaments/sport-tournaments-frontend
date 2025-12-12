'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/utils/helpers';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const icons = {
  success: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  error: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  warning: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  info: (
    <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
};

const iconStyles = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
  info: 'text-blue-400',
};

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10',
        'transition-all duration-300',
        isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      )}
      role="alert"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={cn('shrink-0', iconStyles[type])}>
            {icons[type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            {title && <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>}
            <p className={cn('text-sm text-gray-500 dark:text-gray-400', title && 'mt-1')}>{message}</p>
          </div>
          <div className="ml-4 flex shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-transparent dark:text-gray-500 dark:hover:text-gray-400 dark:focus:ring-offset-gray-800"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<Omit<ToastProps, 'onClose'>>;
  onClose: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

const positionStyles = {
  'top-right': 'top-0 right-0 sm:top-4 sm:right-4',
  'top-left': 'top-0 left-0 sm:top-4 sm:left-4',
  'bottom-right': 'bottom-0 right-0 sm:bottom-4 sm:right-4',
  'bottom-left': 'bottom-0 left-0 sm:bottom-4 sm:left-4',
  'top-center': 'top-0 left-1/2 -translate-x-1/2 sm:top-4',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2 sm:bottom-4',
};

export function ToastContainer({
  toasts,
  onClose,
  position = 'top-right',
}: ToastContainerProps) {
  return (
    <div
      aria-live="assertive"
      className={cn(
        'pointer-events-none fixed inset-0 z-50 flex flex-col items-end px-4 py-6 sm:items-start sm:p-6',
        position.includes('bottom') && 'justify-end',
        position.includes('left') && 'sm:items-start',
        position.includes('center') && 'sm:items-center'
      )}
    >
      <div className={cn(
        'flex w-full flex-col items-center space-y-4 sm:items-end',
        positionStyles[position]
      )}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

export default Toast;
