-- Migration 026: Add contractor invoice tracking to sent_invoices
-- This prevents double payments by tracking if contractor invoices are received and paid

ALTER TABLE sent_invoices 
ADD COLUMN IF NOT EXISTS contractor_invoice_received BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contractor_invoice_received_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS contractor_invoice_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contractor_invoice_paid_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS contractor_invoice_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN sent_invoices.contractor_invoice_received IS 'Indicates if invoice from contractor has been received';
COMMENT ON COLUMN sent_invoices.contractor_invoice_received_date IS 'Date when contractor invoice was received';
COMMENT ON COLUMN sent_invoices.contractor_invoice_paid IS 'Indicates if contractor invoice has been paid';
COMMENT ON COLUMN sent_invoices.contractor_invoice_paid_date IS 'Date when contractor invoice was paid';
COMMENT ON COLUMN sent_invoices.contractor_invoice_notes IS 'Notes about contractor invoice (e.g., invoice number, payment reference)';
