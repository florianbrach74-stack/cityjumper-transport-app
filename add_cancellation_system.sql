-- Add cancellation system columns to transport_orders table
ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS cancellation_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20),
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancellation_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_fee_percentage INTEGER,
ADD COLUMN IF NOT EXISTS contractor_penalty DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_compensation DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancellation_notes TEXT;

-- Add comments
COMMENT ON COLUMN transport_orders.cancellation_status IS 'Status: cancelled_by_customer, cancelled_by_contractor, null if active';
COMMENT ON COLUMN transport_orders.cancelled_by IS 'Who cancelled: customer, contractor, admin';
COMMENT ON COLUMN transport_orders.cancellation_reason IS 'Reason for cancellation';
COMMENT ON COLUMN transport_orders.cancellation_timestamp IS 'When was it cancelled';
COMMENT ON COLUMN transport_orders.cancellation_fee IS 'Fee charged to customer for cancellation';
COMMENT ON COLUMN transport_orders.cancellation_fee_percentage IS 'Percentage of original price (0, 50, 75)';
COMMENT ON COLUMN transport_orders.contractor_penalty IS 'Penalty charged to contractor if they cancel';
COMMENT ON COLUMN transport_orders.customer_compensation IS 'Additional amount charged to customer due to contractor cancellation';
COMMENT ON COLUMN transport_orders.cancellation_notes IS 'Admin notes about cancellation';

-- Create cancellation_history table for audit trail
CREATE TABLE IF NOT EXISTS cancellation_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES transport_orders(id) ON DELETE CASCADE,
  cancelled_by VARCHAR(20) NOT NULL,
  cancellation_reason TEXT,
  cancellation_fee DECIMAL(10, 2),
  contractor_penalty DECIMAL(10, 2),
  customer_compensation DECIMAL(10, 2),
  hours_before_pickup DECIMAL(10, 2),
  driver_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

COMMENT ON TABLE cancellation_history IS 'Audit trail for all cancellations';
