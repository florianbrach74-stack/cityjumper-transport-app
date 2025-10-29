-- Add distance and duration columns to transport_orders table

ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

COMMENT ON COLUMN transport_orders.distance_km IS 'Calculated driving distance in kilometers';
COMMENT ON COLUMN transport_orders.duration_minutes IS 'Calculated driving duration in minutes';
