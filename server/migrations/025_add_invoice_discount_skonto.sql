-- Add discount and skonto tracking to invoices

-- 1. Add discount and skonto columns to sent_invoices
ALTER TABLE sent_invoices 
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS skonto_offered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS skonto_percentage DECIMAL(5, 2) DEFAULT 0;

-- 2. Add comments
COMMENT ON COLUMN sent_invoices.discount_percentage IS 'Discount percentage applied (e.g., 5.00 for 5%)';
COMMENT ON COLUMN sent_invoices.discount_amount IS 'Actual discount amount in EUR';
COMMENT ON COLUMN sent_invoices.skonto_offered IS 'Whether skonto payment terms were offered';
COMMENT ON COLUMN sent_invoices.skonto_percentage IS 'Skonto percentage offered (e.g., 2.00 for 2%)';
