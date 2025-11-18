-- Migration: Add loading help and legal delivery fields to transport_orders table
-- Date: 2025-11-18

-- Add columns for loading/unloading help
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS needs_loading_help BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_unloading_help BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS loading_help_fee DECIMAL(10, 2) DEFAULT 0.00;

-- Add column for legal delivery
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS legal_delivery BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN transport_orders.needs_loading_help IS 'Customer needs help loading the vehicle at pickup (+€6)';
COMMENT ON COLUMN transport_orders.needs_unloading_help IS 'Customer needs help unloading the vehicle at delivery (+€6)';
COMMENT ON COLUMN transport_orders.loading_help_fee IS 'Total fee for loading/unloading help (€6 per service)';
COMMENT ON COLUMN transport_orders.legal_delivery IS 'Legal delivery with content verification (for legal documents)';
