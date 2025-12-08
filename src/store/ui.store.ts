'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'ro';

interface UIState {
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'en',
      sidebarOpen: true,
      mobileMenuOpen: false,

      setTheme: (theme) => {
        set({ theme });
        
        // Apply theme to document
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      },

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
      partialize: (state) => ({ 
        theme: state.theme, 
        language: state.language,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
