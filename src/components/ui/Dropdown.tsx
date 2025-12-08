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
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItemType[];
  align?: 'left' | 'right';
  className?: string;
}

// Component exports for compatibility
export const DropdownItem = null; // Not a component, items are passed as objects
export const DropdownDivider = null; // Not a component, divider is a property

export default function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      className={cn('relative inline-block', className)}
      onKeyDown={handleKeyDown}
    >
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            'dropdown animate-slideDown',
            align === 'left' ? 'left-0' : 'right-0'
          )}
          role="menu"
        >
          {items.map((item, index) =>
            item.divider ? (
              <div key={index} className="divider my-1" />
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
                  'dropdown-item',
                  item.danger && 'text-[var(--color-error)] hover:bg-[var(--color-error-light)]',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
                role="menuitem"
              >
                {item.icon && <span className="shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
