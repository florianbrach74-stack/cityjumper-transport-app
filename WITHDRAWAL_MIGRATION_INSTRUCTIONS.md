# Widerrufsbelehrung Migration - Anleitung

## Datenbank-Migration ausführen

Die Migration fügt drei neue Spalten zur `transport_orders` Tabelle hinzu, um die Zustimmung des Kunden zur sofortigen Ausführung zu speichern.

### Option 1: Über Railway Dashboard

1. Gehe zu Railway Dashboard
2. Öffne dein Projekt
3. Klicke auf die PostgreSQL Datenbank
4. Gehe zu "Data" Tab
5. Führe folgendes SQL aus:

```sql
ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS withdrawal_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawal_consent_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS withdrawal_consent_ip VARCHAR(45);

COMMENT ON COLUMN transport_orders.withdrawal_consent_given IS 'Customer agreed to immediate service execution and loss of withdrawal right';
COMMENT ON COLUMN transport_orders.withdrawal_consent_timestamp IS 'Timestamp when consent was given';
COMMENT ON COLUMN transport_orders.withdrawal_consent_ip IS 'IP address when consent was given';
```

### Option 2: Über Railway CLI

```bash
railway run node run_withdrawal_consent_migration.js
```

## Was wird hinzugefügt?

- **withdrawal_consent_given**: Boolean - Kunde hat zugestimmt
- **withdrawal_consent_timestamp**: Timestamp - Wann wurde zugestimmt
- **withdrawal_consent_ip**: String - IP-Adresse bei Zustimmung

## Nächste Schritte

Nach der Migration müssen Sie noch:

1. **CreateOrderModal erweitern** - Checkbox für Privatkunden hinzufügen
2. **Backend anpassen** - Consent-Daten speichern
3. **Auftragsbestätigung** - Consent-Status anzeigen

## Rechtliche Grundlage

- § 355 BGB - Widerrufsrecht
- § 356 Abs. 4 BGB - Erlöschen des Widerrufsrechts
- § 312g BGB - Fernabsatzverträge

Die Zustimmung muss **aktiv** (nicht vorausgewählt) erfolgen und dokumentiert werden.
