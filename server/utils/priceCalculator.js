/**
 * Berechnet den Mindestpreis basierend auf Distanz und Fahrzeit
 * Formel: 
 * - Unter 100km: (Distanz × 0,50€) + (Fahrzeit × 22,50€/h) + 6€ Startgebühr
 * - Über 100km: (Distanz × 0,70€) + (Fahrzeit × 22,50€/h) + 6€ Startgebühr
 * 
 * @param {number} distanceKm - Distanz in Kilometern
 * @param {number} durationMinutes - Fahrzeit in Minuten
 * @returns {number} Mindestpreis in Euro (gerundet auf 2 Dezimalstellen)
 */
const calculateMinimumPrice = (distanceKm, durationMinutes) => {
  const PRICE_PER_KM_SHORT = 0.50; // 50 Cent pro Kilometer (unter 100km)
  const PRICE_PER_KM_LONG = 0.70; // 70 Cent pro Kilometer (über 100km)
  const HOURLY_RATE = 22.50; // 22,50€ pro Stunde
  const START_FEE = 6.00; // 6€ Startgebühr
  
  const pricePerKm = distanceKm > 100 ? PRICE_PER_KM_LONG : PRICE_PER_KM_SHORT;
  const distanceCost = distanceKm * pricePerKm;
  const durationHours = durationMinutes / 60;
  const timeCost = durationHours * HOURLY_RATE;
  
  const minimumPrice = distanceCost + timeCost + START_FEE;
  
  return Math.round(minimumPrice * 100) / 100; // Runden auf 2 Dezimalstellen
};

/**
 * Berechnet einen empfohlenen Preis (mit Aufschlag)
 * 
 * @param {number} distanceKm - Distanz in Kilometern
 * @param {number} durationMinutes - Fahrzeit in Minuten
 * @returns {number} Empfohlener Preis in Euro
 */
const calculateRecommendedPrice = (distanceKm, durationMinutes) => {
  const minimumPrice = calculateMinimumPrice(distanceKm, durationMinutes);
  
  // 20% Aufschlag für Gewinn, Betriebskosten, etc.
  const recommendedPrice = minimumPrice * 1.2;
  
  return Math.round(recommendedPrice * 100) / 100;
};

/**
 * Prüft, ob ein vorgeschlagener Preis den Mindestlohn einhält
 * 
 * @param {number} proposedPrice - Vom Kunden vorgeschlagener Preis
 * @param {number} distanceKm - Distanz in Kilometern
 * @param {number} durationMinutes - Fahrzeit in Minuten
 * @returns {object} { isValid, minimumPrice, difference, message }
 */
const validatePrice = (proposedPrice, distanceKm, durationMinutes) => {
  const minimumPrice = calculateMinimumPrice(distanceKm, durationMinutes);
  const difference = proposedPrice - minimumPrice;
  const pricePerKm = distanceKm > 100 ? 0.70 : 0.50;
  
  if (proposedPrice >= minimumPrice) {
    return {
      isValid: true,
      minimumPrice,
      proposedPrice,
      difference,
      message: 'Preis ist akzeptabel'
    };
  } else {
    return {
      isValid: false,
      minimumPrice,
      proposedPrice,
      difference,
      message: `Preis ist zu niedrig. Mindestpreis: €${minimumPrice.toFixed(2)} (Berechnung: ${distanceKm}km × €${pricePerKm} + ${Math.round(durationMinutes)}min × €22,50/h + €6 Startgebühr)`
    };
  }
};

/**
 * Berechnet detaillierte Preisinformationen
 * 
 * @param {number} distanceKm - Distanz in Kilometern
 * @param {number} durationMinutes - Fahrzeit in Minuten
 * @param {number} extraStopsCount - Anzahl zusätzlicher Stops (optional)
 * @returns {object} Detaillierte Preisinformationen
 */
const calculatePriceBreakdown = (distanceKm, durationMinutes, extraStopsCount = 0) => {
  const PRICE_PER_KM_SHORT = 0.50;
  const PRICE_PER_KM_LONG = 0.70;
  const HOURLY_RATE = 22.50;
  const START_FEE = 6.00;
  const EXTRA_STOP_FEE = 6.00; // 6€ pro zusätzlichem Stop
  
  const pricePerKm = distanceKm > 100 ? PRICE_PER_KM_LONG : PRICE_PER_KM_SHORT;
  const distanceCost = distanceKm * pricePerKm;
  const durationHours = durationMinutes / 60;
  const timeCost = durationHours * HOURLY_RATE;
  const extraStopsCost = extraStopsCount * EXTRA_STOP_FEE;
  const minimumPrice = distanceCost + timeCost + START_FEE + extraStopsCost;
  const recommendedPrice = minimumPrice * 1.2;
  
  return {
    distanceKm,
    durationMinutes,
    durationHours: Math.round(durationHours * 100) / 100,
    distanceCost: Math.round(distanceCost * 100) / 100,
    timeCost: Math.round(timeCost * 100) / 100,
    startFee: START_FEE,
    extraStopsCount,
    extraStopsCost: Math.round(extraStopsCost * 100) / 100,
    minimumPrice: Math.round(minimumPrice * 100) / 100,
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    breakdown: {
      perKm: pricePerKm,
      perHour: HOURLY_RATE,
      startFee: START_FEE,
      extraStopFee: EXTRA_STOP_FEE,
      isLongDistance: distanceKm > 100
    }
  };
};

/**
 * Berechnet Preis für Multi-Stop-Aufträge
 * 
 * @param {Array} stops - Array von Stops mit {distanceKm, durationMinutes}
 * @returns {object} Preisinformationen für Multi-Stop-Route
 */
const calculateMultiStopPrice = (stops) => {
  if (!stops || stops.length === 0) {
    return calculatePriceBreakdown(0, 0, 0);
  }
  
  // Summiere alle Distanzen und Fahrzeiten
  const totalDistance = stops.reduce((sum, stop) => sum + (stop.distanceKm || 0), 0);
  const totalDuration = stops.reduce((sum, stop) => sum + (stop.durationMinutes || 0), 0);
  
  // Extra Stops = Anzahl der Stops minus 1 (der erste Stop ist im Grundpreis enthalten)
  const extraStopsCount = Math.max(0, stops.length - 1);
  
  return calculatePriceBreakdown(totalDistance, totalDuration, extraStopsCount);
};

module.exports = {
  calculateMinimumPrice,
  calculateRecommendedPrice,
  validatePrice,
  calculatePriceBreakdown,
  calculateMultiStopPrice
};
