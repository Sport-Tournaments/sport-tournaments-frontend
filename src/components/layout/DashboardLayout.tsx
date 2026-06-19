'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
import { LoadingState } from '@/components/ui';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Get the referrer (previous page) from document.referrer
      // or use /main/tournaments as a sensible default
      const referer = typeof window !== 'undefined' && document.referrer 
        ? new URL(document.referrer).pathname 
        : '/main/tournaments';
      
      // Include callback URL for post-login redirect and backUrl for back button
      const callbackUrl = encodeURIComponent(pathname || '/dashboard');
      const backUrl = encodeURIComponent(referer);
      router.push(`/auth/login?callbackUrl=${callbackUrl}&backUrl=${backUrl}`);
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <div className="flex min-w-0">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col min-h-screen overflow-x-hidden lg:ml-0">
          <DashboardHeader />
          <main className="min-w-0 flex-1 overflow-x-hidden p-2 sm:p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
