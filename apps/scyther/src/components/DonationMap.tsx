import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapCategory = 'donation' | 'hospital' | 'clinic' | 'pharmacy' | 'doctors';

export interface MapPoint {
  id: string;
  name: string;
  category: MapCategory;
  lat: number;
  lon: number;
  sub?: string;
}

export const CATEGORY_META: Record<MapCategory, { label: string; color: string }> = {
  donation: { label: 'Blood donation centre', color: '#8E1B2E' },
  hospital: { label: 'Hospital', color: '#1B3A6B' },
  clinic: { label: 'Clinic', color: '#2A6B8E' },
  pharmacy: { label: 'Pharmacy', color: '#4A5568' },
  doctors: { label: 'Doctor / surgery', color: '#3E3A73' }
};

const BW_CENTER: [number, number] = [-22.35, 24.68];

const iconFor = (color: string, active: boolean) =>
  L.divIcon({
    className: 'bc-pin',
    html: `<span class="bc-pin-dot" style="background:${color}${active ? ';transform:scale(1.5)' : ''}"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });

const Recenter: React.FC<{ pos: { lat: number; lon: number } | null }> = ({ pos }) => {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lon], 10, { duration: 0.8 });
  }, [pos, map]);
  return null;
};

const FlyToSelected: React.FC<{ point: MapPoint | null }> = ({ point }) => {
  const map = useMap();
  useEffect(() => {
    if (point) map.flyTo([point.lat, point.lon], Math.max(map.getZoom(), 11), { duration: 0.6 });
  }, [point, map]);
  return null;
};

/** A map failure must never take the rest of the app down with it. */
class MapBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('Map failed to render:', err);
  }
  render() {
    if (this.state.failed) {
      return (
        <div className="empty" style={{ padding: 32 }}>
          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>Map unavailable</div>
          <p style={{ fontSize: 13, marginTop: 6 }}>
            The map could not be displayed. Donation centres and health services are listed below the map area.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

interface Props {
  points: MapPoint[];
  userPos: { lat: number; lon: number } | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: number;
}

export const DonationMap: React.FC<Props> = ({
  points,
  userPos,
  selectedId,
  onSelect,
  height = 440
}) => {
  const icons = useMemo(() => {
    const m: Record<string, L.DivIcon> = {};
    (Object.keys(CATEGORY_META) as MapCategory[]).forEach(c => {
      m[`${c}-0`] = iconFor(CATEGORY_META[c].color, false);
      m[`${c}-1`] = iconFor(CATEGORY_META[c].color, true);
    });
    return m;
  }, []);

  const selectedPoint = points.find(p => p.id === selectedId) ?? null;

  return (
    <div className="map-frame" style={{ height }}>
      <MapBoundary>
        <MapContainer
          center={BW_CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter pos={userPos} />
          <FlyToSelected point={selectedPoint} />

          {userPos && (
            <>
              <Circle
                center={[userPos.lat, userPos.lon]}
                radius={700}
                pathOptions={{ color: '#1E5A8A', fillColor: '#1E5A8A', fillOpacity: 0.15 }}
              />
              <Marker position={[userPos.lat, userPos.lon]} icon={iconFor('#1E5A8A', true)}>
                <Popup>Your approximate location</Popup>
              </Marker>
            </>
          )}

          {points.map(p => (
            <Marker
              key={p.id}
              position={[p.lat, p.lon]}
              icon={icons[`${p.category}-${p.id === selectedId ? 1 : 0}`]}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Popup>
                <strong>{p.name}</strong>
                <div style={{ color: '#5b6470', fontSize: 12 }}>{CATEGORY_META[p.category].label}</div>
                {p.sub && <div style={{ color: '#5b6470', fontSize: 12 }}>{p.sub}</div>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </MapBoundary>
    </div>
  );
};
