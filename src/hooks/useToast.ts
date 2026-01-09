'use client';

import { useCallback, useState } from 'react';
import { ToastType } from '@/components/ui/Toast';

interface ToastOptions {
  title?: string;
  duration?: number;
}

interface UseToastReturn {
  toasts: Array<{
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
  }>;
  showToast: (type: ToastType, message: string, options?: ToastOptions) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<UseToastReturn['toasts']>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback(
    (type: ToastType, message: string, options: ToastOptions = {}) => {
      const id = generateId();
      const newToast = {
        id,
        type,
        message,
        title: options.title,
        duration: options.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      if (newToast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, newToast.duration);
      }
    },
    []
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('success', message, options);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('error', message, options);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('warning', message, options);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast('info', message, options);
    },
    [showToast]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    success,
    error,
    warning,
    info,
    removeToast,
    clearToasts,
  };
}

export default useToast;
