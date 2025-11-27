# 🌟 Gespeicherte Routen - Feature Dokumentation

## Übersicht

Kunden können häufig genutzte Routen als Vorlagen speichern und bei zukünftigen Aufträgen wiederverwenden. Das spart Zeit beim Ausfüllen des Auftragsformulars.

## ✨ Features

### 1. Route als Vorlage speichern
- ✅ Beim Erstellen eines Auftrags kann die Route gespeichert werden
- ✅ Checkbox "Diese Route als Vorlage speichern"
- ✅ Eingabefeld für Vorlagenname (z.B. "Werk Berlin → Lager Hamburg")
- ✅ Automatisches Speichern nach erfolgreicher Auftragserstellung

### 2. Gespeicherte Routen anzeigen
- ✅ Button "Gespeicherte Routen" im Auftragsformular
- ✅ Übersichtliche Karten-Ansicht aller gespeicherten Routen
- ✅ Anzeige von:
  - Routenname mit Stern-Icon
  - Abholadresse und Zustelladresse
  - Nutzungsstatistik (wie oft verwendet)
  - Letztes Nutzungsdatum
  - Cargo-Details (falls gespeichert)

### 3. Route verwenden
- ✅ Ein Klick auf "Route verwenden"
- ✅ Alle Felder werden automatisch ausgefüllt:
  - Abholadresse, Stadt, PLZ, Land
  - Zustelladresse, Stadt, PLZ, Land
  - Kontaktdaten (falls gespeichert)
  - Cargo-Details (Beschreibung, Gewicht, Maße)
- ✅ Preis wird NEU berechnet (berücksichtigt aktuelle Verkehrslage)
- ✅ Nutzungszähler wird erhöht

### 4. Route löschen
- ✅ Papierkorb-Icon zum Löschen
- ✅ Bestätigungsdialog

## 🎯 Wichtig: Dynamische Preisberechnung

**Das System speichert KEINE Preise!**

Wenn eine gespeicherte Route verwendet wird:
1. ✅ Adressen werden ausgefüllt
2. ✅ System berechnet Route NEU
3. ✅ Preis wird basierend auf AKTUELLEN Faktoren berechnet:
   - Aktuelle Verkehrslage
   - Tageszeit (Stoßzeit vs. normale Zeit)
   - Entfernung und Dauer
   - Extra-Stops
   - Beladehilfe

**→ Preis kann sich bei jeder Nutzung ändern!**

## 📊 Datenbank-Schema

```sql
CREATE TABLE saved_routes (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  route_name VARCHAR(255) NOT NULL,
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_city VARCHAR(255) NOT NULL,
  pickup_postal_code VARCHAR(20) NOT NULL,
  pickup_country VARCHAR(100) DEFAULT 'Deutschland',
  pickup_company VARCHAR(255),
  pickup_contact_name VARCHAR(255),
  pickup_contact_phone VARCHAR(50),
  
  -- Delivery details
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(255) NOT NULL,
  delivery_postal_code VARCHAR(20) NOT NULL,
  delivery_country VARCHAR(100) DEFAULT 'Deutschland',
  delivery_company VARCHAR(255),
  delivery_contact_name VARCHAR(255),
  delivery_contact_phone VARCHAR(50),
  
  -- Cargo details (optional)
  cargo_description TEXT,
  cargo_weight DECIMAL(10,2),
  cargo_length DECIMAL(10,2),
  cargo_width DECIMAL(10,2),
  cargo_height DECIMAL(10,2),
  
  -- Metadata
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_customer_route_name UNIQUE(customer_id, route_name)
);
```

## 🔌 API Endpoints

### GET `/api/saved-routes`
Alle gespeicherten Routen des Kunden abrufen

**Response:**
```json
{
  "routes": [
    {
      "id": 1,
      "route_name": "Werk Berlin → Lager Hamburg",
      "pickup_address": "Hauptstraße 123",
      "pickup_city": "Berlin",
      "pickup_postal_code": "10115",
      "delivery_address": "Hafenstraße 456",
      "delivery_city": "Hamburg",
      "delivery_postal_code": "20095",
      "usage_count": 5,
      "last_used_at": "2025-11-27T10:30:00Z"
    }
  ]
}
```

### POST `/api/saved-routes`
Neue Route speichern

**Request Body:**
```json
{
  "route_name": "Werk Berlin → Lager Hamburg",
  "pickup_address": "Hauptstraße 123",
  "pickup_city": "Berlin",
  "pickup_postal_code": "10115",
  "pickup_country": "Deutschland",
  "delivery_address": "Hafenstraße 456",
  "delivery_city": "Hamburg",
  "delivery_postal_code": "20095",
  "delivery_country": "Deutschland",
  "cargo_description": "Europaletten",
  "cargo_weight": 100,
  "cargo_length": 120,
  "cargo_width": 80,
  "cargo_height": 15
}
```

### DELETE `/api/saved-routes/:id`
Route löschen

### POST `/api/saved-routes/:id/use`
Nutzungszähler erhöhen (wird automatisch aufgerufen)

## 💡 Use Cases

### Use Case 1: Regelmäßige Lieferungen
**Beispiel:** Ein Unternehmen liefert täglich von ihrem Werk in Berlin zu ihrem Lager in Hamburg.

**Vorher:**
- Jeden Tag alle Adressen neu eingeben
- 2-3 Minuten pro Auftrag

**Nachher:**
- Route "Werk → Lager" auswählen
- Nur Datum/Zeit anpassen
- 30 Sekunden pro Auftrag

**Zeitersparnis:** 80% weniger Eingabezeit!

### Use Case 2: Mehrere Standardrouten
**Beispiel:** Ein Händler hat 5 feste Lieferanten und 3 Lager.

**Gespeicherte Routen:**
1. "Lieferant A → Lager 1"
2. "Lieferant A → Lager 2"
3. "Lieferant B → Lager 1"
4. "Lager 1 → Kunde Stammkunde X"
5. "Lager 2 → Kunde Stammkunde Y"

**Vorteil:** Keine Tippfehler bei Adressen mehr!

### Use Case 3: Saisonale Routen
**Beispiel:** Weihnachtsgeschäft mit temporär erhöhtem Aufkommen.

**Gespeicherte Routen:**
- "Weihnachtslager → Filiale Nord"
- "Weihnachtslager → Filiale Süd"
- "Weihnachtslager → Filiale Ost"

**Nach der Saison:** Routen können gelöscht werden.

## 🎨 UI/UX

### Button-Platzierung
- **Position:** Header des Auftragsformulars
- **Farbe:** Gelb (Stern-Thema)
- **Icon:** Stern (Star)
- **Text:** "Gespeicherte Routen"

### Routen-Karten
- **Layout:** 2-spaltig auf Desktop, 1-spaltig auf Mobile
- **Sortierung:** Nach Nutzungshäufigkeit (meistgenutzte zuerst)
- **Hover-Effekt:** Schatten wird größer
- **Click-Effekt:** Sofortiges Ausfüllen des Formulars

### Speichern-Checkbox
- **Position:** Vor dem "Auftrag erstellen" Button
- **Standard:** Nicht aktiviert
- **Conditional:** Eingabefeld erscheint nur wenn aktiviert

## 🚀 Deployment

### Migration ausführen:
```bash
node run-saved-routes-migration.js
```

### Oder manuell:
```sql
-- Siehe server/migrations/008_create_saved_routes.js
```

## 📈 Metriken

Nach Implementierung können folgende Metriken getrackt werden:

1. **Nutzungsrate:** Wie viele Kunden nutzen das Feature?
2. **Zeitersparnis:** Durchschnittliche Zeit pro Auftragserstellung
3. **Beliebte Routen:** Welche Routen werden am häufigsten verwendet?
4. **Fehlerrate:** Weniger Fehler durch vorausgefüllte Adressen

## 🔮 Zukünftige Erweiterungen

### Phase 2 (Optional):
- ✨ Route bearbeiten (Update-Funktion)
- ✨ Route teilen (mit anderen Nutzern)
- ✨ Route-Kategorien (z.B. "Dringend", "Standard", "Rücklieferung")
- ✨ Automatische Route-Vorschläge basierend auf Historie
- ✨ Favoriten-Stern für Top-3-Routen

### Phase 3 (Optional):
- ✨ Route-Templates für Admins (für alle Kunden verfügbar)
- ✨ Saisonale Route-Sets (z.B. "Weihnachten 2025")
- ✨ Route-Import/Export (CSV)

## ✅ Testing

### Manueller Test:
1. Als Kunde einloggen
2. Neuen Auftrag erstellen
3. Checkbox "Route als Vorlage speichern" aktivieren
4. Vorlagenname eingeben: "Test Route"
5. Auftrag erstellen
6. Neuen Auftrag öffnen
7. Button "Gespeicherte Routen" klicken
8. "Test Route" sollte erscheinen
9. "Route verwenden" klicken
10. Alle Felder sollten ausgefüllt sein
11. Preis sollte NEU berechnet werden

### API-Test:
```bash
# Get all routes
curl -X GET http://localhost:8080/api/saved-routes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create route
curl -X POST http://localhost:8080/api/saved-routes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "route_name": "Test Route",
    "pickup_address": "Teststraße 1",
    "pickup_city": "Berlin",
    "pickup_postal_code": "10115",
    "delivery_address": "Zielstraße 2",
    "delivery_city": "Hamburg",
    "delivery_postal_code": "20095"
  }'

# Delete route
curl -X DELETE http://localhost:8080/api/saved-routes/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📝 Changelog

### v1.0.0 - 27.11.2025
- ✅ Initiales Release
- ✅ Route speichern beim Auftrag erstellen
- ✅ Gespeicherte Routen anzeigen
- ✅ Route verwenden (Auto-Fill)
- ✅ Route löschen
- ✅ Nutzungsstatistik

---

**Erstellt:** 27. November 2025  
**Status:** ✅ Deployed und Live  
**Nächste Schritte:** User-Feedback sammeln
