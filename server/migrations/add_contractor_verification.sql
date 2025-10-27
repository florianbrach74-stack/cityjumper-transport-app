-- Add verification fields for contractors
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT,
ADD COLUMN IF NOT EXISTS business_license_url TEXT,
ADD COLUMN IF NOT EXISTS minimum_wage_declaration_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_wage_signature TEXT,
ADD COLUMN IF NOT EXISTS minimum_wage_signed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add comments
COMMENT ON COLUMN users.verification_status IS 'pending, approved, rejected';
COMMENT ON COLUMN users.insurance_document_url IS 'URL to uploaded transport insurance document';
COMMENT ON COLUMN users.business_license_url IS 'URL to uploaded business license (Gewerbeanmeldung)';
COMMENT ON COLUMN users.minimum_wage_declaration_signed IS 'Whether contractor signed minimum wage declaration';
COMMENT ON COLUMN users.minimum_wage_signature IS 'Base64 signature for minimum wage declaration';
COMMENT ON COLUMN users.verified_by IS 'Admin user who verified the contractor';
COMMENT ON COLUMN users.verified_at IS 'When the contractor was verified';
