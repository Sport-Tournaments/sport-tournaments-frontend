'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User } from '@/types';
import { authService } from '@/services';
import { clearAllTokens } from '@/utils/cookies';

const LOGIN_ERROR_MESSAGE = 'Login failed';
const REGISTRATION_ERROR_MESSAGE = 'Registration failed';

// Helper function to extract error message from axios error or generic error
function extractErrorMessage(error: unknown, defaultMessage: string): string {
  // Check if error is an axios error with our API error structure
  if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  
  // Check if error has a message property
  if (error instanceof Error) {
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
          throw new Error(LOGIN_ERROR_MESSAGE);
        } catch (error: unknown) {
          const message = extractErrorMessage(error, LOGIN_ERROR_MESSAGE);
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
          throw new Error(REGISTRATION_ERROR_MESSAGE);
        } catch (error: unknown) {
          const message = extractErrorMessage(error, REGISTRATION_ERROR_MESSAGE);
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
