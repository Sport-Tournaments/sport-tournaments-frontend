'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/helpers';

export interface DropdownItemType {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  description?: string;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItemType[];
  align?: 'left' | 'right';
  className?: string;
  width?: 'auto' | 'sm' | 'md' | 'lg';
}

// Component exports for compatibility
export const DropdownItem = null; // Not a component, items are passed as objects
export const DropdownDivider = null; // Not a component, divider is a property

export default function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
  width = 'auto',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const widthStyles = {
    auto: 'min-w-[12rem]',
    sm: 'w-48',
    md: 'w-56',
    lg: 'w-72',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={cn('relative inline-block text-left', className)}
      onKeyDown={handleKeyDown}
    >
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-10 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none',
            'dark:bg-gray-800 dark:ring-white/10',
            'animate-slideDown',
            widthStyles[width],
            align === 'left' ? 'left-0' : 'right-0'
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1" role="none">
            {items.map((item, index) =>
              item.divider ? (
                <div key={index} className="my-1 h-px bg-gray-100 dark:bg-white/10" role="separator" />
              ) : (
                <button
                  key={index}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={cn(
                    'group flex w-full items-center gap-x-3 px-4 py-2 text-sm',
                    item.danger
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  role="menuitem"
                >
                  {item.icon && (
                    <span className={cn(
                      'shrink-0 size-5',
                      item.danger
                        ? 'text-red-500 group-hover:text-red-600 dark:text-red-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                    )}>
                      {item.icon}
                    </span>
                  )}
                  <div className="flex flex-col items-start">
                    <span>{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                    )}
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
