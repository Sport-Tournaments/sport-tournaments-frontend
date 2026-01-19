'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Tournament } from '@/types';
import Badge from './Badge';
import { formatDate } from '@/utils/date';

// Fix for default marker icon in Leaflet with bundlers
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LeafletMapProps {
  tournaments: Tournament[];
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export default function LeafletMap({
  tournaments,
  defaultCenter = [45.9432, 24.9668], // Romania center
  defaultZoom = 6,
}: LeafletMapProps) {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    // Only run on client
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (!mapReady || !mapContainerRef.current) return;

    // Clean up any existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Calculate center and bounds
    const mapCenter: L.LatLngExpression = tournaments.length > 0 
      ? [tournaments[0].latitude as number, tournaments[0].longitude as number]
      : defaultCenter;

    // Create new map
    const map = L.map(mapContainerRef.current).setView(mapCenter, defaultZoom);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add markers
    const markers: L.Marker[] = [];
    tournaments.forEach((tournament) => {
      const marker = L.marker(
        [tournament.latitude as number, tournament.longitude as number],
        { icon: customIcon }
      ).addTo(map);

      marker.bindPopup(`
        <div style="max-width: 250px;">
          <h3 style="font-weight: 600; color: #111827; margin-bottom: 4px;">${tournament.name}</h3>
          <p style="font-size: 14px; color: #4B5563; margin-bottom: 8px;">
            ${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}
          </p>
          <p style="font-size: 14px; color: #6B7280; margin-bottom: 12px;">${tournament.location || ''}</p>
          <span style="display: inline-block; padding: 2px 8px; font-size: 12px; background-color: ${tournament.status === 'PUBLISHED' ? '#DBEAFE' : '#F3F4F6'}; color: ${tournament.status === 'PUBLISHED' ? '#1E40AF' : '#374151'}; border-radius: 4px; margin-bottom: 12px;">
            ${tournament.status}
          </span>
          <br/>
          <a href="/main/tournaments/${tournament.id}" style="display: inline-block; padding: 6px 12px; font-size: 14px; font-weight: 500; color: white; background-color: #2563EB; border-radius: 4px; text-decoration: none;">
            ${t('common.viewDetails', 'View Details')}
          </a>
        </div>
      `);

      markers.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapReady, tournaments, defaultCenter, defaultZoom, t]);

  if (!mapReady) {
    return null;
  }

  return (
    <div 
      ref={mapContainerRef}
      className="rounded-lg overflow-hidden border border-gray-200" 
      style={{ height: '500px', width: '100%' }}
    />
  );
}
