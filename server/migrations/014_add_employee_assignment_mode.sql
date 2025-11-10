-- Add employee_assignment_mode column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_assignment_mode VARCHAR(50) DEFAULT 'all_access';

-- Add comment
COMMENT ON COLUMN users.employee_assignment_mode IS 'Employee assignment mode: all_access or manual_assignment';
