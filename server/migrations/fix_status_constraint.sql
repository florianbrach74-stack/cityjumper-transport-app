-- Drop old constraint
ALTER TABLE transport_orders DROP CONSTRAINT IF EXISTS transport_orders_status_check;

-- Add new constraint with all valid statuses
ALTER TABLE transport_orders 
ADD CONSTRAINT transport_orders_status_check 
CHECK (status IN ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'));
