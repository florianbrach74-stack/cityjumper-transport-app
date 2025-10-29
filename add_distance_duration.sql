-- Add distance, duration and route geometry columns to transport_orders table

ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS route_geometry TEXT;

COMMENT ON COLUMN transport_orders.distance_km IS 'Calculated driving distance in kilometers (from real routing API)';
COMMENT ON COLUMN transport_orders.duration_minutes IS 'Calculated driving duration in minutes (from real routing API)';
COMMENT ON COLUMN transport_orders.route_geometry IS 'GeoJSON route geometry for map display';
