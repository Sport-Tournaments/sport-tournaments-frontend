'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';
import { User, UserRole } from '@/types';

interface UseAuthOptions {
  redirectTo?: string;
  redirectIfFound?: boolean;
  allowedRoles?: UserRole[];
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; country: string; phone?: string; role?: 'ORGANIZER' | 'PARTICIPANT' }) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  fetchUser: () => Promise<void>;
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo, redirectIfFound = false, allowedRoles } = options;
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    fetchUser,
  } = useAuthStore();

  useEffect(() => {
    // Fetch user on mount if authenticated but no user data
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  useEffect(() => {
    // Handle redirects
    if (!isLoading) {
      if (!isAuthenticated && redirectTo && !redirectIfFound) {
        router.push(redirectTo);
      } else if (isAuthenticated && redirectTo && redirectIfFound) {
        router.push(redirectTo);
      }
    }
  }, [isAuthenticated, isLoading, redirectTo, redirectIfFound, router]);

  useEffect(() => {
    // Check role restrictions
    if (!isLoading && isAuthenticated && user && allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        router.push('/auth/unauthorized');
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      await storeLogin(email, password);
    },
    [storeLogin]
  );

  const register = useCallback(
    async (data: { email: string; password: string; firstName: string; lastName: string; country: string; phone?: string; role?: 'ORGANIZER' | 'PARTICIPANT' }) => {
      await storeRegister(data);
    },
    [storeRegister]
  );

  const logout = useCallback(async () => {
    await storeLogout();
    router.push('/auth/login');
  }, [storeLogout, router]);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role);
      }
      return user.role === role;
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    fetchUser,
  };
}

export default useAuth;
