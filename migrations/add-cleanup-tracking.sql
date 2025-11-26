-- Migration: Cleanup-Tracking
-- Datum: 26. November 2025
-- Beschreibung: Fügt Spalten hinzu um bereinigte Aufträge zu tracken

-- Neue Spalten für Cleanup-Tracking
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS cleaned_up BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cleaned_up_at TIMESTAMP;

-- Kommentare
COMMENT ON COLUMN transport_orders.cleaned_up IS 'Wurde dieser Auftrag bereinigt (CMR/sensible Daten gelöscht)?';
COMMENT ON COLUMN transport_orders.cleaned_up_at IS 'Zeitpunkt der Bereinigung';

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_orders_cleaned_up ON transport_orders(cleaned_up, completed_at);

-- Verifizierung
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transport_orders' 
  AND column_name LIKE 'cleaned_%'
ORDER BY column_name;
