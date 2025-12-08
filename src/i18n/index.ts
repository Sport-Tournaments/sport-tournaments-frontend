'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ro from './locales/ro.json';

export const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en';
export const locales = (process.env.NEXT_PUBLIC_SUPPORTED_LANGUAGES || 'en,ro').split(',');

const resources = {
  en: { translation: en },
  ro: { translation: ro },
};

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLocale,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;

export function getLanguageName(locale: string): string {
  const names: Record<string, string> = {
    en: 'English',
    ro: 'Română',
  };
  return names[locale] || locale;
}

export function getLanguageFlag(locale: string): string {
  const flags: Record<string, string> = {
    en: '🇬🇧',
    ro: '🇷🇴',
  };
  return flags[locale] || '🌐';
}
