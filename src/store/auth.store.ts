'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import { authService } from '@/services';
import { clearAllTokens } from '@/utils/cookies';

// Helper function to extract error message from axios error or generic error
function extractErrorMessage(error: unknown, defaultMessage: string): string {
  // Check if error has axios response structure
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'error' in error.response.data &&
    error.response.data.error &&
    typeof error.response.data.error === 'object' &&
    'message' in error.response.data.error &&
    typeof error.response.data.error.message === 'string'
  ) {
    return error.response.data.error.message;
  }
  
  // Check if error has a message property
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return defaultMessage;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: Parameters<typeof authService.register>[0]) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => {
        set({ user, isAuthenticated: !!user });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          if (response.success && response.data) {
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              isLoading: false 
            });
            return true;
          }
          set({ isLoading: false, error: 'Login failed' });
          throw new Error('Login failed');
        } catch (error: unknown) {
          const message = extractErrorMessage(error, 'Login failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          if (response.success && response.data) {
            set({ 
              user: response.data.user, 
              isAuthenticated: true,
              isLoading: false 
            });
            return true;
          }
          set({ isLoading: false, error: 'Registration failed' });
          throw new Error('Registration failed');
        } catch (error: unknown) {
          const message = extractErrorMessage(error, 'Registration failed');
          set({ isLoading: false, error: message });
          throw new Error(message);
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (error) {
          // Logout should never fail from user perspective
          console.warn('Logout error (ignored):', error);
        } finally {
          clearAllTokens();
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            set({ 
              user: response.data, 
              isAuthenticated: true,
              isLoading: false 
            });
          } else {
            get().clearAuth();
          }
        } catch {
          get().clearAuth();
        }
      },

      clearAuth: () => {
        clearAllTokens();
        set({ user: null, isAuthenticated: false, isLoading: false, error: null });
      },

      fetchUser: async function() {
        return this.fetchCurrentUser();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
