-- Add company details to users table for billing and auto-fill

ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_postal_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS company_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_country VARCHAR(100) DEFAULT 'Deutschland',
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS vat_id VARCHAR(50);

COMMENT ON COLUMN users.company_name IS 'Company name (already exists)';
COMMENT ON COLUMN users.company_address IS 'Company street address for billing';
COMMENT ON COLUMN users.company_postal_code IS 'Company postal code';
COMMENT ON COLUMN users.company_city IS 'Company city';
COMMENT ON COLUMN users.company_country IS 'Company country';
COMMENT ON COLUMN users.tax_id IS 'Tax ID (Steuernummer)';
COMMENT ON COLUMN users.vat_id IS 'VAT ID (Umsatzsteuer-ID)';
