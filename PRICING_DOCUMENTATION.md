# 💰 Preiskalkulation - Vollständige Dokumentation

## Übersicht

Das ZipMend Transport Management System verwendet eine transparente, mindestlohnbasierte Preiskalkulation, die automatisch auf Basis von Distanz, Fahrzeit und zusätzlichen Stops berechnet wird.

## Grundformel

```
Mindestpreis = Distanz-Kosten + Zeit-Kosten + Startgebühr + Extra-Stops-Gebühr

Empfohlener Preis = Mindestpreis × 1.2 (20% Aufschlag)
```

## Preiskomponenten im Detail

### 1. Distanz-Kosten

Die Distanz-Kosten variieren je nach Streckenlänge:

| Distanz | Preis pro Kilometer |
|---------|-------------------|
| **Unter 100km** | 0,50€ |
| **Über 100km** | 0,70€ |

**Beispiele:**
- 50km → 50 × 0,50€ = **25,00€**
- 150km → 150 × 0,70€ = **105,00€**

### 2. Zeit-Kosten

Basierend auf dem gesetzlichen Mindestlohn:

- **Stundensatz**: 22,50€ pro Stunde
- Berechnung: `(Fahrzeit in Minuten ÷ 60) × 22,50€`

**Beispiele:**
- 30 Minuten → 0,5h × 22,50€ = **11,25€**
- 2 Stunden → 2h × 22,50€ = **45,00€**
- 2,5 Stunden → 2,5h × 22,50€ = **56,25€**

### 3. Startgebühr

- **Fixe Gebühr**: 6,00€ pro Auftrag
- Deckt Grundkosten wie Verwaltung, Versicherung, etc.

### 4. Extra-Stops-Gebühr

Für Multi-Stop-Aufträge:

- **6,00€ pro zusätzlichem Stop**
- Zählt jeden Stop über den ersten hinaus
- Gilt für Abholungen UND Zustellungen

**Berechnung:**
```
Anzahl Extra-Stops = (Anzahl Abholungen + Anzahl Zustellungen) - 1
Extra-Stops-Gebühr = Anzahl Extra-Stops × 6,00€
```

**Beispiele:**
- 1 Abholung + 1 Zustellung = 1 Stop = **0€** (Standard)
- 2 Abholungen + 1 Zustellung = 2 Stops = **6€**
- 3 Abholungen + 2 Zustellungen = 4 Stops = **18€**
- 5 Abholungen + 5 Zustellungen = 9 Stops = **48€**

### 5. Aufschlag (Empfohlener Preis)

- **20% Aufschlag** auf den Mindestpreis
- Deckt Gewinn, Betriebskosten, Risiko
- Kunde kann Preis anpassen, aber nicht unter Mindestpreis

## Vollständige Berechnungsbeispiele

### Beispiel 1: Einfacher Auftrag

**Route:** Berlin → Leipzig  
**Distanz:** 190km  
**Fahrzeit:** 2 Stunden  
**Stops:** 1 Abholung, 1 Zustellung (Standard)

```
Distanz-Kosten:    190km × 0,70€    = 133,00€
Zeit-Kosten:       2h × 22,50€      = 45,00€
Startgebühr:                        = 6,00€
Extra-Stops:       0 × 6,00€        = 0,00€
─────────────────────────────────────────────
Mindestpreis:                       = 184,00€
Empfohlener Preis: 184,00€ × 1.2   = 220,80€
```

### Beispiel 2: Multi-Stop-Auftrag

**Route:** Berlin → Potsdam → Leipzig → Halle  
**Distanz gesamt:** 220km  
**Fahrzeit gesamt:** 2,5 Stunden  
**Stops:** 2 Abholungen (Berlin, Potsdam), 2 Zustellungen (Leipzig, Halle)

```
Distanz-Kosten:    220km × 0,70€    = 154,00€
Zeit-Kosten:       2,5h × 22,50€    = 56,25€
Startgebühr:                        = 6,00€
Extra-Stops:       3 × 6,00€        = 18,00€
                   (4 Stops - 1)
─────────────────────────────────────────────
Mindestpreis:                       = 234,25€
Empfohlener Preis: 234,25€ × 1.2   = 281,10€
```

### Beispiel 3: Kurze Strecke

**Route:** Berlin Mitte → Berlin Spandau  
**Distanz:** 25km  
**Fahrzeit:** 30 Minuten  
**Stops:** 1 Abholung, 1 Zustellung (Standard)

```
Distanz-Kosten:    25km × 0,50€     = 12,50€
Zeit-Kosten:       0,5h × 22,50€    = 11,25€
Startgebühr:                        = 6,00€
Extra-Stops:       0 × 6,00€        = 0,00€
─────────────────────────────────────────────
Mindestpreis:                       = 29,75€
Empfohlener Preis: 29,75€ × 1.2    = 35,70€
```

### Beispiel 4: Komplexer Multi-Stop

**Route:** Berlin → Brandenburg → Potsdam → Leipzig → Halle → Magdeburg  
**Distanz gesamt:** 280km  
**Fahrzeit gesamt:** 3,5 Stunden  
**Stops:** 3 Abholungen, 3 Zustellungen

```
Distanz-Kosten:    280km × 0,70€    = 196,00€
Zeit-Kosten:       3,5h × 22,50€    = 78,75€
Startgebühr:                        = 6,00€
Extra-Stops:       5 × 6,00€        = 30,00€
                   (6 Stops - 1)
─────────────────────────────────────────────
Mindestpreis:                       = 310,75€
Empfohlener Preis: 310,75€ × 1.2   = 372,90€
```

## Wartezeit-Vergütung (Zusätzlich)

Wartezeiten werden **nach Abschluss** des Auftrags berechnet und müssen vom Admin freigegeben werden.

### Regelung

- **Erste 30 Minuten:** Kostenlos (Kulanzzeit)
- **Ab 31. Minute:** 3,00€ pro angefangene 5 Minuten

### Berechnung

```
Wartezeit-Vergütung = max(0, (Wartezeit - 30 Minuten)) ÷ 5 Minuten (aufgerundet) × 3,00€
```

### Beispiele

| Wartezeit | Berechnung | Vergütung |
|-----------|------------|-----------|
| 15 Min | Unter 30 Min | 0,00€ |
| 30 Min | Genau 30 Min | 0,00€ |
| 35 Min | (35-30) ÷ 5 = 1 Block | 3,00€ |
| 45 Min | (45-30) ÷ 5 = 3 Blöcke | 9,00€ |
| 60 Min | (60-30) ÷ 5 = 6 Blöcke | 18,00€ |
| 90 Min | (90-30) ÷ 5 = 12 Blöcke | 36,00€ |

### Wartezeit-Arten

1. **Wartezeit bei Abholung** (`pickup_waiting_minutes`)
2. **Wartezeit bei Zustellung** (`delivery_waiting_minutes`)

**Gesamt-Wartezeit-Vergütung** = Vergütung Abholung + Vergütung Zustellung

## Klärungszeit (Zusätzlich)

Zeit für Adresskorrekturen, Rückfragen, etc. kann vom Admin erfasst werden:

- **Klärungszeit** (`clarification_minutes`)
- Wird in Minuten erfasst
- Keine automatische Vergütung
- Admin kann manuell in Preis einrechnen

## Wichtige Regeln

### ✅ Mindestlohn-Einhaltung

- Der Preis **darf NICHT** unter dem berechneten Mindestpreis liegen
- System warnt bei zu niedrigem Preis
- Auftrag kann nicht erstellt werden, wenn Preis zu niedrig

### ✅ Automatische Berechnung

- System berechnet Distanz und Fahrzeit über Routing-API (OpenRouteService)
- Empfohlener Preis wird automatisch vorgeschlagen
- Kunde sieht vollständige Berechnung

### ✅ Preisanpassung

- Kunde kann Preis nach oben anpassen
- Kunde kann Preis **nicht** unter Mindestpreis setzen
- Admin kann Preis auch nach Abschluss anpassen

### ✅ Transparenz

Dem Kunden werden angezeigt:
- Distanz in km
- Fahrzeit in Stunden
- Anzahl Extra-Stops
- Vollständige Berechnungsformel
- Mindestpreis
- Empfohlener Preis

## Technische Umsetzung

### Backend (priceCalculator.js)

```javascript
const PRICE_PER_KM_SHORT = 0.50;  // Unter 100km
const PRICE_PER_KM_LONG = 0.70;   // Über 100km
const HOURLY_RATE = 22.50;        // Pro Stunde
const START_FEE = 6.00;           // Startgebühr
const EXTRA_STOP_FEE = 6.00;      // Pro Extra-Stop

function calculateMinimumPrice(distanceKm, durationMinutes, extraStopsCount = 0) {
  const pricePerKm = distanceKm > 100 ? PRICE_PER_KM_LONG : PRICE_PER_KM_SHORT;
  const distanceCost = distanceKm * pricePerKm;
  const durationHours = durationMinutes / 60;
  const timeCost = durationHours * HOURLY_RATE;
  const extraStopsCost = extraStopsCount * EXTRA_STOP_FEE;
  
  return distanceCost + timeCost + START_FEE + extraStopsCost;
}

function calculateRecommendedPrice(minimumPrice) {
  return minimumPrice * 1.2;
}
```

### Frontend (CreateOrderModal.jsx)

- Zeigt Live-Berechnung während Eingabe
- Warnt bei zu niedrigem Preis
- Zeigt Extra-Stops-Gebühr separat an
- Validiert Preis vor Absenden

### Datenbank

Relevante Spalten in `transport_orders`:

```sql
distance_km DECIMAL(10, 2)           -- Distanz in km
duration_minutes INTEGER             -- Fahrzeit in Minuten
price DECIMAL(10, 2)                 -- Kundenpreis
extra_stops_count INTEGER            -- Anzahl Extra-Stops
extra_stops_fee DECIMAL(10, 2)       -- Extra-Stops-Gebühr
pickup_waiting_minutes INTEGER       -- Wartezeit Abholung
delivery_waiting_minutes INTEGER     -- Wartezeit Zustellung
waiting_time_fee DECIMAL(10, 2)      -- Wartezeit-Vergütung
clarification_minutes INTEGER        -- Klärungszeit
```

## Preisanpassungen durch Admin

Admins können nach Auftragsabschluss anpassen:

1. **Preis** - Manuell korrigieren
2. **Wartezeiten** - Minuten und Vergütung
3. **Klärungszeit** - Zusätzliche Zeit erfassen
4. **Extra-Stops** - Zusätzliche Adressen hinzufügen

Alle Änderungen werden im `edit_history` protokolliert.

## Häufige Fragen (FAQ)

### Warum unterschiedliche km-Preise?

Längere Strecken haben höhere Kosten (Verschleiß, Risiko), daher 0,70€ statt 0,50€ ab 100km.

### Warum 20% Aufschlag?

Deckt Betriebskosten, Gewinn, Versicherung, Verwaltung, Risiko.

### Kann der Kunde den Preis verhandeln?

Nein, der Mindestpreis ist fix. Kunde kann nur nach oben anpassen.

### Was passiert bei Stau/Verzögerung?

Die ursprüngliche Fahrzeit bleibt. Wartezeiten können nachträglich erfasst werden.

### Wie werden Multi-Stops berechnet?

Alle Segmente werden summiert (Distanz + Zeit), plus 6€ pro zusätzlichem Stop.

## Beispiel-Szenarien

### Szenario 1: Möbellieferung mit Umweg

**Situation:** Kunde möchte Möbel von IKEA Berlin abholen, zu sich nach Potsdam bringen, dann noch zu seiner Mutter nach Brandenburg.

**Route:** IKEA Berlin → Potsdam → Brandenburg  
**Stops:** 1 Abholung, 2 Zustellungen = 1 Extra-Stop  
**Distanz:** 85km  
**Zeit:** 1,5h

```
Berechnung:
- 85km × 0,50€ = 42,50€
- 1,5h × 22,50€ = 33,75€
- Startgebühr = 6,00€
- 1 Extra-Stop = 6,00€
Mindestpreis: 88,25€
Empfohlen: 105,90€
```

### Szenario 2: Firmen-Sammelfahrt

**Situation:** Firma lässt Pakete von 5 verschiedenen Standorten abholen und zu einem Lager bringen.

**Route:** 5 Abholungen → 1 Zustellung = 4 Extra-Stops  
**Distanz:** 120km  
**Zeit:** 3h

```
Berechnung:
- 120km × 0,70€ = 84,00€
- 3h × 22,50€ = 67,50€
- Startgebühr = 6,00€
- 4 Extra-Stops = 24,00€
Mindestpreis: 181,50€
Empfohlen: 217,80€
```

## Zusammenfassung

Die ZipMend-Preiskalkulation ist:

✅ **Transparent** - Alle Komponenten werden angezeigt  
✅ **Fair** - Basiert auf Mindestlohn  
✅ **Flexibel** - Unterstützt Multi-Stop-Aufträge  
✅ **Automatisch** - Berechnung erfolgt automatisch  
✅ **Nachvollziehbar** - Vollständige Formel wird gezeigt  
✅ **Anpassbar** - Admin kann nachträglich korrigieren  

---

**Letzte Aktualisierung:** Oktober 2024  
**Version:** 2.0 (mit Multi-Stop-Support)
