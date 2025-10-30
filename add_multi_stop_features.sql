-- Add Multi-Stop Features and Admin Edit Capabilities
-- Run this migration to enable:
-- - Multi-stop orders (multiple pickups/deliveries)
-- - Admin editing of completed orders
-- - Additional stops during execution
-- - Automatic pricing: +6€ per extra stop

-- Add additional stops as JSONB array (for admin-added stops during execution)
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS additional_stops JSONB DEFAULT '[]'::jsonb;

-- Add initial pickup and delivery stops as JSONB arrays (for multi-stop orders at creation)
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS pickup_stops JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_stops JSONB DEFAULT '[]'::jsonb;

-- Add extra stops fee tracking
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS extra_stops_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_stops_fee DECIMAL(10, 2) DEFAULT 0;

-- Add clarification time tracking
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS clarification_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clarification_notes TEXT;

-- Add admin edit tracking
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN transport_orders.additional_stops IS 'Array of additional stops added by admin during execution';
COMMENT ON COLUMN transport_orders.pickup_stops IS 'Array of pickup stops defined at order creation (multi-stop orders)';
COMMENT ON COLUMN transport_orders.delivery_stops IS 'Array of delivery stops defined at order creation (multi-stop orders)';
COMMENT ON COLUMN transport_orders.extra_stops_count IS 'Number of extra stops beyond the first pickup and delivery';
COMMENT ON COLUMN transport_orders.extra_stops_fee IS 'Fee for extra stops (6€ per stop)';
COMMENT ON COLUMN transport_orders.clarification_minutes IS 'Time spent on clarifications (e.g., address corrections)';
COMMENT ON COLUMN transport_orders.clarification_notes IS 'Notes about clarifications made during order execution';
COMMENT ON COLUMN transport_orders.edit_history IS 'History of admin edits with timestamp and changes';
