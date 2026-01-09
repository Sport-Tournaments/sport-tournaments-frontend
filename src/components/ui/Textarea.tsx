'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/helpers';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      required,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || props.name;

    const baseStyles = 'block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-gray-800 dark:text-white dark:outline-gray-600 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 min-h-[100px] resize-y';
    
    const errorStyles = 'block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-red-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-red-600 sm:text-sm/6 dark:bg-gray-800 dark:text-white dark:outline-red-500/50 dark:placeholder:text-gray-500 dark:focus:outline-red-500 min-h-[100px] resize-y';

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm/6 font-medium text-gray-900 dark:text-white',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            error ? errorStyles : baseStyles,
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
