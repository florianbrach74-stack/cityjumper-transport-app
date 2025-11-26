# 🔄 Datenbank-Migration: Retouren-System

## ⚠️ WICHTIG: Migration ausführen!

Die neuen Features (Stornierte Aufträge + Retouren-System) benötigen neue Datenbank-Spalten.
**Bitte führe die Migration in Railway aus, bevor du die Features nutzt!**

---

## 📋 Schritt-für-Schritt Anleitung

### 1. Railway Dashboard öffnen
1. Gehe zu https://railway.app
2. Öffne dein Projekt
3. Klicke auf den **PostgreSQL Service**

### 2. Query Tab öffnen
1. Klicke auf **"Query"** oder **"Data"**
2. Du siehst jetzt ein SQL-Eingabefeld

### 3. Migration ausführen

Kopiere das folgende SQL und füge es in das Query-Feld ein:

```sql
-- Migration: Retouren-System
-- Datum: 26. November 2025

-- Neue Spalten für Retouren
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none' 
  CHECK (return_status IN ('none', 'pending', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS return_reason TEXT,
ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_initiated_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Kommentare für Dokumentation
COMMENT ON COLUMN transport_orders.return_status IS 'Status der Retoure: none, pending, in_progress, completed';
COMMENT ON COLUMN transport_orders.return_fee IS 'Retourengebühr (max. Auftragswert)';
COMMENT ON COLUMN transport_orders.return_reason IS 'Grund für die Retoure (z.B. Empfänger nicht angetroffen)';
COMMENT ON COLUMN transport_orders.return_initiated_by IS 'Admin der die Retoure gestartet hat';
COMMENT ON COLUMN transport_orders.return_notes IS 'Zusätzliche Notizen zur Retoure';
COMMENT ON COLUMN transport_orders.return_initiated_at IS 'Zeitpunkt der Retouren-Initiierung';
COMMENT ON COLUMN transport_orders.return_completed_at IS 'Zeitpunkt der Retouren-Abschluss';

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_orders_return_status ON transport_orders(return_status);
```

### 4. Migration ausführen
1. Klicke auf **"Run"** oder **"Execute"**
2. Warte bis die Ausführung abgeschlossen ist
3. Du solltest eine Erfolgsmeldung sehen

### 5. Verifizierung

Führe diese Query aus, um zu prüfen, ob die Migration erfolgreich war:

```sql
-- Verifizierung
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transport_orders' 
  AND column_name LIKE 'return_%'
ORDER BY column_name;
```

**Erwartetes Ergebnis:** Du solltest 7 Spalten sehen:
- `return_completed_at`
- `return_fee`
- `return_initiated_at`
- `return_initiated_by`
- `return_notes`
- `return_reason`
- `return_status`

---

## ✅ Nach der Migration

### Was jetzt funktioniert:

#### 1. **Stornierte Aufträge in Abrechnung** ✨
- Stornierte Aufträge erscheinen automatisch unter "Abgeschlossene Aufträge"
- Stornierungsgebühren werden in der Abrechnung angezeigt
- Kunden sehen die Stornierungsgebühr in ihrem Dashboard

#### 2. **Retouren-System** 🔄
- **Admin kann Retouren starten:**
  - Button "🔄 Retoure starten" bei Aufträgen mit Status "delivered" oder "in_transit"
  - Grund auswählen (z.B. "Empfänger nicht angetroffen")
  - Retourengebühr festlegen (max. Auftragswert)
  - Notizen hinzufügen

- **Automatische Abrechnung:**
  - Retourengebühr wird wie Wartezeit behandelt
  - Wird automatisch zur Kundenrechnung hinzugefügt
  - Fahrer erhält die Retourengebühr

- **Anzeige im Dashboard:**
  - Kunden sehen Retourengebühr mit Grund
  - Status wird angezeigt (⏳ läuft / ✓ abgeschlossen)

---

## 🧪 Testen

### Test 1: Stornierte Aufträge
1. Logge dich als Kunde ein
2. Gehe zu "Abgeschlossene Aufträge"
3. Stornierte Aufträge sollten sichtbar sein
4. Stornierungsgebühr sollte angezeigt werden

### Test 2: Retoure starten
1. Logge dich als Admin ein
2. Finde einen Auftrag mit Status "delivered" oder "in_transit"
3. Klicke auf "🔄 Retoure starten"
4. Wähle einen Grund und setze eine Gebühr
5. Speichern
6. Prüfe, ob die Retourengebühr in der Abrechnung erscheint

### Test 3: Abrechnung
1. Gehe zu "Abrechnungen"
2. Prüfe, ob stornierte Aufträge angezeigt werden
3. Prüfe, ob Retourengebühren in der Summe enthalten sind

---

## 📊 Neue Metriken in Reports

Die Abrechnungen zeigen jetzt:
- **Stornierte Aufträge:** Anzahl der stornierten Aufträge
- **Retouren:** Anzahl der Retouren
- **Stornierungsgebühren:** Summe aller Stornierungsgebühren
- **Retourengebühren:** Summe aller Retourengebühren

---

## 🚨 Troubleshooting

### Problem: Migration schlägt fehl
**Lösung:** 
- Prüfe, ob die Spalten bereits existieren
- Führe die Verifizierungs-Query aus
- Wenn Spalten existieren, ist alles OK

### Problem: "Retoure starten" Button erscheint nicht
**Lösung:**
- Prüfe, ob der Auftrag Status "delivered" oder "in_transit" hat
- Prüfe, ob bereits eine Retoure gestartet wurde
- Lade die Seite neu (Strg+Shift+R)

### Problem: Retourengebühr erscheint nicht in Abrechnung
**Lösung:**
- Prüfe, ob die Migration erfolgreich war
- Prüfe, ob `return_fee` > 0 ist
- Lade die Abrechnungsseite neu

---

## 📝 Notizen

- Die Migration ist **idempotent** (kann mehrfach ausgeführt werden ohne Fehler)
- Alle neuen Spalten haben Standardwerte, bestehende Daten bleiben unverändert
- Die Migration dauert nur wenige Sekunden

---

**Status:** ✅ Migration bereit
**Datum:** 26. November 2025
**Version:** 2.0 - Stornierungen & Retouren
