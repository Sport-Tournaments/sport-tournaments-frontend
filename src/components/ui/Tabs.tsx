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
    underline: 'bg-white px-2 pt-1 pb-0.5 rounded-md',
    pills: 'bg-[var(--uefa-blue)] px-1 pt-1 pb-0.5 rounded-md',
    'pills-gray': 'bg-white px-1 pt-1 pb-0.5 rounded-md',
  };

  const variantTabStyles = {
    underline: {
      base: 'border-b-2 px-1 pb-2 text-sm font-medium whitespace-nowrap text-[#0b2b5b]/80',
      active: 'border-[#0b2b5b] text-white bg-[var(--uefa-blue)] rounded-md px-3 py-1',
      inactive: 'border-transparent text-[#0b2b5b]/70 hover:text-[#0b2b5b]',
    },
    pills: {
      base: 'rounded-md px-2.5 py-1 text-sm font-medium text-white/80',
      active: 'bg-white/10 text-white',
      inactive: 'bg-transparent hover:bg-white/10 hover:text-white',
    },
    'pills-gray': {
      base: 'rounded-md px-2.5 py-1 text-sm font-medium text-[#0b2b5b] border border-transparent',
      active: 'bg-[var(--uefa-blue)] text-white',
      inactive: 'text-[#0b2b5b]/80 hover:text-[#0b2b5b]',
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
          className="block w-full rounded-lg bg-[var(--uefa-blue)] py-2 pl-3 pr-10 text-white focus:ring-2 focus:ring-white/80"
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
        <nav className={cn(variant === 'underline' ? '-mb-px flex gap-x-6' : 'flex gap-x-2')} role="tablist">
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
              {tab.icon && <span className="mr-2 -ml-0.5 uefa-icon-chip-sm">{tab.icon}</span>}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'ml-3 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-white/10 text-white/80'
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
