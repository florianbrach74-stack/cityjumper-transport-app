# 🔴 Stornierungssystem - Implementierungsstatus

## ✅ Was bereits existiert:

### Datenbank:
- ✅ `transport_orders` Tabelle mit allen Stornierungsspalten
- ✅ `cancellation_history` Tabelle
- ✅ `contractor_penalties` Tabelle
- ✅ Alle benötigten Felder vorhanden

### Backend:
- ✅ `/api/cancellation/:orderId/cancel-by-customer` - Kunden-Stornierung
- ✅ `/api/cancellation/:orderId/cancel-by-contractor` - Auftragnehmer-Stornierung  
- ✅ `/api/cancellation/:orderId/cancellation-preview` - Gebühren-Vorschau
- ✅ `/api/cancellation/:orderId/history` - Stornierungshistorie

### Gebührenberechnung:
- ✅ >24h: 0%
- ✅ 12-24h: 50%
- ✅ 2-12h: 75%
- ✅ <2h: 100%

---

## ⚠️ Was angepasst werden muss:

### 1. Auftragnehmer-Stornierung (Route bereits vorhanden, aber Logik falsch)

**Aktuell:**
```javascript
// Admin setzt manuell: cancellationType ('paid' oder 'free')
// Bei 'paid': Penalty wird berechnet
// Bei 'free': Keine Penalty (Höhere Gewalt)
```

**Sollte sein:**
```javascript
// Berechne Penalty basierend auf Stunden bis Abholung (wie bei Kunde)
const hoursBeforePickup = calculateHoursUntilPickup(order);
const contractorPayout = order.price * 0.85; // Was AN bekommen hätte

// Penalty-Staffelung (gleich wie Kunde, §7.2b AGB)
let penaltyPercentage = 0;
if (hoursBeforePickup < 2) penaltyPercentage = 1.00;  // 100%
else if (hoursBeforePickup < 12) penaltyPercentage = 0.75;  // 75%
else if (hoursBeforePickup < 24) penaltyPercentage = 0.50;  // 50%
else penaltyPercentage = 0;  // Kostenfrei

const contractorPenalty = contractorPayout * penaltyPercentage;

// Budget für Neuvermittlung
const availableBudget = order.price + contractorPenalty;

// Status zurück auf 'pending' (NICHT 'completed'!)
status = 'pending';
contractor_id = NULL;
```

### 2. Preis-Anpassung nach AN-Stornierung

**Neu hinzufügen:**
```javascript
POST /api/admin/orders/:orderId/adjust-price
{
  newContractorPrice: 110  // Admin kann Preis erhöhen
}

// Validierung:
if (newPrice > order.available_budget) {
  throw new Error('Preis überschreitet Budget');
}

// Update:
adjusted_contractor_price = newPrice;
platform_profit = available_budget - newPrice;

// Kunde zahlt weiterhin: order.price (original)
// Neuer AN sieht: newPrice
```

### 3. Kunden-Stornierung (bereits gut, kleine Anpassung)

**Aktuell:** ✅ Funktioniert bereits korrekt!
- Gebühren werden berechnet
- AN bekommt Entschädigung
- Status auf 'completed'

**Kleine Anpassung:**
```javascript
// Verwende customer_cancellation_fee statt cancellation_fee
customer_cancellation_fee = calculatedFee;
contractor_compensation = calculatedFee * 0.85;  // AN bekommt 85%
platform_profit = calculatedFee * 0.15;  // Plattform 15%
```

---

## 🎯 TODO - Priorität HOCH:

### Backend:
1. [ ] `server/routes/cancellation.js` - Zeile 173-279 anpassen:
   - Entferne `cancellationType` Parameter
   - Berechne Penalty automatisch basierend auf Stunden
   - Setze `available_budget` korrekt
   - Status auf 'pending' (nicht 'completed')

2. [ ] Neue Route hinzufügen:
   ```javascript
   POST /api/admin/orders/:orderId/adjust-contractor-price
   ```

### Frontend - Admin-Dashboard:
1. [ ] Button "Auftragnehmer-Stornierung" 
   - Zeige Penalty-Vorschau
   - Zeige verfügbares Budget
   - Bestätigung erforderlich

2. [ ] Nach Stornierung: "Preis anpassen" Button
   - Input: Neuer Preis für AN
   - Zeige: Verfügbares Budget
   - Zeige: Plattform-Gewinn
   - Validierung: Preis <= Budget

3. [ ] Stornierte Aufträge anzeigen
   - Filter: "Storniert - Neuvermittlung"
   - Zeige: Verfügbares Budget
   - Zeige: Ursprünglicher Preis
   - Button: "Preis anpassen"

### Frontend - Kunden-Dashboard:
1. [ ] Button "Auftrag stornieren"
   - Zeige Gebühren-Vorschau
   - Warnung je nach Zeitpunkt
   - Bestätigung erforderlich

---

## 📊 Beispiel-Flow:

### Auftragnehmer storniert 10h vor Abholung:

```
1. Admin klickt "AN-Stornierung"
   
2. System berechnet:
   - Kundenpreis: €100
   - AN hätte bekommen: €85 (85%)
   - Stunden bis Abholung: 10h
   - Penalty: €63,75 (75% von €85)
   - Verfügbares Budget: €163,75

3. Auftrag:
   - Status: 'pending'
   - contractor_id: NULL
   - available_budget: €163,75
   - contractor_penalty: €63,75

4. Admin erhöht Preis auf €110:
   - adjusted_contractor_price: €110
   - platform_profit: €53,75 (€163,75 - €110)
   
5. Neuer AN sieht: €110
   Kunde zahlt: €100 (unverändert)
   Plattform verdient: €53,75
```

---

## 🚀 Nächste Schritte:

1. Backend-Route anpassen (30 Min)
2. Admin-Dashboard UI (45 Min)
3. Kunden-Dashboard UI (30 Min)
4. Testen (30 Min)
5. Deployen (5 Min)

**Geschätzte Zeit: ~2,5 Stunden**

---

**Status:** Datenbank fertig, Backend teilweise, Frontend TODO
**Datum:** 26. November 2025
