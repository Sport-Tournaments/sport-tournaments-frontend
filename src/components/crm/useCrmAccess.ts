'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { canUseCrm } from './crmMeta';

/** Redirects users without CRM access (anyone but admins and managers). */
export function useCrmAccess() {
  const router = useRouter();
  const { user } = useAuthStore();
  const allowed = canUseCrm(user?.role);

  useEffect(() => {
    if (user && !allowed) router.push('/dashboard');
  }, [user, allowed, router]);

  return { user, allowed, isAdmin: user?.role === 'ADMIN' };
}
