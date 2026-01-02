import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers - use CDN URLs
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status?: string;
  onClick?: () => void;
}

interface MapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (id: string) => void;
}

const statusColors: Record<string, string> = {
  APPROVED: '#10B981',
  PENDING: '#F59E0B',
  FLAGGED: '#EF4444',
  REJECTED: '#6B7280',
};

export default function Map({
  markers,
  center,
  zoom = 10,
  height = '400px',
  onMarkerClick
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Calculate center from markers if not provided
    let mapCenter: [number, number] = center || [9.0820, 8.6753]; // Default to Nigeria center

    if (!center && markers.length > 0) {
      const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
      const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
      mapCenter = [avgLat, avgLng];
    }

    // Initialize map
    const map = L.map(mapRef.current).setView(mapCenter, zoom);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add markers
    markers.forEach((marker) => {
      const color = statusColors[marker.status || 'PENDING'] || '#3B82F6';

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${marker.title}</strong>
            <br/>
            <span style="color: ${color}; font-size: 12px;">
              ${marker.status || 'No status'}
            </span>
            <br/>
            <small>${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}</small>
          </div>
        `);

      if (onMarkerClick) {
        leafletMarker.on('click', () => onMarkerClick(marker.id));
      }
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [markers, center, zoom, onMarkerClick]);

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%', borderRadius: '8px' }}
      className="z-0"
    />
  );
}
