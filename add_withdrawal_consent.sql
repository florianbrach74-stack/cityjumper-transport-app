-- Add withdrawal consent fields to transport_orders table
ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS withdrawal_consent_given BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawal_consent_timestamp TIMESTAMP,
ADD COLUMN IF NOT EXISTS withdrawal_consent_ip VARCHAR(45);

-- Add comment
COMMENT ON COLUMN transport_orders.withdrawal_consent_given IS 'Customer agreed to immediate service execution and loss of withdrawal right';
COMMENT ON COLUMN transport_orders.withdrawal_consent_timestamp IS 'Timestamp when consent was given';
COMMENT ON COLUMN transport_orders.withdrawal_consent_ip IS 'IP address when consent was given';
