'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/helpers';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'soft' | 'paid' | 'unpaid' | 'view';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantStyles = {
      primary: 'rounded-lg bg-[var(--uefa-blue)] text-white hover:bg-[var(--uefa-blue-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
      secondary: 'rounded-lg bg-[var(--uefa-blue-soft)] text-white hover:bg-[var(--uefa-blue-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
      outline: 'rounded-lg bg-[var(--uefa-blue)] text-white hover:bg-[var(--uefa-blue-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
      ghost: 'rounded-lg bg-[var(--uefa-blue)] text-white/90 hover:bg-[var(--uefa-blue-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
      danger: 'rounded-lg bg-red-600 text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500',
      paid: 'rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500',
      unpaid: 'rounded-lg bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
      view: 'rounded-lg bg-white text-[#0b2b5b] border border-[#0b2b5b] hover:bg-[#f8fafc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2b5b]',
      success: 'rounded-lg bg-[var(--uefa-blue-soft)] text-white hover:bg-[var(--uefa-blue-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
      soft: 'rounded-lg bg-[var(--uefa-blue-light)] text-white hover:bg-[var(--uefa-blue-hover)]',
    };

    const sizeStyles = {
      xs: 'px-2 py-1 text-xs rounded-sm',
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-3.5 py-2.5 text-sm',
      xl: 'px-4 py-3 text-base',
      icon: 'p-2 aspect-square',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isLoading && 'cursor-wait',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="size-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 uefa-icon-chip-sm">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0 uefa-icon-chip-sm">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
