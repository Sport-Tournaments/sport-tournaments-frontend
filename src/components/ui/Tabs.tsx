'use client';

import { useEffect, useState } from 'react';
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
  queryParam?: string;
}

export default function Tabs({
  tabs,
  defaultTab,
  onChange,
  className,
  variant = 'underline',
  queryParam,
}: TabsProps) {
  const tabIds = tabs.map((tab) => tab.id).join('|');
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  useEffect(() => {
    const nextTab = defaultTab && tabs.some((tab) => tab.id === defaultTab)
      ? defaultTab
      : tabs[0]?.id;
    if (nextTab) setActiveTab(nextTab);
  }, [defaultTab, tabIds]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (queryParam && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      params.set(queryParam, tabId);
      const queryString = params.toString();
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${queryString ? `?${queryString}` : ''}`,
      );
    }
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
      base: 'border-b-2 px-1 pb-2 text-sm font-medium sm:whitespace-nowrap text-[#0b2b5b]/80',
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
      <div className={cn('overflow-x-hidden', variantContainerStyles[variant])}>
        <nav className={cn(variant === 'underline' ? '-mb-px flex flex-wrap gap-2 sm:gap-x-6' : 'flex flex-wrap gap-2')} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={cn(
                styles.base,
                'max-w-full break-words',
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
