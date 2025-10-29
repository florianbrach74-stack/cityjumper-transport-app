-- Add 'pending_approval' to the allowed status values

-- First, drop the existing constraint
ALTER TABLE transport_orders DROP CONSTRAINT IF EXISTS transport_orders_status_check;

-- Add the new constraint with 'pending_approval' included
ALTER TABLE transport_orders ADD CONSTRAINT transport_orders_status_check 
CHECK (status IN ('pending', 'accepted', 'picked_up', 'delivered', 'pending_approval', 'completed', 'cancelled'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'transport_orders'::regclass 
AND conname = 'transport_orders_status_check';
