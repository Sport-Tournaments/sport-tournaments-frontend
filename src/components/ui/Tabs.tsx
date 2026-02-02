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
    underline: 'border-b border-slate-200',
    pills: '',
    'pills-gray': 'bg-slate-100 p-1 rounded-lg',
  };

  const variantTabStyles = {
    underline: {
      base: 'border-b-2 px-1 pb-4 text-sm font-medium whitespace-nowrap',
      active: 'border-teal-500 text-teal-600',
      inactive: 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700',
    },
    pills: {
      base: 'rounded-lg px-3 py-2 text-sm font-medium',
      active: 'bg-teal-100 text-teal-700',
      inactive: 'text-slate-500 hover:text-slate-700',
    },
    'pills-gray': {
      base: 'rounded-lg px-3 py-1.5 text-sm font-medium',
      active: 'bg-white text-slate-900 shadow-sm',
      inactive: 'text-slate-500 hover:text-slate-700',
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
          className="block w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                    ? 'bg-teal-100 text-teal-600'
                    : 'bg-slate-100 text-slate-600'
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
