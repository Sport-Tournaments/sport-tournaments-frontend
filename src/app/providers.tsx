'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks';
import '@/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { toasts, removeToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      // Always use light theme
      root.classList.add('light');
    }
  }, [mounted]);

  // System theme changes are ignored - always use light theme

  if (!mounted) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </QueryClientProvider>
  );
}
