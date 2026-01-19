'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Calculate bounds to fit all markers
  const getBounds = (): L.LatLngBoundsExpression | undefined => {
    if (tournaments.length === 0) return undefined;
    if (tournaments.length === 1) return undefined; // Use center for single marker
    
    const lats = tournaments.map(t => t.latitude!);
    const lngs = tournaments.map(t => t.longitude!);
    
    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  };

  const mapCenter: [number, number] = tournaments.length > 0 
    ? [tournaments[0].latitude!, tournaments[0].longitude!]
    : defaultCenter;

  const bounds = getBounds();

  if (!mapReady) {
    return null;
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '500px' }}>
      <MapContainer
        center={mapCenter}
        zoom={defaultZoom}
        bounds={bounds}
        boundsOptions={{ padding: [50, 50] }}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {tournaments.map((tournament) => (
          <Marker
            key={tournament.id}
            position={[tournament.latitude!, tournament.longitude!]}
            icon={customIcon}
          >
            <Popup>
              <div className="max-w-xs">
                <h3 className="font-semibold text-gray-900 mb-1">{tournament.name}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                </p>
                <p className="text-sm text-gray-500 mb-3">{tournament.location}</p>
                <div className="mb-3">
                  <Badge variant={tournament.status === 'PUBLISHED' ? 'info' : 'default'}>
                    {tournament.status}
                  </Badge>
                </div>
                <Link
                  href={`/main/tournaments/${tournament.id}`}
                  className="inline-block px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  {t('common.viewDetails', 'View Details')}
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
