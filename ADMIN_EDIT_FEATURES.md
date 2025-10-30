# Admin-Bearbeitungsfunktionen & Multi-Stop-Aufträge

## Übersicht

Diese Erweiterung ermöglicht es Administratoren, Aufträge auch nach Abschluss zu bearbeiten und während der Ausführung zusätzliche Details anzupassen. Zusätzlich können Kunden jetzt Multi-Stop-Aufträge mit mehreren Abhol- und Zustelladressen erstellen.

## Neue Funktionen

### 1. Bearbeitung abgeschlossener Aufträge

Administratoren können jetzt folgende Felder auch nach Abschluss eines Auftrags anpassen:

- **Preis**: Anpassung des Kundenpreises
- **Wartezeit-Vergütung**: Manuelle Anpassung der Wartezeit-Gebühr
- **Wartezeiten**: 
  - Wartezeit bei Abholung (Minuten + Begründung)
  - Wartezeit bei Zustellung (Minuten + Begründung)
- **Klärungszeit**: Zeit für Adresskorrekturen oder Rückfragen

### 2. Zusätzliche Adressen

Während der Auftragsausführung können zusätzliche Adressen hinzugefügt werden:

- **Typ**: Abholung oder Zustellung
- **Vollständige Adressdaten**: Straße, Stadt, PLZ, Land
- **Kontaktinformationen**: Name und Telefon
- **Notizen**: Grund für die zusätzliche Adresse

**Anwendungsfall**: Kunde irrt sich bei der Zustelladresse oder es wird eine zusätzliche Abholung/Zustellung benötigt.

### 3. Multi-Stop-Aufträge bei Erstellung

Kunden können jetzt bei der Auftragserfassung mehrere Abhol- und Zustelladressen angeben:

- **Mehrere Abholungen**: Beliebig viele Abholadressen
- **Mehrere Zustellungen**: Beliebig viele Zustelladressen
- **Automatische Preisberechnung**: 
  - Distanz und Fahrzeit werden für alle Segmente summiert
  - **+6€ pro zusätzlichem Stop** (z.B. Berlin → Leipzig → München = 1 Extra-Stop = +6€)
- **Route-Optimierung**: Alle Stops werden in der Reihenfolge abgefahren

**Beispiel**: 
- Berlin → Leipzig → München
- Berechnung: (Distanz Berlin-Leipzig + Distanz Leipzig-München) + (Zeit Berlin-Leipzig + Zeit Leipzig-München) + 6€ Extra-Stop-Gebühr

### 4. Bearbeitungsverlauf

Alle Admin-Änderungen werden protokolliert:

- Zeitstempel der Änderung
- Admin-ID
- Geänderte Felder mit alten und neuen Werten

## Datenbankschema

### Neue Spalten in `transport_orders`

```sql
-- Zusätzliche Stops (admin-added während Ausführung)
additional_stops JSONB DEFAULT '[]'::jsonb

-- Initiale Multi-Stops (bei Auftragserfassung)
pickup_stops JSONB DEFAULT '[]'::jsonb
delivery_stops JSONB DEFAULT '[]'::jsonb

-- Extra-Stops-Gebühr
extra_stops_count INTEGER DEFAULT 0
extra_stops_fee DECIMAL(10, 2) DEFAULT 0

-- Klärungszeit
clarification_minutes INTEGER DEFAULT 0
clarification_notes TEXT

-- Bearbeitungsverfolgung
last_edited_by INTEGER REFERENCES users(id)
last_edited_at TIMESTAMP
edit_history JSONB DEFAULT '[]'::jsonb
```

### Struktur eines Additional Stop

```json
{
  "id": 1234567890,
  "address": "Musterstraße 123",
  "city": "Berlin",
  "postal_code": "10115",
  "country": "Deutschland",
  "contact_name": "Max Mustermann",
  "contact_phone": "+49 123 456789",
  "notes": "Zusätzliche Abholung wegen Kundenanfrage",
  "stop_type": "pickup",
  "added_at": "2024-01-15T10:30:00.000Z",
  "added_by": 1
}
```

### Struktur eines Edit History Eintrags

```json
{
  "timestamp": "2024-01-15T14:30:00.000Z",
  "admin_id": 1,
  "changes": {
    "price": {
      "old": 150.00,
      "new": 175.00
    },
    "clarification_minutes": {
      "old": 0,
      "new": 30
    }
  }
}
```

## API-Endpunkte

### PATCH `/admin/orders/:id/completed-order-edit`

Bearbeitet einen abgeschlossenen Auftrag.

**Request Body:**
```json
{
  "price": 175.00,
  "pickup_waiting_minutes": 15,
  "delivery_waiting_minutes": 20,
  "pickup_waiting_notes": "Verzögerung beim Beladen",
  "delivery_waiting_notes": "Empfänger nicht anwesend",
  "clarification_minutes": 30,
  "clarification_notes": "Adresskorrektur mit Kunde geklärt",
  "waiting_time_fee": 35.00
}
```

### POST `/admin/orders/:id/additional-stop`

Fügt eine zusätzliche Adresse hinzu.

**Request Body:**
```json
{
  "address": "Neue Straße 456",
  "city": "München",
  "postal_code": "80331",
  "country": "Deutschland",
  "contact_name": "Anna Schmidt",
  "contact_phone": "+49 89 123456",
  "notes": "Zusätzliche Zustellung nach Kundenanfrage",
  "stop_type": "delivery"
}
```

### DELETE `/admin/orders/:id/additional-stop/:stopId`

Entfernt eine zusätzliche Adresse.

## UI-Komponenten

### AdminOrderEditModal

Hauptkomponente für die Auftragsbearbeitung mit folgenden Bereichen:

1. **Preis & Vergütung** (blau)
   - Preis
   - Wartezeit-Vergütung

2. **Wartezeiten** (orange)
   - Abholung: Minuten + Begründung
   - Zustellung: Minuten + Begründung

3. **Klärungszeit** (lila)
   - Minuten
   - Notizen

4. **Zusätzliche Adressen** (grün)
   - Liste vorhandener Stops
   - Formular zum Hinzufügen neuer Stops

5. **Bearbeitungsverlauf**
   - Chronologische Auflistung aller Änderungen

## Installation

1. **Datenbank-Migration anwenden:**

```bash
# Automatisch mit Skript
./apply_admin_edit_migration.sh

# Oder manuell
psql -U postgres -d zipmend -f server/migrations/add_additional_stops.sql
```

2. **Server neu starten:**

```bash
cd server
npm start
```

3. **Client neu starten:**

```bash
cd client
npm start
```

## Verwendung

1. Im Admin-Dashboard zum Tab "Aufträge" navigieren
2. Bei jedem Auftrag auf "✏️ Bearbeiten" klicken
3. Gewünschte Änderungen vornehmen
4. "Änderungen speichern" klicken

### Zusätzliche Adresse hinzufügen

1. Im Bearbeitungsmodal nach unten scrollen zu "Zusätzliche Adressen"
2. "+ Adresse hinzufügen" klicken
3. Formular ausfüllen
4. "Adresse hinzufügen" klicken

## Sicherheit

- Alle Endpunkte sind durch `adminAuth` Middleware geschützt
- Nur Benutzer mit Rolle "admin" können Aufträge bearbeiten
- Alle Änderungen werden mit Admin-ID und Zeitstempel protokolliert
- Edit History ist unveränderlich (append-only)

## Beispiel-Workflow

### Szenario: Kunde gibt falsche Adresse an

1. Auftrag ist bereits "in_transit"
2. Kunde ruft an und korrigiert die Zustelladresse
3. Admin öffnet Bearbeitungsmodal
4. Admin fügt neue Zustelladresse als "Additional Stop" hinzu
5. Admin trägt Klärungszeit ein (z.B. 15 Minuten für Telefonat)
6. Admin speichert Änderungen
7. Auftragnehmer sieht die aktualisierte Adresse
8. Nach Abschluss kann Admin ggf. Preis anpassen

## Technische Details

### Datenbanktypen

- **JSONB**: Verwendet für `additional_stops` und `edit_history` für flexible Datenstrukturen
- **INTEGER**: Für Zeitangaben in Minuten
- **TEXT**: Für Notizen und Begründungen
- **TIMESTAMP**: Für Zeitstempel

### Performance

- JSONB-Spalten sind indexierbar bei Bedarf
- Edit History wird nur bei Änderungen erweitert
- Keine Performance-Auswirkungen auf normale Auftragsabfragen

## Zukünftige Erweiterungen

Mögliche zukünftige Features:

- [ ] Benachrichtigung an Auftragnehmer bei Änderungen
- [ ] Automatische Preisanpassung bei zusätzlichen Stops
- [ ] Export des Bearbeitungsverlaufs
- [ ] Rollback-Funktion für Änderungen
- [ ] Genehmigungsworkflow für größere Änderungen
