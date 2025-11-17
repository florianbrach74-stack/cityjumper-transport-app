# 🧾 Railway Migration: Invoice Counter System

## Schritt 1: SQL in Railway ausführen

1. **Railway Dashboard öffnen:**
   - https://railway.app
   - Ihr Projekt auswählen
   - PostgreSQL Service auswählen

2. **Query Tab öffnen:**
   - Klicken Sie auf "Query"
   - Oder verwenden Sie das SQL-Terminal

3. **SQL ausführen:**

```sql
-- Invoice Counter System Migration

-- 1. Create invoice counter table for sequential invoice numbers
CREATE TABLE IF NOT EXISTS invoice_counter (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year)
);

-- 2. Create function to PREVIEW next invoice number (without incrementing)
CREATE OR REPLACE FUNCTION preview_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get current counter without incrementing
  SELECT COALESCE(counter, 0) + 1 INTO next_counter
  FROM invoice_counter
  WHERE year = current_year;
  
  -- If no counter exists for this year, it will be 1
  IF next_counter IS NULL THEN
    next_counter := 1;
  END IF;
  
  -- Format: YYYY-NNNN (e.g., 2025-0001)
  invoice_number := current_year || '-' || LPAD(next_counter::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- 3. Create function to RESERVE next invoice number (actually increment)
CREATE OR REPLACE FUNCTION reserve_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Insert or update counter for current year (THIS INCREMENTS!)
  INSERT INTO invoice_counter (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET 
    counter = invoice_counter.counter + 1,
    updated_at = CURRENT_TIMESTAMP
  RETURNING counter INTO next_counter;
  
  -- Format: YYYY-NNNN (e.g., 2025-0001)
  invoice_number := current_year || '-' || LPAD(next_counter::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- 4. Create function to MANUALLY set counter (for external invoices)
CREATE OR REPLACE FUNCTION set_invoice_counter(invoice_year INTEGER, invoice_counter_value INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO invoice_counter (year, counter)
  VALUES (invoice_year, invoice_counter_value)
  ON CONFLICT (year)
  DO UPDATE SET 
    counter = GREATEST(invoice_counter.counter, invoice_counter_value),
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 5. Initialize counter for current year if not exists
INSERT INTO invoice_counter (year, counter)
VALUES (EXTRACT(YEAR FROM CURRENT_DATE), 0)
ON CONFLICT (year) DO NOTHING;
```

## Schritt 2: Testen

Nach der Migration können Sie testen:

```sql
-- Test 1: Preview (zeigt nächste Nummer, inkrementiert NICHT)
SELECT preview_next_invoice_number();
-- Ergebnis: 2025-0001

-- Test 2: Preview nochmal (sollte gleiche Nummer zeigen)
SELECT preview_next_invoice_number();
-- Ergebnis: 2025-0001 (immer noch!)

-- Test 3: Reserve (inkrementiert tatsächlich)
SELECT reserve_next_invoice_number();
-- Ergebnis: 2025-0001 (Counter wird auf 1 gesetzt)

-- Test 4: Preview (sollte jetzt nächste Nummer zeigen)
SELECT preview_next_invoice_number();
-- Ergebnis: 2025-0002

-- Test 5: Manuelle Rechnungsnummer registrieren
SELECT set_invoice_counter(2025, 5);
-- Counter wird auf 5 gesetzt

-- Test 6: Preview (sollte 2025-0006 zeigen)
SELECT preview_next_invoice_number();
-- Ergebnis: 2025-0006
```

## Schritt 3: Wie es funktioniert

### **VORSCHAU-Modus** (Rechnungsvorschau)
- Funktion: `preview_next_invoice_number()`
- Zeigt die nächste verfügbare Nummer
- Inkrementiert NICHT den Counter
- Kann beliebig oft aufgerufen werden
- Wird verwendet: Beim Öffnen der Rechnungsvorschau

### **RESERVE-Modus** (Email-Versand)
- Funktion: `reserve_next_invoice_number()`
- Gibt die nächste Nummer zurück UND inkrementiert
- Wird NUR beim tatsächlichen Email-Versand aufgerufen
- Garantiert fortlaufende Nummern

### **MANUELL-Modus** (Externe Rechnungen)
- Funktion: `set_invoice_counter(jahr, nummer)`
- Für manuell erstellte Rechnungen (z.B. außerhalb des Systems)
- Beispiel: `SELECT set_invoice_counter(2025, 10);`
- System fährt dann mit 2025-0011 fort

## Schritt 4: Beispiel-Workflow

1. **Kunde öffnet Rechnungsvorschau**
   - System ruft `preview_next_invoice_number()` auf
   - Zeigt: "Rechnungsnummer: 2025-0005"
   - Counter bleibt bei: 4

2. **Kunde schließt Vorschau ohne zu senden**
   - Nichts passiert
   - Counter bleibt bei: 4

3. **Kunde öffnet Vorschau erneut**
   - Zeigt wieder: "Rechnungsnummer: 2025-0005"
   - Counter bleibt bei: 4

4. **Kunde klickt "Rechnung senden"**
   - System ruft `reserve_next_invoice_number()` auf
   - Reserviert: 2025-0005
   - Counter wird auf: 5 gesetzt
   - Email wird mit PDF versendet

5. **Nächste Rechnung**
   - Vorschau zeigt: 2025-0006
   - Und so weiter...

## Schritt 5: Externe Rechnungen registrieren

Wenn Sie eine Rechnung MANUELL erstellt haben (z.B. in Word/Excel):

```sql
-- Sie haben manuell Rechnung 2025-0015 erstellt
SELECT set_invoice_counter(2025, 15);

-- System fährt jetzt mit 2025-0016 fort
SELECT preview_next_invoice_number();
-- Ergebnis: 2025-0016
```

## ✅ Fertig!

Nach dieser Migration können Sie:
- ✅ Rechnungen in der Vorschau sehen (ohne Nummer zu vergeben)
- ✅ Rechnungen per Email versenden (mit fortlaufender Nummer)
- ✅ Externe Rechnungen registrieren
- ✅ Finanzamt-konforme fortlaufende Rechnungsnummern

## 🚨 Wichtig

- Die Migration muss NUR EINMAL ausgeführt werden
- Danach läuft alles automatisch
- Rechnungsnummern sind IMMER fortlaufend
- Format: YYYY-NNNN (z.B. 2025-0001, 2025-0002, etc.)
