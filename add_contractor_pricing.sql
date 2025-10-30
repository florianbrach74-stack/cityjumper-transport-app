-- Add contractor pricing and price update tracking
-- contractor_price = 85% of customer price (15% platform commission)
-- price_updated_at tracks when price was last changed

ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS contractor_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMP;

-- Calculate contractor_price for existing orders (85% of customer price)
UPDATE transport_orders 
SET contractor_price = ROUND(price * 0.85, 2)
WHERE contractor_price IS NULL AND price IS NOT NULL;

COMMENT ON COLUMN transport_orders.contractor_price IS 'Price shown to contractors (85% of customer price, 15% platform commission)';
COMMENT ON COLUMN transport_orders.price_updated_at IS 'Timestamp when price was last updated by customer';
