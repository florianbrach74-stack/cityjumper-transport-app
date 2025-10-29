/**
 * Simple distance and duration calculation service
 * Uses Haversine formula for straight-line distance and applies road factor
 */

/**
 * Get approximate coordinates for German postal code
 */
function getCoordinatesFromPostalCode(postalCode) {
  const firstDigit = parseInt(postalCode.toString()[0]);
  
  // Approximate coordinates for German regions
  const regionCoords = {
    0: { lat: 51.5, lon: 10.5 },  // Sachsen, Thüringen
    1: { lat: 52.5, lon: 13.4 },  // Berlin, Brandenburg
    2: { lat: 53.5, lon: 10.0 },  // Hamburg, Schleswig-Holstein
    3: { lat: 52.3, lon: 9.7 },   // Niedersachsen
    4: { lat: 51.5, lon: 7.5 },   // NRW
    5: { lat: 50.9, lon: 6.9 },   // NRW (Köln)
    6: { lat: 50.1, lon: 8.7 },   // Hessen
    7: { lat: 48.8, lon: 9.2 },   // Baden-Württemberg
    8: { lat: 48.1, lon: 11.6 },  // Bayern (München)
    9: { lat: 49.5, lon: 11.0 }   // Bayern (Nürnberg)
  };
  
  return regionCoords[firstDigit] || { lat: 51.0, lon: 10.0 };
}

/**
 * Calculate straight-line distance using Haversine formula
 */
function calculateStraightLineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate distance and duration between two addresses
 * @param {string} pickupPostalCode - Pickup postal code
 * @param {string} deliveryPostalCode - Delivery postal code
 * @returns {{distance_km: number, duration_minutes: number}}
 */
function calculateDistanceAndDuration(pickupPostalCode, deliveryPostalCode) {
  try {
    // Get approximate coordinates
    const originCoords = getCoordinatesFromPostalCode(pickupPostalCode);
    const destCoords = getCoordinatesFromPostalCode(deliveryPostalCode);
    
    // Calculate straight-line distance
    const straightLineDistance = calculateStraightLineDistance(
      originCoords.lat, originCoords.lon,
      destCoords.lat, destCoords.lon
    );
    
    // Apply road factor (roads are not straight, typically 1.3x longer)
    const roadFactor = 1.3;
    const distance_km = Math.round(straightLineDistance * roadFactor * 10) / 10;
    
    // Estimate duration based on average speed
    // Average: ~80 km/h for mixed routes (Autobahn + Landstraße)
    const averageSpeed = 80; // km/h
    const duration_hours = distance_km / averageSpeed;
    const duration_minutes = Math.ceil(duration_hours * 60);

    console.log(`📍 Distance: ${distance_km} km, Duration: ${duration_minutes} min`);

    return {
      distance_km: distance_km,
      duration_minutes: duration_minutes
    };

  } catch (error) {
    console.error('❌ Error calculating distance:', error.message);
    return { distance_km: null, duration_minutes: null };
  }
}

module.exports = {
  calculateDistanceAndDuration
};
