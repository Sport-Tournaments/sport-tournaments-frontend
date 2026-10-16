'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/utils/helpers';
import { getGoogleDirectionsUrl, getWazeDirectionsUrl, type DirectionsTarget } from './directions';

interface DirectionsButtonsProps extends DirectionsTarget {
  className?: string;
  compact?: boolean;
}

export default function DirectionsButtons({ className, compact = false, ...target }: DirectionsButtonsProps) {
  const { t } = useTranslation();
  const googleUrl = getGoogleDirectionsUrl(target);
  const wazeUrl = getWazeDirectionsUrl(target);

  if (!googleUrl) return null;

  if (compact) {
    return (
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline', className)}
      >
        {t('tournament.showDirections', 'Show directions')} →
      </a>
    );
  }

  return (
    <div className={cn('flex flex-col sm:flex-row gap-2', className)}>
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--uefa-blue,#0b2b5b)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        {t('tournament.showDirections', 'Show directions')}
      </a>
      {wazeUrl && (
        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('tournament.openInWaze', 'Open in Waze')}
        </a>
      )}
    </div>
  );
}
