-- Migration: Retouren-System
-- Datum: 26. November 2025
-- Beschreibung: Fügt Spalten für das Retouren-System hinzu

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

-- Verifizierung
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transport_orders' 
  AND column_name LIKE 'return_%'
ORDER BY column_name;
