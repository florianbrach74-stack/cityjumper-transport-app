-- Add account status field to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

COMMENT ON COLUMN users.account_status IS 'Account status: active, suspended, deleted';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- Update existing users to active
UPDATE users SET account_status = 'active' WHERE account_status IS NULL;
