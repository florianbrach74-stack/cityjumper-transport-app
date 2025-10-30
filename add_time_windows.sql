-- Add time window support for pickup and delivery
-- Instead of fixed times, customers can specify time ranges (e.g., 11:00-13:00)

ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS pickup_time_from TIME,
ADD COLUMN IF NOT EXISTS pickup_time_to TIME,
ADD COLUMN IF NOT EXISTS delivery_time_from TIME,
ADD COLUMN IF NOT EXISTS delivery_time_to TIME;

-- Migrate existing data: if pickup_time exists, use it as both from and to
UPDATE transport_orders 
SET pickup_time_from = pickup_time::TIME,
    pickup_time_to = pickup_time::TIME
WHERE pickup_time IS NOT NULL AND pickup_time_from IS NULL;

UPDATE transport_orders 
SET delivery_time_from = delivery_time::TIME,
    delivery_time_to = delivery_time::TIME
WHERE delivery_time IS NOT NULL AND delivery_time_from IS NULL;

COMMENT ON COLUMN transport_orders.pickup_time_from IS 'Start of pickup time window (e.g., 11:00)';
COMMENT ON COLUMN transport_orders.pickup_time_to IS 'End of pickup time window (e.g., 13:00)';
COMMENT ON COLUMN transport_orders.delivery_time_from IS 'Start of delivery time window (e.g., 14:00)';
COMMENT ON COLUMN transport_orders.delivery_time_to IS 'End of delivery time window (e.g., 16:00)';
