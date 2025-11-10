-- Add employee_assignment_mode column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_assignment_mode VARCHAR(50) DEFAULT 'all_access';

-- Add comment
COMMENT ON COLUMN users.employee_assignment_mode IS 'Employee assignment mode: all_access or manual_assignment';

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'employee_assignment_mode';
