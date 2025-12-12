'use client';

import { useState } from 'react';
import { cn } from '@/utils/helpers';

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'underline' | 'pills' | 'pills-gray';
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  className,
  variant = 'underline',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  const variantContainerStyles = {
    underline: 'border-b border-gray-200 dark:border-white/10',
    pills: '',
    'pills-gray': 'bg-gray-100 p-1 rounded-lg dark:bg-white/5',
  };

  const variantTabStyles = {
    underline: {
      base: 'border-b-2 px-1 pb-4 text-sm font-medium whitespace-nowrap',
      active: 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400',
      inactive: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-white/20 dark:hover:text-gray-300',
    },
    pills: {
      base: 'rounded-md px-3 py-2 text-sm font-medium',
      active: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
      inactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    },
    'pills-gray': {
      base: 'rounded-md px-3 py-1.5 text-sm font-medium',
      active: 'bg-white text-gray-900 shadow-sm dark:bg-white/10 dark:text-white',
      inactive: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
    },
  };

  const styles = variantTabStyles[variant];

  return (
    <div className={className}>
      {/* Mobile dropdown for small screens */}
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">Select a tab</label>
        <select
          id="tabs"
          name="tabs"
          value={activeTab}
          onChange={(e) => handleTabChange(e.target.value)}
          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 dark:bg-white/5 dark:text-white dark:ring-white/10"
        >
          {tabs.map((tab) => (
            <option key={tab.id} value={tab.id} disabled={tab.disabled}>
              {tab.label}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop tabs */}
      <div className={cn('hidden sm:block', variantContainerStyles[variant])}>
        <nav className={cn(variant === 'underline' ? '-mb-px flex gap-x-8' : 'flex gap-x-4')} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                styles.base,
                activeTab === tab.id ? styles.active : styles.inactive,
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
            >
              {tab.icon && <span className="mr-2 -ml-0.5">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  activeTab === tab.id
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'
                    : 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-gray-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
      <div
        className="mt-4"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={activeTab}
      >
        {activeContent}
      </div>
    </div>
  );
}
