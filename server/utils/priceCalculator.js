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
 * @returns {object} Detaillierte Preisinformationen
 */
const calculatePriceBreakdown = (distanceKm, durationMinutes) => {
  const PRICE_PER_KM_SHORT = 0.50;
  const PRICE_PER_KM_LONG = 0.70;
  const HOURLY_RATE = 22.50;
  const START_FEE = 6.00;
  
  const pricePerKm = distanceKm > 100 ? PRICE_PER_KM_LONG : PRICE_PER_KM_SHORT;
  const distanceCost = distanceKm * pricePerKm;
  const durationHours = durationMinutes / 60;
  const timeCost = durationHours * HOURLY_RATE;
  const minimumPrice = distanceCost + timeCost + START_FEE;
  const recommendedPrice = minimumPrice * 1.2;
  
  return {
    distanceKm,
    durationMinutes,
    durationHours: Math.round(durationHours * 100) / 100,
    distanceCost: Math.round(distanceCost * 100) / 100,
    timeCost: Math.round(timeCost * 100) / 100,
    startFee: START_FEE,
    minimumPrice: Math.round(minimumPrice * 100) / 100,
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    breakdown: {
      perKm: pricePerKm,
      perHour: HOURLY_RATE,
      startFee: START_FEE,
      isLongDistance: distanceKm > 100
    }
  };
};

module.exports = {
  calculateMinimumPrice,
  calculateRecommendedPrice,
  validatePrice,
  calculatePriceBreakdown
};
