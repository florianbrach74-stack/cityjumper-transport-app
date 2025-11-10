-- Check employee contractor_id
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

-- Check contractors
SELECT 
  id,
  first_name,
  last_name,
  email,
  role
FROM users
WHERE role = 'contractor'
ORDER BY created_at DESC;
