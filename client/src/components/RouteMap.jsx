import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Clock } from 'lucide-react';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapBounds({ pickup, delivery }) {
  const map = useMap();
  
  useEffect(() => {
    if (pickup && delivery) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lon],
        [delivery.lat, delivery.lon]
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [pickup, delivery, map]);
  
  return null;
}

export default function RouteMap({ pickup, delivery, routeInfo }) {
  if (!pickup || !delivery) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Geben Sie Abhol- und Lieferadresse ein, um die Route anzuzeigen</p>
      </div>
    );
  }

  const routeCoordinates = [
    [pickup.lat, pickup.lon],
    [delivery.lat, delivery.lon]
  ];

  return (
    <div className="space-y-4">
      {/* Route Info */}
      {routeInfo && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Navigation className="h-4 w-4 mr-2" />
              <span className="text-sm">Entfernung</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{routeInfo.distance} km</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <Clock className="h-4 w-4 mr-2" />
              <span className="text-sm">Fahrzeit</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{routeInfo.duration}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center text-gray-600 mb-1">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">Route</span>
            </div>
            <p className="text-lg font-bold text-gray-900">Direkt</p>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="rounded-lg overflow-hidden border-2 border-gray-300 shadow-lg">
        <MapContainer
          center={[
            (pickup.lat + delivery.lat) / 2,
            (pickup.lon + delivery.lon) / 2
          ]}
          zoom={10}
          style={{ height: '500px', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Pickup Marker */}
          <Marker position={[pickup.lat, pickup.lon]} icon={pickupIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-green-700">📍 Abholung</p>
                <p className="text-sm mt-1">{pickup.street}</p>
                <p className="text-sm">{pickup.postalCode} {pickup.city}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Delivery Marker */}
          <Marker position={[delivery.lat, delivery.lon]} icon={deliveryIcon}>
            <Popup>
              <div className="p-2">
                <p className="font-semibold text-red-700">🎯 Zustellung</p>
                <p className="text-sm mt-1">{delivery.street}</p>
                <p className="text-sm">{delivery.postalCode} {delivery.city}</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Route Line */}
          <Polyline
            positions={routeCoordinates}
            color="#2563eb"
            weight={4}
            opacity={0.7}
            dashArray="10, 10"
          />
          
          <MapBounds pickup={pickup} delivery={delivery} />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Abholung</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Zustellung</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-primary-600 mr-2" style={{ borderTop: '2px dashed' }}></div>
          <span>Route</span>
        </div>
      </div>
    </div>
  );
}
