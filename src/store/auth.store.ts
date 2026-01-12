'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User } from '@/types';
import { authService } from '@/services';
import { clearAllTokens } from '@/utils/cookies';
import { getApiErrorMessage } from '@/utils/helpers';


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

// Storage fallback for Safari private mode and cross-origin restrictions
const createSafeStorage = () => {
  try {
    // Test if localStorage is available and working
    const testKey = '__storage_test__';
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch (error) {
    // Safari private mode or storage disabled
    console.warn('localStorage not available, using fallback storage:', error);
  }
  
  // Fallback to in-memory storage for Safari private browsing
  const memoryStorage = new Map<string, string>();
  return {
    getItem: (key: string) => memoryStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    removeItem: (key: string) => {
      memoryStorage.delete(key);
    },
    clear: () => {
      memoryStorage.clear();
    },
    get length() {
      return memoryStorage.size;
    },
    key: (index: number) => {
      return Array.from(memoryStorage.keys())[index] ?? null;
    },
  } as Storage;
};

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
          return false;
        } catch (error) {
          const message = getApiErrorMessage(error, 'Login failed');
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
          return false;
        } catch (error) {
          const message = getApiErrorMessage(error, 'Registration failed');
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
      storage: {
        getItem: (name) => {
          const storage = createSafeStorage();
          const value = storage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          const storage = createSafeStorage();
          storage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          const storage = createSafeStorage();
          storage.removeItem(name);
        },
      },
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
