-- Create order_bids table for contractor applications
CREATE TABLE IF NOT EXISTS order_bids (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES transport_orders(id) ON DELETE CASCADE,
  contractor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_id, contractor_id)
);

-- Add indexes
CREATE INDEX idx_order_bids_order_id ON order_bids(order_id);
CREATE INDEX idx_order_bids_contractor_id ON order_bids(contractor_id);
CREATE INDEX idx_order_bids_status ON order_bids(status);

-- Add comments
COMMENT ON TABLE order_bids IS 'Contractor bids/applications for orders';
COMMENT ON COLUMN order_bids.bid_amount IS 'Amount contractor is willing to do the job for (85% of customer price or less)';
COMMENT ON COLUMN order_bids.status IS 'pending, accepted, rejected';
COMMENT ON COLUMN order_bids.message IS 'Optional message from contractor';
