'use client';

import { InputHTMLAttributes, forwardRef, useCallback } from 'react';
import { cn } from '@/utils/helpers';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  hint?: string; // Alias for helperText
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      hint,
      leftIcon,
      rightIcon,
      type = 'text',
      required,
      id,
      onClick,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const helpText = helperText || hint;

    // Handler to open date/time picker when clicking the field (Issue #28)
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLInputElement>) => {
        // Call the original onClick if provided
        if (onClick) {
          onClick(e);
        }
        
        // For date/time inputs, programmatically open the picker
        if (type === 'datetime-local' || type === 'date' || type === 'time') {
          const input = e.currentTarget;
          // Use showPicker API if available (modern browsers)
          if (input && typeof (input as any).showPicker === 'function') {
            try {
              (input as any).showPicker();
            } catch (error) {
              // Silently fail - some browsers/contexts don't support it
              console.debug('showPicker not available:', error);
            }
          }
        }
      },
      [onClick, type]
    );

    // Handler to auto-close datetime picker after selection (Issue #29)
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onChange) {
          onChange(e);
        }
        // Auto-close datetime picker after value selection
        if ((type === 'datetime-local' || type === 'date' || type === 'time') && e.target.value) {
          // Trigger blur to close the picker after a small delay
          setTimeout(() => {
            e.target.blur();
          }, 100);
        }
      },
      [onChange, type]
    );

    const baseInputStyles = 'block w-full rounded-lg bg-white px-3.5 py-2 text-base text-slate-900 border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-colors';
    
    const errorInputStyles = 'block w-full rounded-lg bg-white px-3.5 py-2 text-base text-slate-900 border border-red-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm transition-colors';

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-slate-700',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            onClick={handleClick}
            onChange={handleChange}
            className={cn(
              error ? errorInputStyles : baseInputStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helpText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
