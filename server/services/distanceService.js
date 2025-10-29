const axios = require('axios');

/**
 * Geocode an address to coordinates using Nominatim (OpenStreetMap)
 */
async function geocodeAddress(address, postalCode, city, country = 'Deutschland') {
  try {
    const fullAddress = `${address}, ${postalCode} ${city}, ${country}`;
    const url = 'https://nominatim.openstreetmap.org/search';
    
    const response = await axios.get(url, {
      params: {
        q: fullAddress,
        format: 'json',
        limit: 1,
        countrycodes: 'de'
      },
      headers: {
        'User-Agent': 'CityJumper-Transport-App'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
      };
    }
    
    console.warn(`⚠️ Could not geocode address: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error('❌ Geocoding error:', error.message);
    return null;
  }
}

/**
 * Calculate route using OSRM (Open Source Routing Machine)
 */
async function calculateRoute(startCoords, endCoords) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}`;
    
    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson'
      }
    });

    if (response.data.code === 'Ok' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance_km: (route.distance / 1000).toFixed(1), // meters to km
        duration_minutes: Math.ceil(route.duration / 60), // seconds to minutes
        geometry: route.geometry // GeoJSON for map display
      };
    }
    
    console.warn('⚠️ No route found');
    return null;
  } catch (error) {
    console.error('❌ Routing error:', error.message);
    return null;
  }
}

/**
 * Calculate distance and duration between two full addresses
 * Uses real geocoding and routing APIs (OpenStreetMap)
 * @param {string} pickupAddress - Full pickup address
 * @param {string} pickupPostalCode - Pickup postal code
 * @param {string} pickupCity - Pickup city
 * @param {string} deliveryAddress - Full delivery address
 * @param {string} deliveryPostalCode - Delivery postal code
 * @param {string} deliveryCity - Delivery city
 * @returns {Promise<{distance_km: number, duration_minutes: number, route_geometry: object}>}
 */
async function calculateDistanceAndDuration(
  pickupAddress, 
  pickupPostalCode, 
  pickupCity,
  deliveryAddress,
  deliveryPostalCode,
  deliveryCity
) {
  try {
    console.log(`📍 Calculating route: ${pickupCity} → ${deliveryCity}`);
    
    // Geocode both addresses
    const [startCoords, endCoords] = await Promise.all([
      geocodeAddress(pickupAddress, pickupPostalCode, pickupCity),
      geocodeAddress(deliveryAddress, deliveryPostalCode, deliveryCity)
    ]);

    if (!startCoords || !endCoords) {
      console.warn('⚠️ Could not geocode addresses, skipping route calculation');
      return { distance_km: null, duration_minutes: null, route_geometry: null };
    }

    // Small delay to respect rate limits (1 request per second for Nominatim)
    await new Promise(resolve => setTimeout(resolve, 1100));

    // Calculate route
    const routeData = await calculateRoute(startCoords, endCoords);
    
    if (!routeData) {
      console.warn('⚠️ Could not calculate route');
      return { distance_km: null, duration_minutes: null, route_geometry: null };
    }

    console.log(`✅ Route: ${routeData.distance_km} km, ${routeData.duration_minutes} min`);

    return {
      distance_km: parseFloat(routeData.distance_km),
      duration_minutes: routeData.duration_minutes,
      route_geometry: routeData.geometry
    };

  } catch (error) {
    console.error('❌ Error calculating distance:', error.message);
    return { distance_km: null, duration_minutes: null, route_geometry: null };
  }
}

module.exports = {
  calculateDistanceAndDuration
};
