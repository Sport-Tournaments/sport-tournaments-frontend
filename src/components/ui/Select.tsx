'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/helpers';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      options,
      placeholder,
      required,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const selectId = id || props.name;

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-sm font-medium text-gray-900 dark:text-white',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              'block w-full appearance-none rounded-md bg-white py-1.5 pl-3 pr-8 text-base text-gray-900 sm:text-sm',
              'outline-1 -outline-offset-1',
              error 
                ? 'outline-red-500 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600' 
                : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600',
              'dark:bg-white/5 dark:text-white',
              error ? 'dark:outline-red-500' : 'dark:outline-white/10',
              disabled && 'cursor-not-allowed bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
            }
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="dark:bg-gray-800"
              >
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-5 text-gray-500 dark:text-gray-400"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
