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
    <div className="min-h-screen bg-white">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          <DashboardHeader />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
