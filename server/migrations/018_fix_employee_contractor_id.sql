-- Fix employee contractor_id by finding it from assigned orders
UPDATE users u
SET contractor_id = (
  SELECT DISTINCT o.contractor_id
  FROM transport_orders o
  WHERE o.assigned_employee_id = u.id
  LIMIT 1
)
WHERE u.role = 'employee' 
  AND u.contractor_id IS NULL
  AND EXISTS (
    SELECT 1 
    FROM transport_orders o2 
    WHERE o2.assigned_employee_id = u.id
  );

-- Log the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM users
  WHERE role = 'employee' AND contractor_id IS NOT NULL;
  
  RAISE NOTICE 'Fixed % employees with contractor_id', fixed_count;
END $$;
