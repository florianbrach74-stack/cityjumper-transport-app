import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../services/api';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AddressAutocomplete({ 
  label, 
  value, 
  onChange, 
  onAddressSelect,
  required = false 
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (value && value.length > 3) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        searchAddress(value);
      }, 500);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value]);

  const searchAddress = async (query) => {
    try {
      setLoading(true);
      const response = await api.post('/pricing/geocode', {
        fullAddress: query + ', Deutschland'
      });
      const data = response.data ? [response.data] : [];
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    const address = {
      full: suggestion.display_name,
      street: suggestion.address?.road || '',
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '',
      postalCode: suggestion.address?.postcode || '',
      country: suggestion.address?.country || 'Deutschland',
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon)
    };

    onChange(suggestion.display_name);
    setSelectedLocation({ lat: address.lat, lon: address.lon });
    setShowSuggestions(false);
    
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Straße, Hausnummer, PLZ, Stadt eingeben..."
          required={required}
        />
        
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.address?.road} {suggestion.address?.house_number}
                </div>
                <div className="text-xs text-gray-500">
                  {suggestion.address?.postcode} {suggestion.address?.city || suggestion.address?.town}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="mt-4 rounded-lg overflow-hidden border border-gray-300">
          <MapContainer
            center={[selectedLocation.lat, selectedLocation.lon]}
            zoom={15}
            style={{ height: '300px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
              <Popup>{value}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}
