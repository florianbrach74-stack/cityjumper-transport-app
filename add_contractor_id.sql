-- Add contractor_id column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES users(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_contractor_id ON users(contractor_id);

-- Show all employees and their contractor_id
SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  contractor_id
FROM users
WHERE role = 'employee'
ORDER BY created_at DESC;

-- Show all contractors
SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  company_name
FROM users
WHERE role = 'contractor'
ORDER BY created_at DESC;
