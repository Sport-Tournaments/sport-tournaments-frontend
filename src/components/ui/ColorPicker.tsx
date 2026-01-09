'use client';

import { InputHTMLAttributes, forwardRef, useState, useCallback } from 'react';
import { cn } from '@/utils/helpers';

export interface ColorPickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  presetColors?: string[];
  showPresets?: boolean;
}

const DEFAULT_PRESET_COLORS = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#F43F5E', // rose
  '#000000', // black
  '#FFFFFF', // white
  '#6B7280', // gray
];

const ColorPicker = forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      className,
      containerClassName,
      label,
      error,
      helperText,
      presetColors = DEFAULT_PRESET_COLORS,
      showPresets = true,
      required,
      id,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || props.name;
    const [showPicker, setShowPicker] = useState(false);

    const handlePresetClick = useCallback(
      (color: string) => {
        if (onChange) {
          const syntheticEvent = {
            target: { value: color, name: props.name },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      },
      [onChange, props.name]
    );

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm/6 font-medium text-gray-900 dark:text-white',
              required && "after:content-['*'] after:ml-0.5 after:text-red-500"
            )}
          >
            {label}
          </label>
        )}
        <div className="flex items-center gap-3">
          {/* Color preview and native picker */}
          <div className="relative">
            <div
              className={cn(
                'h-10 w-10 rounded-lg border-2 border-gray-300 cursor-pointer transition-all hover:border-indigo-500 dark:border-gray-600',
                error && 'border-red-500'
              )}
              style={{ backgroundColor: (value as string) || '#ffffff' }}
              onClick={() => setShowPicker(!showPicker)}
            />
            <input
              type="color"
              ref={ref}
              id={inputId}
              value={(value as string) || '#ffffff'}
              onChange={onChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              {...props}
            />
          </div>
          
          {/* Hex value input */}
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => {
              const newValue = e.target.value.startsWith('#') 
                ? e.target.value 
                : `#${e.target.value}`;
              if (onChange) {
                const syntheticEvent = {
                  target: { value: newValue, name: props.name },
                } as React.ChangeEvent<HTMLInputElement>;
                onChange(syntheticEvent);
              }
            }}
            placeholder="#000000"
            className={cn(
              'block w-28 rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500 uppercase font-mono',
              error && 'outline-red-300 focus:outline-red-600'
            )}
          />
        </div>

        {/* Preset colors */}
        {showPresets && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                className={cn(
                  'w-6 h-6 rounded-md border transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  (value as string)?.toLowerCase() === color.toLowerCase()
                    ? 'ring-2 ring-indigo-500 ring-offset-2'
                    : 'border-gray-300 dark:border-gray-600'
                )}
                style={{ backgroundColor: color }}
                onClick={() => handlePresetClick(color)}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Helper text or error */}
        {(error || helperText) && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
