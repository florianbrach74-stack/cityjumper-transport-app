-- Migration: Email-Verifizierung
-- Datum: 26. November 2025
-- Beschreibung: Fügt Email-Verifizierung mit 6-stelligem Code hinzu

-- Neue Spalten in users-Tabelle
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;

-- Telefon als Pflichtfeld markieren (nur Kommentar, nicht NULL wegen bestehender Daten)
COMMENT ON COLUMN users.phone IS 'Telefonnummer (Pflichtfeld für neue Registrierungen)';
COMMENT ON COLUMN users.email_verified IS 'Wurde die Email-Adresse verifiziert?';
COMMENT ON COLUMN users.email_verification_code IS '6-stelliger Verifizierungs-Code';
COMMENT ON COLUMN users.email_verification_expires_at IS 'Ablaufzeit des Verifizierungs-Codes (15 Minuten)';
COMMENT ON COLUMN users.email_verified_at IS 'Zeitpunkt der Email-Verifizierung';

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(email_verification_code);

-- Bestehende Benutzer als verifiziert markieren (Bestandsschutz)
UPDATE users 
SET email_verified = true, 
    email_verified_at = created_at 
WHERE email_verified IS NULL OR email_verified = false;

-- Verifizierung
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name LIKE '%verif%'
ORDER BY column_name;
