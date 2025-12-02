const axios = require('axios');

// Configuration
const NOMINATIM_DELAY = 1100; // 1.1 seconds between requests (rate limit)
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRIES = 2; // Retry failed requests twice

/**
 * Geocode an address to coordinates using Nominatim (OpenStreetMap)
 * Includes retry logic and better error handling
 */
async function geocodeAddress(address, postalCode, city, country = 'Deutschland', retryCount = 0) {
  try {
    const fullAddress = `${address}, ${postalCode} ${city}, ${country}`;
    const url = 'https://nominatim.openstreetmap.org/search';
    
    console.log(`🔍 Geocoding (attempt ${retryCount + 1}/${MAX_RETRIES + 1}): ${fullAddress}`);
    
    const response = await axios.get(url, {
      params: {
        q: fullAddress,
        format: 'json',
        limit: 3, // Get top 3 results for better matching
        countrycodes: 'de',
        addressdetails: 1 // Get detailed address info
      },
      headers: {
        'User-Agent': 'Courierly-Transport-App/1.0'
      },
      timeout: REQUEST_TIMEOUT
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      console.log(`✅ Geocoded: ${result.display_name}`);
      return {
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name
      };
    }
    
    // Try alternative format if first attempt failed
    if (retryCount === 0) {
      console.log(`⚠️ No results, trying alternative format...`);
      const alternativeAddress = `${address}, ${city}`;
      const altResponse = await axios.get(url, {
        params: {
          q: alternativeAddress,
          format: 'json',
          limit: 3,
          countrycodes: 'de',
          postalcode: postalCode
        },
        headers: {
          'User-Agent': 'Courierly-Transport-App/1.0'
        },
        timeout: REQUEST_TIMEOUT
      });
      
      if (altResponse.data && altResponse.data.length > 0) {
        const result = altResponse.data[0];
        console.log(`✅ Geocoded (alternative): ${result.display_name}`);
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          display_name: result.display_name
        };
      }
    }
    
    console.warn(`⚠️ Could not geocode address: ${fullAddress}`);
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error (attempt ${retryCount + 1}):`, error.message);
    
    // Retry on network errors or timeouts
    if (retryCount < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout'))) {
      console.log(`🔄 Retrying geocoding...`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      return geocodeAddress(address, postalCode, city, country, retryCount + 1);
    }
    
    return null;
  }
}

/**
 * Calculate route using OSRM (Open Source Routing Machine)
 * Includes retry logic and fallback to straight-line distance
 */
async function calculateRoute(startCoords, endCoords, retryCount = 0) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lon},${startCoords.lat};${endCoords.lon},${endCoords.lat}`;
    
    console.log(`🗺️ Calculating route (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
    
    const response = await axios.get(url, {
      params: {
        overview: 'full',
        geometries: 'geojson',
        alternatives: false
      },
      timeout: REQUEST_TIMEOUT
    });

    if (response.data.code === 'Ok' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const distanceKm = (route.distance / 1000).toFixed(1);
      const durationMin = Math.ceil(route.duration / 60);
      
      console.log(`✅ Route calculated: ${distanceKm}km, ${durationMin}min`);
      
      return {
        distance_km: distanceKm,
        duration_minutes: durationMin,
        geometry: route.geometry
      };
    }
    
    console.warn('⚠️ No route found, using fallback calculation');
    return calculateFallbackRoute(startCoords, endCoords);
  } catch (error) {
    console.error(`❌ Routing error (attempt ${retryCount + 1}):`, error.message);
    
    // Retry on network errors or timeouts
    if (retryCount < MAX_RETRIES && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout'))) {
      console.log(`🔄 Retrying route calculation...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return calculateRoute(startCoords, endCoords, retryCount + 1);
    }
    
    // Fallback to straight-line distance calculation
    console.log('⚠️ Using fallback distance calculation');
    return calculateFallbackRoute(startCoords, endCoords);
  }
}

/**
 * Calculate fallback route using Haversine formula (straight-line distance)
 * Used when routing API fails
 */
function calculateFallbackRoute(startCoords, endCoords) {
  try {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(endCoords.lat - startCoords.lat);
    const dLon = toRad(endCoords.lon - startCoords.lon);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(startCoords.lat)) * Math.cos(toRad(endCoords.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineDistance = R * c;
    
    // Estimate road distance (typically 1.3x straight-line for urban areas)
    const estimatedDistance = (straightLineDistance * 1.3).toFixed(1);
    // Estimate duration (assuming 40 km/h average speed)
    const estimatedDuration = Math.ceil((estimatedDistance / 40) * 60);
    
    console.log(`📏 Fallback route: ${estimatedDistance}km (estimated), ${estimatedDuration}min`);
    
    return {
      distance_km: estimatedDistance,
      duration_minutes: estimatedDuration,
      geometry: null, // No geometry for fallback
      is_fallback: true
    };
  } catch (error) {
    console.error('❌ Fallback calculation error:', error.message);
    return null;
  }
}

/**
 * Convert degrees to radians
 */
function toRad(degrees) {
  return degrees * (Math.PI / 180);
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
      const missingAddress = !startCoords ? 'pickup' : 'delivery';
      console.error(`❌ Could not geocode ${missingAddress} address`);
      throw new Error(`Adresse konnte nicht gefunden werden: ${missingAddress === 'pickup' ? 'Abholadresse' : 'Lieferadresse'}`);
    }
    
    console.log(`✅ Both addresses geocoded successfully`);

    // Small delay to respect rate limits (1 request per second for Nominatim)
    await new Promise(resolve => setTimeout(resolve, NOMINATIM_DELAY));

    // Calculate route
    const routeData = await calculateRoute(startCoords, endCoords);
    
    if (!routeData) {
      console.error('❌ Route calculation failed completely');
      throw new Error('Route konnte nicht berechnet werden');
    }
    
    // Warn if using fallback
    if (routeData.is_fallback) {
      console.warn('⚠️ Using estimated distance (routing API unavailable)');
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
