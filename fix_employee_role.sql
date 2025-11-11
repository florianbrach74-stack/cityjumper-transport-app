-- Fix: Change role from 'customer' to 'employee' for cill elle

-- Check current role
SELECT id, first_name, last_name, email, role, contractor_id 
FROM users 
WHERE email = 'luci.flader@gmx.de';

-- Update role to employee
UPDATE users 
SET role = 'employee'
WHERE email = 'luci.flader@gmx.de' AND role = 'customer';

-- Verify the change
SELECT id, first_name, last_name, email, role, contractor_id 
FROM users 
WHERE email = 'luci.flader@gmx.de';

-- Show all employees with their contractor
SELECT id, first_name, last_name, email, role, contractor_id
FROM users
WHERE role = 'employee'
ORDER BY first_name;
