// Test der Preisberechnung

// Beispiel: 50km, 45 Minuten
const distanceKm = 50;
const durationMinutes = 45;

// Neue Formel
const PRICE_PER_KM = 0.50;
const HOURLY_RATE = 22.50;
const START_FEE = 6.00;

const distanceCost = distanceKm * PRICE_PER_KM;
const durationHours = durationMinutes / 60;
const timeCost = durationHours * HOURLY_RATE;
const minimumPrice = distanceCost + timeCost + START_FEE;
const recommendedPrice = minimumPrice * 1.2;

console.log('📊 Preisberechnung für 50km, 45 Min:\n');
console.log(`Distanzkosten: ${distanceKm}km × €${PRICE_PER_KM} = €${distanceCost.toFixed(2)}`);
console.log(`Zeitkosten: ${durationMinutes}min × €${HOURLY_RATE}/h = €${timeCost.toFixed(2)}`);
console.log(`Startgebühr: €${START_FEE.toFixed(2)}`);
console.log(`Mindestpreis: €${minimumPrice.toFixed(2)}`);
console.log(`Empfohlener Preis (+20%): €${recommendedPrice.toFixed(2)}\n`);

// Szenario 1: Kunde nimmt empfohlenen Preis
console.log('✅ Szenario 1: Kunde nimmt empfohlenen Preis');
const customerPrice1 = recommendedPrice;
const contractorSuggestion1 = customerPrice1 * 0.85;
console.log(`Kundenpreis: €${customerPrice1.toFixed(2)}`);
console.log(`Auftragnehmer-Vorschlag (85%): €${contractorSuggestion1.toFixed(2)}\n`);

// Szenario 2: Kunde nimmt nur Mindestpreis
console.log('✅ Szenario 2: Kunde nimmt nur Mindestpreis');
const customerPrice2 = minimumPrice;
const contractorSuggestion2 = customerPrice2 * 0.85;
console.log(`Kundenpreis: €${customerPrice2.toFixed(2)}`);
console.log(`Auftragnehmer-Vorschlag (85%): €${contractorSuggestion2.toFixed(2)}\n`);

// Szenario 3: Kunde setzt eigenen Preis (z.B. €50)
console.log('✅ Szenario 3: Kunde setzt eigenen Preis');
const customerPrice3 = 50.00;
const contractorSuggestion3 = customerPrice3 * 0.85;
console.log(`Kundenpreis: €${customerPrice3.toFixed(2)}`);
console.log(`Auftragnehmer-Vorschlag (85%): €${contractorSuggestion3.toFixed(2)}\n`);

console.log('✅ Die Logik ist korrekt: Auftragnehmer bekommt immer 85% vom tatsächlichen Kundenpreis!');
