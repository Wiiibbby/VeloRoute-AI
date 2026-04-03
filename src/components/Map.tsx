import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, ZoomControl, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { RouteData, Coordinates } from '../services/route';
import { FoodSpot } from '../services/gemini';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const foodIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  start: Coordinates | null;
  end: Coordinates | null;
  route: RouteData | null;
  foodSpots: FoodSpot[];
}

const MapUpdater = ({ start, end, route, foodSpots }: MapProps) => {
  const map = useMap();

  useEffect(() => {
    if (route && route.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.coordinates.map(c => [c[1], c[0]]));
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start && end) {
      const bounds = L.latLngBounds([[start.lat, start.lng], [end.lat, end.lng]]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (start) {
      map.setView([start.lat, start.lng], 13);
    } else if (end) {
      map.setView([end.lat, end.lng], 13);
    }
  }, [start, end, route, foodSpots, map]);

  return null;
};

export default function Map({ start, end, route, foodSpots }: MapProps) {
  return (
    <MapContainer
      center={[39.9042, 116.4074]} // Default to Beijing or somewhere
      zoom={4}
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" />
      
      {route && (
        <Polyline 
          positions={route.coordinates.map(c => [c[1], c[0]])} 
          color="#3b82f6" // blue-500
          weight={4}
          opacity={0.8}
        />
      )}

      {start && (
        <Marker position={[start.lat, start.lng]} icon={startIcon}>
          <Popup>Start</Popup>
        </Marker>
      )}

      {end && (
        <Marker position={[end.lat, end.lng]} icon={endIcon}>
          <Popup>Destination</Popup>
        </Marker>
      )}

      {foodSpots.map((spot, index) => (
        <Marker key={index} position={[spot.lat, spot.lng]} icon={foodIcon}>
          <Popup>
            <div className="text-slate-900">
              <h3 className="font-bold text-sm">{spot.name}</h3>
              <p className="text-xs mt-1">{spot.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapUpdater start={start} end={end} route={route} foodSpots={foodSpots} />
    </MapContainer>
  );
}
