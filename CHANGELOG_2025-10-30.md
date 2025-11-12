# 📋 Changelog - 30. Oktober 2025

## 🎯 Hauptziele der Session
1. Multi-Stop-Funktionalität mit unbegrenzten Stops
2. Beiladungs-System für Aufträge unter Mindestpreis
3. Zeitfenster statt fixer Zeiten
4. Preiskalkulation korrigiert (Startgebühr hinzugefügt)
5. Preis-Erhöhung für wartende Aufträge
6. 15% Plattform-Provision automatisch berechnet
7. Getrennte Preis-Sichtbarkeit für Kunden/Auftragnehmer/Admin

---

## ✅ Implementierte Features

### 1. Multi-Stop-Funktionalität
**Dateien:** `MultiStopManager.jsx`, `CreateOrderModal.jsx`, `add_multi_stop_features.sql`

- ✅ Unbegrenzte Anzahl von Abholungen und Zustellungen
- ✅ Automatische Preisberechnung: +6€ pro Extra-Stop
- ✅ UI zeigt "Sie können beliebig viele Stops hinzufügen"
- ✅ Form bleibt offen nach Hinzufügen eines Stops
- ✅ "Fertig"-Button wenn Stops vorhanden

**Datenbank:**
```sql
- pickup_stops JSONB
- delivery_stops JSONB
- extra_stops_count INTEGER
- extra_stops_fee DECIMAL(10, 2)
```

---

### 2. Beiladungs-System
**Dateien:** `CreateOrderModal.jsx`, `add_partial_load_support.sql`

- ✅ Aufträge unter Mindestpreis können als Beiladung erstellt werden
- ✅ Bestätigungsdialog mit zwei Optionen:
  - Preis auf Mindestpreis erhöhen
  - Als Beiladung fortfahren (flexible 7-Tage-Zustellung)
- ✅ Klarstellung: "Wir vermitteln nur, keine Garantie"
- ✅ Kunde kann Preis jederzeit erhöhen

**Datenbank:**
```sql
- is_partial_load BOOLEAN
- partial_load_deadline DATE (automatisch +7 Tage)
- minimum_price_at_creation DECIMAL(10, 2)
```

---

### 3. Zeitfenster statt fixer Zeiten
**Dateien:** `CreateOrderModal.jsx`, `add_time_windows.sql`

- ✅ Abholung: Von/Bis (z.B. 11:00-13:00)
- ✅ Zustellung: Von/Bis (z.B. 14:00-16:00)
- ✅ Optional: Leer lassen für feste Zeit
- ✅ Bestehende Daten automatisch migriert

**Datenbank:**
```sql
- pickup_time_from TIME
- pickup_time_to TIME
- delivery_time_from TIME
- delivery_time_to TIME
```

---

### 4. Preiskalkulation korrigiert
**Dateien:** `CreateOrderModal.jsx`, `PRICING_DOCUMENTATION.md`

**Vorher (FALSCH):**
```
Distanz + Zeit = Mindestpreis
```

**Nachher (KORREKT):**
```
Distanz + Zeit + 6€ Startgebühr + Extra-Stops = Mindestpreis
Empfohlen = Mindestpreis × 1.2
```

**Vollständige Formel:**
- Distanz: 0,50€/km (unter 100km) oder 0,70€/km (über 100km)
- Zeit: 22,50€/h (korrigiert von 18€/h)
- Startgebühr: 6,00€
- Extra-Stops: 6,00€ pro Stop
- Empfohlener Preis: +20% Aufschlag

**Beispiel:**
```
10km × 0,50€ = 5,00€
21min = 0,35h × 22,50€ = 7,88€
Startgebühr = 6,00€
Extra-Stops = 0 × 6€ = 0,00€
─────────────────────────
Mindestpreis: 18,88€
Empfohlen: 22,66€
```

---

### 5. Preis-Erhöhung für Kunden
**Dateien:** `UpdatePriceModal.jsx`, `CustomerDashboard.jsx`, `server/routes/orders.js`

- ✅ "Preis erhöhen"-Button bei ausstehenden Aufträgen
- ✅ Modal mit Live-Berechnung der Erhöhung
- ✅ Nur Erhöhung möglich, keine Senkung
- ✅ Backend berechnet automatisch contractor_price (85%)
- ✅ `price_updated_at` Timestamp wird gesetzt

**Workflow:**
1. Kunde klickt "Preis erhöhen"
2. Modal zeigt aktuellen Preis und Mindestpreis
3. Kunde gibt neuen Preis ein
4. Backend aktualisiert:
   - `price` (Kundenpreis)
   - `contractor_price` (85% vom Kundenpreis)
   - `price_updated_at` (NOW())

---

### 6. Contractor-Pricing mit 15% Provision
**Dateien:** `add_contractor_pricing.sql`, `Order.js`, `ContractorOrdersView.jsx`, `AdminDashboard.jsx`

**Preisstruktur:**
- Kundenpreis: 100% (was der Kunde zahlt)
- Auftragnehmer-Preis: 85% (was der Auftragnehmer erhält)
- Plattform-Provision: 15%

**Beispiel:**
```
Kunde zahlt: €100,00
Auftragnehmer erhält: €85,00
Plattform-Provision: €15,00
```

**Datenbank:**
```sql
- contractor_price DECIMAL(10, 2) (automatisch berechnet)
- price_updated_at TIMESTAMP
```

**Auftragnehmer-Ansicht:**
- Zeigt contractor_price (85%)
- "⬆️ NEUER PREIS!"-Badge wenn innerhalb 24h aktualisiert
- Animiert (pulse-Effekt)

**Admin-Ansicht:**
- 👤 Kundenpreis: €100,00
- 🚚 Auftragnehmer-Preis: €85,00
- 💰 Provision: €15,00

---

### 7. Getrennte Preis-Sichtbarkeit
**Dateien:** `CustomerDashboard.jsx`, `ContractorOrdersView.jsx`, `AdminDashboard.jsx`

**Kunden sehen:**
- ✅ Nur ihren Preis (100%)
- ❌ NICHT: Auftragnehmer-Preis oder Provision

**Auftragnehmer sehen:**
- ✅ Nur ihren Preis (85%)
- ✅ "NEUER PREIS!"-Badge (24h nach Update)
- ❌ NICHT: Kundenpreis oder Provision

**Admin sieht:**
- ✅ Kundenpreis (100%)
- ✅ Auftragnehmer-Preis (85%)
- ✅ Provision (15%)
- ✅ Alle Details

---

### 8. Wartezeit-Gebühren für Kunden
**Dateien:** `CustomerDashboard.jsx`

- ✅ Kunden sehen Wartezeit-Details bei abgeschlossenen Aufträgen
- ✅ Aufschlüsselung: Abholung + Zustellung
- ✅ Begründung vom Auftragnehmer
- ✅ Berechnete Zusatzkosten
- ✅ Erklärung: "Erste 30 Min. kostenlos, danach €3 pro 5 Min."

**Anzeige:**
```
⏱️ Wartezeit-Vergütung
─────────────────────
Abholung: 15 Min.
Zustellung: 30 Min.

Begründung Abholung:
"Kunde war nicht vor Ort..."

Zusätzliche Kosten: +€9.00
(Erste 30 Min. kostenlos, danach €3 pro 5 Min.)
```

---

### 9. pending_approval für Kunden als "Abgeschlossen"
**Dateien:** `CustomerDashboard.jsx`, `cmrController.js`

**Problem:**
- Aufträge mit Wartezeit blieben bei "Aktiv" bis Admin freigab
- Kunde konnte CMR nicht sehen

**Lösung:**
- Status bleibt `pending_approval` im Backend (für Admin/Auftragnehmer)
- Kunden-Ansicht behandelt `pending_approval` als "Abgeschlossen"
- Kunde kann CMR sofort ansehen
- Wartezeit-Details werden angezeigt (auch vor Freigabe)

---

### 10. Email-Disclaimer
**Dateien:** `server/utils/emailService.js`

**In ALLEN Emails:**
```
⚠️ Wichtiger Hinweis: Courierly ist eine Vermittlungsplattform.
Wir garantieren keine Auftragsübernahme.
Tipp: Höhere Preise erhöhen die Wahrscheinlichkeit einer schnellen Übernahme.
```

**Betrifft:**
- Neue Aufträge (an Auftragnehmer)
- Auftragszuweisung (an Auftragnehmer)
- Alle zukünftigen Email-Templates

---

## 🐛 Behobene Fehler

### 1. TypeError: price.toFixed is not a function
**Dateien:** `CustomerDashboard.jsx`, `UpdatePriceModal.jsx`

**Problem:** `price` und `waiting_time_fee` kamen als String statt Number

**Lösung:**
```javascript
parseFloat(order.price)
parseFloat(order.waiting_time_fee)
```

---

### 2. Cannot read properties of undefined (reading 'query')
**Dateien:** `server/routes/orders.js`

**Problem:** `req.app.locals.pool` ist undefined in Vercel Serverless Functions

**Lösung:**
```javascript
const pool = require('../config/database');
// Statt: req.app.locals.pool.query()
// Jetzt: pool.query()
```

---

### 3. Falscher Counter "Aktive Aufträge (2)"
**Dateien:** `CustomerDashboard.jsx`

**Problem:** `pending_approval` wurde zu "Aktiv" gezählt

**Lösung:**
```javascript
// Vorher:
orders.filter(o => o.status !== 'completed')

// Nachher:
orders.filter(o => o.status !== 'completed' && o.status !== 'pending_approval')
```

---

### 4. Railway Build hängt bei "exporting to docker"
**Dateien:** `.railwayignore`, `railway.json`

**Problem:** Railway installierte alle Dependencies (inkl. Client)

**Lösung:**
- `.railwayignore` erstellt (ignoriert `client/` Ordner)
- `railway.json` mit NIXPACKS-Config
- Build-Zeit: von 8+ Min auf 2-3 Min reduziert

---

## 📊 Datenbank-Änderungen

### Neue Spalten in `transport_orders`:

```sql
-- Multi-Stop
pickup_stops JSONB DEFAULT '[]'
delivery_stops JSONB DEFAULT '[]'
extra_stops_count INTEGER DEFAULT 0
extra_stops_fee DECIMAL(10, 2) DEFAULT 0

-- Beiladung
is_partial_load BOOLEAN DEFAULT false
partial_load_deadline DATE
minimum_price_at_creation DECIMAL(10, 2)

-- Zeitfenster
pickup_time_from TIME
pickup_time_to TIME
delivery_time_from TIME
delivery_time_to TIME

-- Contractor-Pricing
contractor_price DECIMAL(10, 2)
price_updated_at TIMESTAMP
```

### Ausgeführte Migrationen:
1. `add_multi_stop_features.sql`
2. `add_partial_load_support.sql`
3. `add_time_windows.sql`
4. `add_contractor_pricing.sql`

---

## 🚀 Performance-Optimierungen

### Railway Build
**Vorher:**
- Build-Zeit: 8-15 Minuten
- Installierte alle Dependencies (Server + Client)
- Docker-Export hing oft

**Nachher:**
- Build-Zeit: 2-3 Minuten
- Nur Server-Dependencies (`--production`)
- `.railwayignore` ignoriert Client-Ordner
- `railway.json` mit NIXPACKS-Config

---

## 📝 Neue Dokumentation

### PRICING_DOCUMENTATION.md
Vollständige Preiskalkulation mit:
- Alle Komponenten erklärt
- Berechnungsbeispiele
- Wartezeit-Vergütung
- FAQ
- Technische Umsetzung

---

## 🔄 Workflow-Änderungen

### Auftragserstellung mit Beiladung:
1. Kunde gibt Preis unter Mindestpreis ein
2. Dialog erscheint mit zwei Optionen
3. Kunde wählt:
   - **Option A**: Preis erhöhen → Direktfahrt
   - **Option B**: Beiladung → Flexible 7-Tage-Zustellung
4. Auftrag wird erstellt mit entsprechendem Flag

### Preis-Erhöhung:
1. Kunde sieht "Preis erhöhen"-Button bei ausstehenden Aufträgen
2. Modal öffnet sich mit aktuellem Preis
3. Kunde gibt neuen Preis ein (nur höher)
4. Backend berechnet automatisch:
   - Neuer Kundenpreis
   - Neuer Auftragnehmer-Preis (85%)
   - `price_updated_at` Timestamp
5. Auftragnehmer sehen "⬆️ NEUER PREIS!"-Badge (24h)

### Wartezeit-Abrechnung:
1. Auftragnehmer liefert aus und erfasst Wartezeit
2. Status wird auf `pending_approval` gesetzt
3. **Kunde** sieht Auftrag bei "Abgeschlossen"
4. **Kunde** kann CMR ansehen
5. **Kunde** sieht Wartezeit-Details (noch nicht freigegeben)
6. **Admin** gibt Wartezeit frei
7. Status wird auf `completed` gesetzt
8. Wartezeit-Gebühr wird berechnet

---

## 🎨 UI/UX-Verbesserungen

### Multi-Stop-Manager:
- Klare Anzeige: "Sie können beliebig viele Stops hinzufügen (je +6€)"
- Form bleibt offen nach Hinzufügen
- "Fertig"-Button wenn Stops vorhanden
- Farbcodierung: Grün (Abholung), Blau (Zustellung)

### Beiladungs-Dialog:
- Gelbe Warnbox mit klarer Botschaft
- Zwei große Buttons (Grün/Orange)
- Vollständige Erklärung der Optionen
- Keine Garantie-Versprechen

### Preis-Erhöhung:
- Grüner "Preis erhöhen"-Link unter Preis
- Modal mit Live-Berechnung
- Zeigt Erhöhung in € und %
- Hilfreiche Tipps

### Wartezeit-Anzeige:
- Gelbe Info-Box
- Grid-Layout für Abholung/Zustellung
- Begründungen in weißer Box
- Grüne Box für Gesamtkosten

---

## 🔐 Sicherheit & Validierung

### Preis-Update:
- ✅ Nur Kunde kann eigenen Preis ändern
- ✅ Nur bei ausstehenden Aufträgen
- ✅ Preis muss höher sein als aktuell
- ✅ Mindestpreis-Warnung (optional)

### Contractor-Pricing:
- ✅ Automatische Berechnung (85%)
- ✅ Kunden sehen nie Auftragnehmer-Preis
- ✅ Auftragnehmer sehen nie Kundenpreis
- ✅ Nur Admin sieht alle Preise

---

## 📱 Deployment

### Frontend (Vercel):
- Automatisches Deployment bei Git Push
- URL: `https://courierly-transport-app.vercel.app`
- Build-Zeit: 1-2 Minuten

### Backend (Railway):
- Automatisches Deployment bei Git Push
- URL: `https://courierly-api-production-01e4.up.railway.app`
- Build-Zeit: 2-3 Minuten (optimiert)
- NIXPACKS Builder

---

## 🎯 Nächste Schritte (Optional)

### Empfohlene Verbesserungen:
1. **Email-Benachrichtigung** bei Preis-Erhöhung an Auftragnehmer
2. **Push-Notifications** für "Neuer Preis"-Updates
3. **Analytics** für Beiladungs-Konversionsrate
4. **Automatische Preis-Vorschläge** basierend auf Marktdaten
5. **Bulk-Preis-Updates** für Admin

---

## 📞 Support & Kontakt

Bei Fragen oder Problemen:
- GitHub Issues: `https://github.com/florianbrach74-stack/courierly-transport-app`
- Dokumentation: Siehe `PRICING_DOCUMENTATION.md`

---

**Letzte Aktualisierung:** 30. Oktober 2025, 13:15 Uhr
**Version:** 2.1.0
**Status:** ✅ Alle Features deployed und funktionsfähig
