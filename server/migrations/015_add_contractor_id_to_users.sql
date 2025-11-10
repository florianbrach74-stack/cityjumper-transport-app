-- Add contractor_id column to users table for employee-contractor relationship
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_contractor_id ON users(contractor_id);

-- Add comment
COMMENT ON COLUMN users.contractor_id IS 'For employees: ID of the contractor they belong to';
