-- Add company name fields for pickup and delivery locations

ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS pickup_company VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_company VARCHAR(255);

COMMENT ON COLUMN transport_orders.pickup_company IS 'Company name at pickup location (e.g., Amazon GmbH)';
COMMENT ON COLUMN transport_orders.delivery_company IS 'Company name at delivery location (e.g., IKEA Berlin)';

-- Note: pickup_contact_name and delivery_contact_name are the contact persons
-- The actual signer name will be entered during signature process
