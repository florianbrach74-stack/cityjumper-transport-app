-- Add waiting time columns to transport_orders table

ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS pickup_waiting_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS delivery_waiting_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS waiting_time_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS waiting_time_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS waiting_time_notes TEXT;

-- Add new status for pending approval
-- Status flow: delivered -> pending_approval -> completed
-- pending_approval = waiting for admin to approve waiting time fees

COMMENT ON COLUMN transport_orders.pickup_waiting_minutes IS 'Waiting time at pickup location in minutes';
COMMENT ON COLUMN transport_orders.delivery_waiting_minutes IS 'Waiting time at delivery location in minutes';
COMMENT ON COLUMN transport_orders.waiting_time_fee IS 'Calculated waiting time fee (first 30min free, then 3€ per 5min)';
COMMENT ON COLUMN transport_orders.waiting_time_approved IS 'Admin approval for waiting time fee';
COMMENT ON COLUMN transport_orders.waiting_time_notes IS 'Notes about waiting time from contractor';
