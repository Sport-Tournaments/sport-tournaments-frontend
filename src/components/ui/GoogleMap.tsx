'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader } from '@googlemaps/js-api-loader';
import { Tournament } from '@/types';
import { formatDate } from '@/utils/date';
import { getTournamentPublicPath } from '@/utils/helpers';

interface GoogleMapProps {
  tournaments: Tournament[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export default function GoogleMap({
  tournaments,
  defaultCenter = [45.9432, 24.9668],
  defaultZoom = 6,
}: GoogleMapProps) {
  const { t } = useTranslation();
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const mapCenter = useMemo<[number, number]>(() => {
    if (tournaments.length > 0) {
      return [tournaments[0].latitude as number, tournaments[0].longitude as number];
    }
    return defaultCenter;
  }, [tournaments, defaultCenter]);

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    let isCancelled = false;

    loader.load().then(() => {
      if (isCancelled || !mapContainerRef.current) return;

      const googleMaps = (window as typeof window & { google: any }).google;
      if (!googleMaps?.maps) return;

      if (!mapRef.current) {
        mapRef.current = new googleMaps.maps.Map(mapContainerRef.current, {
          center: { lat: mapCenter[0], lng: mapCenter[1] },
          zoom: defaultZoom,
          streetViewControl: false,
          mapTypeControl: false,
        });
      }

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      // Add markers and fit bounds
      const bounds = new googleMaps.maps.LatLngBounds();
      tournaments.forEach((tournament) => {
        const position = {
          lat: tournament.latitude as number,
          lng: tournament.longitude as number,
        };

        const marker = new googleMaps.maps.Marker({
          position,
          map: mapRef.current,
        });

        marker.addListener('click', () => {
          const infoWindow = infoWindowRef.current || new googleMaps.maps.InfoWindow();
          infoWindowRef.current = infoWindow;
          infoWindow.setContent(`
            <div style="max-width: 250px;">
              <h3 style="font-weight: 600; color: #111827; margin-bottom: 4px;">${tournament.name}</h3>
              <p style="font-size: 14px; color: #4B5563; margin-bottom: 8px;">
                ${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}
              </p>
              <p style="font-size: 14px; color: #6B7280; margin-bottom: 12px;">${tournament.location || ''}</p>
              <span style="display: inline-block; padding: 2px 8px; font-size: 12px; background-color: #F3F4F6; color: #374151; border-radius: 4px; margin-bottom: 12px;">
                ${tournament.status}
              </span>
              <br/>
              <a href="${getTournamentPublicPath(tournament)}" style="display: inline-block; padding: 6px 12px; font-size: 14px; font-weight: 500; color: white; background-color: #2563EB; border-radius: 4px; text-decoration: none;">
                ${t('common.viewDetails', 'View Details')}
              </a>
            </div>
          `);
          infoWindow.open({ map: mapRef.current, anchor: marker });
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      });

      if (tournaments.length > 1) {
        mapRef.current.fitBounds(bounds);
      }
    }).catch((error) => {
      if (!isCancelled) {
        console.error('Failed to load Google Maps:', error);
        setLoadError('Unable to load Google Maps.');
      }
    });

    return () => {
      isCancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [apiKey, mapCenter, defaultZoom, tournaments, t]);

  if (!apiKey) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Google Maps API key is not configured.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {loadError}
      </div>
    );
  }

  return (
    <div
      data-testid="google-map"
      ref={mapContainerRef}
      className="rounded-lg overflow-hidden border border-gray-200"
      style={{ height: '500px', width: '100%' }}
    />
  );
}