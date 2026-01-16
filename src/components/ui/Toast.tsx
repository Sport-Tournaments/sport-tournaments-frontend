import React from 'react';
import { cn } from '@/utils/helpers';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title?: string;
  message: string;
  onClose?: (id: string) => void;
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export default function Toast({ id, type = 'info', title, message, onClose }: ToastProps) {
  return (
    <div className={cn('w-full rounded-lg border px-4 py-3 shadow-sm', toastStyles[type])} role="status">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          {title && <p className="text-sm font-semibold">{title}</p>}
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => onClose(id)}
            className="text-current/60 hover:text-current"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
