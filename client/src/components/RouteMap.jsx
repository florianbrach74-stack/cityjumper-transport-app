import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
import api from '../services/api';

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

export default function RouteMap({ pickup, delivery, pickupStops = [], deliveryStops = [], onRouteCalculated }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const geocodeAddress = async (address, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Use backend API for geocoding
        const response = await api.post('/pricing/geocode', { 
          fullAddress: address 
        });
        
        if (response.data && response.data.lat && response.data.lon) {
          return {
            lat: response.data.lat,
            lon: response.data.lon
          };
        }
        
        console.warn(`Geocoding: No results for "${address}"`);
        return null;
        
      } catch (error) {
        console.error(`Geocoding attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          return null;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    return null;
  };

  useEffect(() => {
    if (pickup && delivery) {
      fetchRoute();
    }
  }, [pickup, delivery, pickupStops, deliveryStops]);

  const fetchRoute = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build waypoints: pickup -> pickupStops -> delivery -> deliveryStops
      const waypoints = [];
      
      // Start with main pickup
      waypoints.push(`${pickup.lon},${pickup.lat}`);
      
      // Add additional pickup stops
      for (const stop of pickupStops) {
        if (stop.city && stop.postal_code) {
          try {
            const geocoded = await geocodeAddress(`${stop.postal_code} ${stop.city}, ${stop.country || 'Deutschland'}`);
            if (geocoded) {
              waypoints.push(`${geocoded.lon},${geocoded.lat}`);
            }
          } catch (e) {
            console.warn('Could not geocode pickup stop:', stop);
          }
        }
      }
      
      // Add main delivery
      waypoints.push(`${delivery.lon},${delivery.lat}`);
      
      // Add additional delivery stops
      for (const stop of deliveryStops) {
        if (stop.city && stop.postal_code) {
          try {
            const geocoded = await geocodeAddress(`${stop.postal_code} ${stop.city}, ${stop.country || 'Deutschland'}`);
            if (geocoded) {
              waypoints.push(`${geocoded.lon},${geocoded.lat}`);
            }
          } catch (e) {
            console.warn('Could not geocode delivery stop:', stop);
          }
        }
      }

      // Use OSRM (OpenStreetMap Routing Machine) for real routing with all waypoints
      const waypointsStr = waypoints.join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${waypointsStr}?overview=full&geometries=geojson&steps=true`
      );
      
      const data = await response.json();
      
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Math.round(route.distance / 1000);
        const durationMin = Math.round(route.duration / 60);
        
        // Add traffic estimation (10-20% extra time during business hours)
        const now = new Date();
        const hour = now.getHours();
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
        const trafficFactor = isRushHour ? 1.2 : 1.1;
        const durationWithTraffic = Math.round(durationMin * trafficFactor);
        
        const hours = Math.floor(durationWithTraffic / 60);
        const minutes = durationWithTraffic % 60;
        const durationText = hours >= 1 
          ? `${hours}h ${minutes}min`
          : `${minutes}min`;

        const routeInfo = {
          distance: distanceKm,
          duration: durationText,
          durationMinutes: durationWithTraffic,
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Swap lon,lat to lat,lon
          hasTraffic: isRushHour
        };

        setRouteData(routeInfo);
        
        if (onRouteCalculated) {
          onRouteCalculated(routeInfo);
        }
      } else {
        throw new Error('Keine Route gefunden');
      }
    } catch (err) {
      console.error('Route calculation error:', err);
      
      // Provide user-friendly error message
      let errorMessage = 'Fehler beim Berechnen der Route';
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        errorMessage = 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.';
      } else if (err.message.includes('429') || err.message.includes('Too Many Requests')) {
        errorMessage = 'Zu viele Anfragen. Bitte warten Sie einen Moment und versuchen Sie es erneut.';
      } else if (err.message.includes('geocod')) {
        errorMessage = 'Adresse konnte nicht gefunden werden. Bitte überprüfen Sie die Eingabe.';
      }
      
      setError(errorMessage);
      
      // Still notify parent with null to allow order creation without route
      if (onRouteCalculated) {
        onRouteCalculated(null);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!pickup || !delivery) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Geben Sie Abhol- und Lieferadresse ein, um die Route anzuzeigen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Berechne Route...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (!routeData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Route Info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center text-gray-600 mb-1">
            <Navigation className="h-4 w-4 mr-2" />
            <span className="text-sm">Entfernung</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{routeData.distance} km</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center text-gray-600 mb-1">
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">Fahrzeit</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{routeData.duration}</p>
          {routeData.hasTraffic && (
            <p className="text-xs text-orange-600 mt-1">⚠️ Stoßzeit berücksichtigt</p>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center text-gray-600 mb-1">
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm">Route</span>
          </div>
          <p className="text-lg font-bold text-gray-900">Optimiert</p>
        </div>
      </div>

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
            positions={routeData.coordinates}
            color="#2563eb"
            weight={5}
            opacity={0.8}
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
