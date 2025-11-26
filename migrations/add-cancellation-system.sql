-- Migration: Stornierungssystem
-- Datum: 26. November 2025
-- Beschreibung: Vollständiges Stornierungssystem mit AGB-Gebührenordnung

-- Neue Spalten für Stornierungen
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS cancellation_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS cancellation_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS hours_before_pickup DECIMAL(10,2),

-- Finanzielle Felder
ADD COLUMN IF NOT EXISTS contractor_penalty DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_cancellation_fee DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS contractor_compensation DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_budget DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjusted_contractor_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS platform_profit_from_cancellation DECIMAL(10,2) DEFAULT 0;

-- Kommentare
COMMENT ON COLUMN transport_orders.cancellation_status IS 'Status: cancelled_by_contractor, cancelled_by_customer, null';
COMMENT ON COLUMN transport_orders.cancelled_by IS 'Wer hat storniert: contractor, customer, admin';
COMMENT ON COLUMN transport_orders.hours_before_pickup IS 'Stunden vor Abholzeit bei Stornierung';
COMMENT ON COLUMN transport_orders.contractor_penalty IS 'Strafe für Auftragnehmer bei Stornierung';
COMMENT ON COLUMN transport_orders.customer_cancellation_fee IS 'Gebühr für Kunde bei Stornierung';
COMMENT ON COLUMN transport_orders.contractor_compensation IS 'Entschädigung für Auftragnehmer bei Kunden-Stornierung';
COMMENT ON COLUMN transport_orders.available_budget IS 'Verfügbares Budget für Neuvermittlung nach AN-Stornierung';
COMMENT ON COLUMN transport_orders.adjusted_contractor_price IS 'Angepasster Preis für neuen Auftragnehmer';
COMMENT ON COLUMN transport_orders.platform_profit_from_cancellation IS 'Plattform-Gewinn aus Stornierung';

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_transport_orders_cancellation_status ON transport_orders(cancellation_status);
CREATE INDEX IF NOT EXISTS idx_transport_orders_cancelled_by ON transport_orders(cancelled_by);

-- Verifizierung
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'transport_orders' 
  AND column_name LIKE '%cancel%'
ORDER BY column_name;
