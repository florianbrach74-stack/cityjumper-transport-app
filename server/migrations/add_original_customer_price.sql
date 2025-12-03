-- Add original_customer_price column to track the price customer agreed to
-- This is used when platform pays for price increases from penalty budget

ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS original_customer_price DECIMAL(10, 2);

-- Set existing values: if available_budget exists, use current price as original
UPDATE transport_orders 
SET original_customer_price = price 
WHERE available_budget IS NOT NULL 
  AND original_customer_price IS NULL;

COMMENT ON COLUMN transport_orders.original_customer_price IS 
'Original price customer agreed to. Used for invoicing when platform pays for price increases from penalty budget.';
