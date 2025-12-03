import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

export default function AddressSearch({ 
  label, 
  value, 
  onChange, 
  onAddressSelect,
  required = false,
  placeholder = "Straße, Hausnummer, PLZ, Stadt eingeben..."
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value && value.length > 2) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        searchAddress(value);
      }, 300);
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
      console.log('Search results:', data);
      setSuggestions(data);
      if (data.length > 0) {
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Address search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    const address = {
      full: suggestion.display_name,
      street: suggestion.address?.road || suggestion.address?.street || '',
      houseNumber: suggestion.address?.house_number || '',
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || suggestion.address?.municipality || '',
      postalCode: suggestion.address?.postcode || '',
      country: suggestion.address?.country || 'Deutschland',
      lat: parseFloat(suggestion.lat),
      lon: parseFloat(suggestion.lon)
    };

    // Format display value
    const displayValue = [
      address.street,
      address.houseNumber,
      address.postalCode,
      address.city
    ].filter(Boolean).join(', ');

    onChange(displayValue);
    setShowSuggestions(false);
    
    if (onAddressSelect) {
      onAddressSelect(address);
    }
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-primary-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="text-sm font-medium text-gray-900">
                  {suggestion.address?.road || suggestion.address?.street} {suggestion.address?.house_number}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {suggestion.address?.postcode} {suggestion.address?.city || suggestion.address?.town || suggestion.address?.village}
                  {suggestion.address?.state && `, ${suggestion.address.state}`}
                </div>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && suggestions.length === 0 && !loading && value.length > 2 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl p-4">
            <p className="text-sm text-gray-500">Keine Adressen gefunden</p>
          </div>
        )}
      </div>
    </div>
  );
}
