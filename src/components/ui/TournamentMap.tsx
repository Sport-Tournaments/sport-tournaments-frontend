'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { Tournament } from '@/types';

interface TournamentMapProps {
  tournaments: Tournament[];
  className?: string;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

// Dynamically import the entire map component with ssr disabled
const GoogleMap = dynamic(
  () => import('./GoogleMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-100 rounded-lg p-8 text-center animate-pulse" style={{ height: '500px' }}>
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }
);

export function TournamentMap({ 
  tournaments, 
  className,
  defaultCenter = [45.9432, 24.9668], // Romania center
  defaultZoom = 6
}: TournamentMapProps) {
  const { t } = useTranslation();

  // Filter tournaments with valid coordinates (handle both string and number types)
  const tournamentsWithCoords = useMemo(() => tournaments.filter((tournament) => {
    const lat = typeof tournament.latitude === 'string' ? parseFloat(tournament.latitude) : tournament.latitude;
    const lng = typeof tournament.longitude === 'string' ? parseFloat(tournament.longitude) : tournament.longitude;
    return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
  }).map((tournament) => ({
    ...tournament,
    latitude: typeof tournament.latitude === 'string' ? parseFloat(tournament.latitude) : tournament.latitude,
    longitude: typeof tournament.longitude === 'string' ? parseFloat(tournament.longitude) : tournament.longitude,
  })), [tournaments]);

  // Generate a unique key for the map to force remount when tournaments change
  const mapKey = useMemo(() => {
    const ids = tournamentsWithCoords.map(t => t.id).sort().join('-');
    return `tournament-map-${ids || 'empty'}`;
  }, [tournamentsWithCoords]);

  if (tournamentsWithCoords.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-gray-600">{t('tournaments.noTournamentsWithLocation', 'No tournaments with location data')}</p>
      </div>
    );
  }

  return (
    <div className={className} key={mapKey}>
      <GoogleMap 
        key={mapKey}
        tournaments={tournamentsWithCoords}
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
      />

      {/* Tournament count */}
      <p className="text-sm text-gray-500 mt-3">
        {t('tournaments.showingOnMap', 'Showing {{count}} tournaments on map', { count: tournamentsWithCoords.length })}
        {tournaments.length > tournamentsWithCoords.length && (
          <span className="ml-1">
            ({tournaments.length - tournamentsWithCoords.length} {t('tournaments.withoutLocation', 'without location')})
          </span>
        )}
      </p>
    </div>
  );
}

export default TournamentMap;
