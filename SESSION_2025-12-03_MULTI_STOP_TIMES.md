# Session 2025-12-03: Multi-Stop Zeitfenster & Mitarbeiter-Zuweisung

## Zusammenfassung
Implementierung von Zeitfenstern für zusätzliche Zustellungen mit Validierung und Behebung von Mitarbeiter-Zuweisungsproblemen.

---

## 🎯 Hauptziele

### 1. Zeitfenster für zusätzliche Zustellungen
- **Problem:** Zusätzliche Zustellungen hatten keine eigenen Zeitfenster
- **Lösung:** 
  - Eingabefelder für "Zustellung VON" und "Zustellung BIS" hinzugefügt
  - Validierung: Zustellung BIS muss mindestens Hauptzustellung BIS + 10 Min sein
  - Zustellung VON ist frei wählbar (z.B. für Ladenöffnungszeiten)

### 2. Zeitfenster-Anzeige überall
- **Problem:** Zeitfenster wurden nicht in allen Views angezeigt
- **Lösung:** Zeitfenster-Anzeige in allen Plattform-Bereichen:
  - Admin Details Modal
  - Contractor Dashboard
  - Employee Dashboard

### 3. Mitarbeiter sehen keine zugewiesenen Aufträge
- **Problem:** Mitarbeiter sahen Aufträge mit Status 'accepted' nicht
- **Lösung:** Status 'accepted' zur Query hinzugefügt

---

## 📝 Änderungen im Detail

### Backend

#### `server/routes/employee-assignment.js`
**Zeile 244:** Status 'accepted' hinzugefügt
```javascript
AND o.status IN ('approved', 'accepted', 'picked_up', 'in_transit')
```

**Grund:** Aufträge die vom Contractor angenommen wurden (Status 'accepted') müssen auch für zugewiesene Mitarbeiter sichtbar sein.

---

### Frontend

#### `client/src/components/MultiStopManager.jsx`

**Zeitfenster-Eingabe (Zeile 191-228):**
```javascript
{type === 'delivery' && (
  <div className="grid grid-cols-2 gap-3 bg-blue-50 p-3 rounded-md">
    {!mainDeliveryTimeEnd && (
      <div className="col-span-2 bg-yellow-50 border border-yellow-300 rounded p-2 mb-2">
        <p className="text-xs text-yellow-800">
          ⚠️ Bitte zuerst die Hauptzustellzeit oben eingeben
        </p>
      </div>
    )}
    <div>
      <label>Zustellung VON * (z.B. Ladenöffnung)</label>
      <input type="time" value={newStop.time_start} ... />
    </div>
    <div>
      <label>Zustellung BIS * (mind. {mainDeliveryTimeEnd + 10 Min})</label>
      <input type="time" value={newStop.time_end} ... />
    </div>
  </div>
)}
```

**Validierung (Zeile 32-67):**
```javascript
if (type === 'delivery') {
  if (!newStop.time_start || !newStop.time_end) {
    alert('Bitte Zeitfenster eingeben');
    return;
  }
  
  if (!mainDeliveryTimeEnd) {
    alert('Bitte zuerst die Hauptzustellzeit (Zustellung BIS) oben eingeben');
    return;
  }
  
  // Berechne Mindestzeit: Hauptzustellung BIS + 10 Min
  const [mainH, mainM] = mainDeliveryTimeEnd.split(':').map(Number);
  const minEndMinutes = (mainH * 60 + mainM) + 10;
  
  // Zustellung BIS muss >= Mindestzeit sein
  const [endH, endM] = newStop.time_end.split(':').map(Number);
  const endMinutes = endH * 60 + endM;
  
  if (endMinutes < minEndMinutes) {
    alert(`Zustellung BIS muss mindestens ${minTimeEnd} sein`);
    return;
  }
  
  // Zustellung BIS muss nach Zustellung VON sein
  const [startH, startM] = newStop.time_start.split(':').map(Number);
  if (endMinutes <= (startH * 60 + startM)) {
    alert('Zustellung BIS muss nach Zustellung VON sein');
    return;
  }
}
```

**Zeitfenster-Anzeige in Stop-Liste (Zeile 268-272):**
```javascript
{stop.time_start && stop.time_end && (
  <div className="text-blue-600 font-medium">
    ⏰ {stop.time_start} - {stop.time_end}
  </div>
)}
```

---

#### `client/src/components/CreateOrderModal.jsx`

**Zeile 798:** Übergabe der Hauptzustellzeit an MultiStopManager
```javascript
<MultiStopManager
  type="delivery"
  stops={deliveryStops}
  onStopsChange={setDeliveryStops}
  mainDeliveryTimeEnd={formData.delivery_time_to}
/>
```

---

#### `client/src/components/DetailedOrderView.jsx`

**Feldnamen korrigiert (Zeile 225-226, 250-251):**
```javascript
// Vorher: pickup_time_start / pickup_time_end
// Jetzt:   pickup_time_from / pickup_time_to
{order.pickup_time_from && order.pickup_time_to && (
  <> • {order.pickup_time_from} - {order.pickup_time_to}</>
)}
```

**Zeitfenster für Pickup Stops (Zeile 277-279):**
```javascript
{stop.time_start && stop.time_end && (
  <div className="text-green-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
)}
```

**Zeitfenster für Delivery Stops (Zeile 292-294):**
```javascript
{stop.time_start && stop.time_end && (
  <div className="text-blue-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
)}
```

---

#### `client/src/pages/EmployeeDashboard.jsx`

**Feldnamen korrigiert (Zeile 337-338, 355-356):**
```javascript
{order.pickup_time_from && order.pickup_time_to && (
  <> • {order.pickup_time_from} - {order.pickup_time_to}</>
)}
```

**Zeitfenster für Stops (Zeile 374-376, 387-389):**
```javascript
// Pickup Stops
{stop.time_start && stop.time_end && (
  <div className="text-green-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
)}

// Delivery Stops
{stop.time_start && stop.time_end && (
  <div className="text-blue-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
)}
```

---

#### `client/src/pages/ContractorDashboard.jsx`

**Zeitfenster für Pickup Stops (Zeile 381-383):**
```javascript
{stop.time_start && stop.time_end && (
  <div className="text-blue-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
)}
```

**Zeitfenster für Delivery Stops (Zeile 426-428):**
```javascript
{stop.time_start && stop.time_end && (
  <div className="text-blue-600 font-medium">⏰ {stop.time_start} - {stop.time_end}</div>
)}
```

---

## 🔧 Technische Details

### Datenbankfelder
- **Hauptzeitfenster:** `pickup_time_from`, `pickup_time_to`, `delivery_time_from`, `delivery_time_to`
- **Stop-Zeitfenster:** Gespeichert als JSON in `pickup_stops` und `delivery_stops` Arrays
  ```json
  {
    "address": "am amtsgraben 28",
    "city": "berlin",
    "postal_code": "12559",
    "time_start": "07:00",
    "time_end": "14:10"
  }
  ```

### Validierungslogik
1. **Hauptzustellzeit muss eingegeben sein** bevor zusätzliche Stops hinzugefügt werden
2. **Zustellung VON:** Frei wählbar (z.B. 07:00 für Ladenöffnung)
3. **Zustellung BIS:** Mindestens Hauptzustellung BIS + 10 Minuten
4. **Zustellung BIS muss nach Zustellung VON sein**

### Beispiel
```
Hauptzustellung: 10:00 - 14:00

✅ Zusätzliche Zustellung: 07:00 - 14:10 (BIS ist 14:00 + 10 Min)
✅ Zusätzliche Zustellung: 12:00 - 15:00 (BIS ist nach 14:10)
❌ Zusätzliche Zustellung: 07:00 - 14:00 (BIS muss mindestens 14:10 sein)
❌ Zusätzliche Zustellung: 15:00 - 14:30 (BIS muss nach VON sein)
```

---

## 🐛 Behobene Bugs

### 1. Feldnamen-Inkonsistenz
**Problem:** Frontend verwendete `pickup_time_start/end`, Backend speichert `pickup_time_from/to`
**Lösung:** Frontend auf Backend-Feldnamen angepasst

### 2. Mitarbeiter sehen keine Aufträge
**Problem:** Status 'accepted' fehlte in der Query
**Lösung:** Status 'accepted' zur Filterliste hinzugefügt

### 3. Zeitfelder nicht sichtbar
**Problem:** Zeitfelder wurden nur angezeigt wenn `mainDeliveryTimeEnd` gesetzt war
**Lösung:** Felder immer anzeigen, aber Warnung wenn Hauptzeit fehlt

---

## 📊 Betroffene Dateien

### Backend (1 Datei)
- `server/routes/employee-assignment.js`

### Frontend (5 Dateien)
- `client/src/components/MultiStopManager.jsx`
- `client/src/components/CreateOrderModal.jsx`
- `client/src/components/DetailedOrderView.jsx`
- `client/src/pages/EmployeeDashboard.jsx`
- `client/src/pages/ContractorDashboard.jsx`

---

## 🚀 Deployment

### Git Commits
```bash
# Zeitfenster-Validierung
git commit -m "FIX: Correct time validation - VON is free, BIS must be at least main delivery end + 10 min"

# Zeitfenster-Anzeige
git commit -m "FEAT: Display delivery stop time windows in all user views"

# Zeitfelder immer anzeigen
git commit -m "FIX: Always show time fields for delivery stops, add warning if main delivery time not set"

# Feldnamen korrigiert
git commit -m "FIX: Use correct field names pickup_time_from/to and delivery_time_from/to to match backend"

# Pickup Stop Zeiten
git commit -m "FEAT: Display time windows for pickup stops in all views"

# Mitarbeiter-Zuweisung
git commit -m "FIX: Add 'accepted' status to employee orders query"
```

### Vercel Deployment
- Frontend automatisch deployed nach Git Push
- URL: https://cityjumper-transport-app.vercel.app

### Railway Deployment
- Backend automatisch deployed nach Git Push
- URL: https://cityjumper-api-production-01e4.up.railway.app

---

## ✅ Testing Checklist

- [x] Zeitfenster-Eingabe für zusätzliche Zustellungen funktioniert
- [x] Validierung: Zustellung BIS >= Hauptzustellung BIS + 10 Min
- [x] Validierung: Zustellung BIS > Zustellung VON
- [x] Warnung wenn Hauptzustellzeit nicht eingegeben
- [x] Zeitfenster werden in Admin Details angezeigt
- [x] Zeitfenster werden im Contractor Dashboard angezeigt
- [x] Zeitfenster werden im Employee Dashboard angezeigt
- [x] Zeitfenster für Pickup Stops werden angezeigt
- [x] Zeitfenster für Delivery Stops werden angezeigt
- [x] Mitarbeiter sehen zugewiesene Aufträge mit Status 'accepted'
- [x] Hauptzeitfenster (Abholung/Zustellung) werden korrekt angezeigt

---

## 📌 Wichtige Hinweise

### Assignment Modes
**Manual Assignment:**
- Mitarbeiter sieht nur ihm zugewiesene Aufträge
- Status: 'approved', 'accepted', 'picked_up', 'in_transit'

**All Access:**
- Mitarbeiter sieht alle 'approved' nicht-zugewiesenen Aufträge (kann übernehmen)
- Plus alle eigenen Aufträge (egal welcher Status)

### Zeitfenster-Speicherung
- Hauptzeitfenster: Separate Felder in `transport_orders` Tabelle
- Stop-Zeitfenster: JSON in `pickup_stops` und `delivery_stops` Arrays
- Automatische Speicherung beim Erstellen des Auftrags

---

## 🔮 Nächste Schritte

1. **System-Stabilität überwachen** - Prüfen ob System ohne weitere Deployments stabil bleibt
2. **User Testing** - Zeitfenster-Funktionalität mit echten Aufträgen testen
3. **CMR PDF** - Prüfen ob Zeitfenster auch im CMR PDF korrekt angezeigt werden

---

## 📞 Support

Bei Fragen oder Problemen:
- GitHub Issues: https://github.com/florianbra74-stack/cityjumper-transport-app/issues
- Railway Logs: https://railway.app/project/cityjumper-api-production-01e4
- Vercel Logs: https://vercel.com/cityjumper-transport-app

---

**Session Ende:** 2025-12-03 10:54 UTC+01:00
**Status:** ✅ Alle Änderungen deployed und getestet
