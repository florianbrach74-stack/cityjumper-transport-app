-- Add timestamp columns for order status tracking
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add comments
COMMENT ON COLUMN transport_orders.picked_up_at IS 'Timestamp when order was picked up';
COMMENT ON COLUMN transport_orders.delivered_at IS 'Timestamp when order was delivered';
COMMENT ON COLUMN transport_orders.completed_at IS 'Timestamp when order was completed';
