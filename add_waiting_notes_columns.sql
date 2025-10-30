-- Add separate waiting time notes columns
ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS pickup_waiting_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_waiting_notes TEXT;

COMMENT ON COLUMN transport_orders.pickup_waiting_notes IS 'Notes/reason for pickup waiting time';
COMMENT ON COLUMN transport_orders.delivery_waiting_notes IS 'Notes/reason for delivery waiting time';

-- Migrate existing waiting_time_notes to pickup_waiting_notes if pickup_waiting_minutes > 0
UPDATE transport_orders
SET pickup_waiting_notes = waiting_time_notes
WHERE pickup_waiting_minutes > 0 AND waiting_time_notes IS NOT NULL;
