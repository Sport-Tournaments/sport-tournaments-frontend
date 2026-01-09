import React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';

interface ColorCombination {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  description?: string;
}

interface ColorCombinationPickerProps {
  value?: { primary: string; secondary: string };
  onChange: (colors: { primary: string; secondary: string }) => void;
  className?: string;
}

const PREDEFINED_COMBINATIONS: ColorCombination[] = [
  { id: 'red-white', name: 'Red & White', primary: '#DC2626', secondary: '#FFFFFF', description: 'Classic combination' },
  { id: 'blue-white', name: 'Blue & White', primary: '#2563EB', secondary: '#FFFFFF', description: 'Sky colors' },
  { id: 'blue-yellow', name: 'Blue & Yellow', primary: '#1E40AF', secondary: '#FBBF24', description: 'Royal colors' },
  { id: 'red-blue', name: 'Red & Blue', primary: '#DC2626', secondary: '#1E40AF', description: 'Bold contrast' },
  { id: 'green-white', name: 'Green & White', primary: '#16A34A', secondary: '#FFFFFF', description: 'Fresh look' },
  { id: 'black-white', name: 'Black & White', primary: '#1F2937', secondary: '#FFFFFF', description: 'Timeless classic' },
  { id: 'yellow-blue', name: 'Yellow & Blue', primary: '#FBBF24', secondary: '#1E40AF', description: 'Bright & bold' },
  { id: 'orange-black', name: 'Orange & Black', primary: '#F97316', secondary: '#1F2937', description: 'Tiger stripes' },
  { id: 'purple-white', name: 'Purple & White', primary: '#9333EA', secondary: '#FFFFFF', description: 'Royal purple' },
  { id: 'red-yellow', name: 'Red & Yellow', primary: '#DC2626', secondary: '#FBBF24', description: 'Fire colors' },
  { id: 'green-yellow', name: 'Green & Yellow', primary: '#16A34A', secondary: '#FBBF24', description: 'Brazilian style' },
  { id: 'black-yellow', name: 'Black & Yellow', primary: '#1F2937', secondary: '#FBBF24', description: 'Bee colors' },
];

export function ColorCombinationPicker({ value, onChange, className }: ColorCombinationPickerProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Check if current value matches any predefined combination
  React.useEffect(() => {
    if (value) {
      const match = PREDEFINED_COMBINATIONS.find(
        (combo) => combo.primary === value.primary && combo.secondary === value.secondary
      );
      setSelectedId(match?.id || null);
    }
  }, [value]);

  const handleSelect = (combo: ColorCombination) => {
    setSelectedId(combo.id);
    onChange({ primary: combo.primary, secondary: combo.secondary });
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {t('clubs.colorPicker.predefined')}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PREDEFINED_COMBINATIONS.map((combo) => {
            const isSelected = selectedId === combo.id;
            return (
              <button
                key={combo.id}
                type="button"
                onClick={() => handleSelect(combo)}
                className={cn(
                  'relative rounded-lg border-2 p-3 transition-all hover:scale-105',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {/* Color Preview */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                    style={{ backgroundColor: combo.primary }}
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-600 shadow-sm"
                    style={{ backgroundColor: combo.secondary }}
                  />
                </div>

                {/* Name & Description */}
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                    {combo.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {combo.description}
                  </p>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Colors Display */}
      {value && (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded border-2 border-gray-300 dark:border-gray-600 shadow"
              style={{ backgroundColor: value.primary }}
            />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('clubs.colorPicker.primary')}</p>
              <p className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                {value.primary}
              </p>
            </div>
          </div>
          <div className="w-px h-10 bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded border-2 border-gray-300 dark:border-gray-600 shadow"
              style={{ backgroundColor: value.secondary }}
            />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('clubs.colorPicker.secondary')}</p>
              <p className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                {value.secondary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
