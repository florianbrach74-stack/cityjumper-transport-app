-- Add support for partial load (Beiladung) orders
-- Orders below minimum wage can be marked as partial load
-- These orders are flexible on delivery time (within 7 days)

ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS is_partial_load BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS partial_load_deadline DATE,
ADD COLUMN IF NOT EXISTS minimum_price_at_creation DECIMAL(10, 2);

COMMENT ON COLUMN transport_orders.is_partial_load IS 'Order is marked as partial load (Beiladung) - price below minimum wage, flexible delivery within 7 days';
COMMENT ON COLUMN transport_orders.partial_load_deadline IS 'Deadline for partial load delivery (7 days from creation)';
COMMENT ON COLUMN transport_orders.minimum_price_at_creation IS 'Calculated minimum price at order creation for reference';
