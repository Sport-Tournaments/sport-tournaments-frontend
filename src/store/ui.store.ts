'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
type Language = 'en' | 'ro';

interface UIState {
  language: Language;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Actions
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
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

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      language: 'en',
      sidebarOpen: true,
      mobileMenuOpen: false,

      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (sidebarOpen) => {
        set({ sidebarOpen });
      },

      closeSidebar: () => {
        set({ sidebarOpen: false });
      },

      toggleMobileMenu: () => {
        set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }));
      },

      setMobileMenuOpen: (mobileMenuOpen) => {
        set({ mobileMenuOpen });
      },
    }),
    {
      name: 'ui-storage',
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
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }) as UIState,
    }
  )
);
