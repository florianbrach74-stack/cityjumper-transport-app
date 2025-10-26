/**
 * Berechnet den Mindestpreis basierend auf Distanz und Fahrzeit
 * Formel: (Distanz × 0,50€) + (Fahrzeit in Stunden × 18€)
 * 
 * @param {number} distanceKm - Distanz in Kilometern
 * @param {number} durationMinutes - Fahrzeit in Minuten
 * @returns {number} Mindestpreis in Euro (gerundet auf 2 Dezimalstellen)
 */
const calculateMinimumPrice = (distanceKm, durationMinutes) => {
  const PRICE_PER_KM = 0.50; // 50 Cent pro Kilometer
  const HOURLY_RATE = 18.00; // 18€ pro Stunde (Mindestlohn)
  
  const distanceCost = distanceKm * PRICE_PER_KM;
  const durationHours = durationMinutes / 60;
  const timeCost = durationHours * HOURLY_RATE;
  
  const minimumPrice = distanceCost + timeCost;
  
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
  
  if (proposedPrice >= minimumPrice) {
    return {
      isValid: true,
      minimumPrice,
      proposedPrice,
      difference,
      message: 'Preis ist akzeptabel und hält Mindestlohn ein'
    };
  } else {
    return {
      isValid: false,
      minimumPrice,
      proposedPrice,
      difference,
      message: `Preis ist zu niedrig. Mindestpreis: €${minimumPrice.toFixed(2)} (Mindestlohn-Berechnung: ${distanceKm}km × €0,50 + ${Math.round(durationMinutes)}min × €18/h)`
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
  const PRICE_PER_KM = 0.50;
  const HOURLY_RATE = 18.00;
  
  const distanceCost = distanceKm * PRICE_PER_KM;
  const durationHours = durationMinutes / 60;
  const timeCost = durationHours * HOURLY_RATE;
  const minimumPrice = distanceCost + timeCost;
  const recommendedPrice = minimumPrice * 1.2;
  
  return {
    distanceKm,
    durationMinutes,
    durationHours: Math.round(durationHours * 100) / 100,
    distanceCost: Math.round(distanceCost * 100) / 100,
    timeCost: Math.round(timeCost * 100) / 100,
    minimumPrice: Math.round(minimumPrice * 100) / 100,
    recommendedPrice: Math.round(recommendedPrice * 100) / 100,
    breakdown: {
      perKm: PRICE_PER_KM,
      perHour: HOURLY_RATE
    }
  };
};

module.exports = {
  calculateMinimumPrice,
  calculateRecommendedPrice,
  validatePrice,
  calculatePriceBreakdown
};
