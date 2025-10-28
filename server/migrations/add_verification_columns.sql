-- Add verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS verified_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS insurance_document_url TEXT,
ADD COLUMN IF NOT EXISTS business_license_url TEXT,
ADD COLUMN IF NOT EXISTS minimum_wage_declaration_signed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS minimum_wage_signature TEXT,
ADD COLUMN IF NOT EXISTS minimum_wage_signed_at TIMESTAMP;

-- Add check constraint for verification_status
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_verification_status_check;
ALTER TABLE users 
ADD CONSTRAINT users_verification_status_check 
CHECK (verification_status IN ('pending', 'approved', 'rejected') OR verification_status IS NULL);
