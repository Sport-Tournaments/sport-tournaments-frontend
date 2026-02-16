'use client';

import Button from './Button';

export type ViewMode = 'list' | 'grid';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  listLabel?: string;
  gridLabel?: string;
}

export default function ViewModeToggle({
  mode,
  onChange,
  className = '',
  listLabel = 'List',
  gridLabel = 'Grid',
}: ViewModeToggleProps) {
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 p-1 bg-white ${className}`}>
      <Button
        type="button"
        variant={mode === 'list' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onChange('list')}
        className="!px-3"
      >
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          {listLabel}
        </span>
      </Button>
      <Button
        type="button"
        variant={mode === 'grid' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => onChange('grid')}
        className="!px-3"
      >
        <span className="inline-flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
          </svg>
          {gridLabel}
        </span>
      </Button>
    </div>
  );
}
