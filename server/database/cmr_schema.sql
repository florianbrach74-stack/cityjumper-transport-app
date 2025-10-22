-- CMR Frachtbrief Erweiterung

-- CMR Documents Table
CREATE TABLE IF NOT EXISTS cmr_documents (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES transport_orders(id) ON DELETE CASCADE,
    cmr_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Sender Information (from pickup)
    sender_name VARCHAR(255) NOT NULL,
    sender_address VARCHAR(500) NOT NULL,
    sender_city VARCHAR(100) NOT NULL,
    sender_postal_code VARCHAR(20) NOT NULL,
    sender_country VARCHAR(100) NOT NULL,
    
    -- Consignee Information (from delivery)
    consignee_name VARCHAR(255) NOT NULL,
    consignee_address VARCHAR(500) NOT NULL,
    consignee_city VARCHAR(100) NOT NULL,
    consignee_postal_code VARCHAR(20) NOT NULL,
    consignee_country VARCHAR(100) NOT NULL,
    
    -- Carrier Information
    carrier_name VARCHAR(255) NOT NULL,
    carrier_address VARCHAR(500),
    carrier_city VARCHAR(100),
    carrier_postal_code VARCHAR(20),
    
    -- Shipment Details
    place_of_loading VARCHAR(255),
    place_of_delivery VARCHAR(255),
    documents_attached TEXT,
    
    -- Goods Description
    goods_description TEXT,
    number_of_packages INTEGER,
    method_of_packing VARCHAR(100),
    marks_and_numbers TEXT,
    gross_weight DECIMAL(10, 2),
    volume DECIMAL(10, 2),
    
    -- Special Agreements
    special_agreements TEXT,
    
    -- Payment
    carriage_charges_paid BOOLEAN DEFAULT false,
    carriage_charges_forward BOOLEAN DEFAULT false,
    cash_on_delivery DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_transit', 'delivered', 'signed')),
    
    -- Signatures
    sender_signature TEXT,
    sender_signed_at TIMESTAMP,
    sender_signature_location VARCHAR(255),
    
    carrier_signature TEXT,
    carrier_signed_at TIMESTAMP,
    carrier_signature_location VARCHAR(255),
    
    consignee_signature TEXT,
    consignee_signed_at TIMESTAMP,
    consignee_signature_location VARCHAR(255),
    consignee_remarks TEXT,
    
    -- PDF Storage
    pdf_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cmr_order ON cmr_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_cmr_number ON cmr_documents(cmr_number);
CREATE INDEX IF NOT EXISTS idx_cmr_status ON cmr_documents(status);

-- Trigger for updated_at
CREATE TRIGGER update_cmr_documents_updated_at BEFORE UPDATE ON cmr_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate CMR number
CREATE OR REPLACE FUNCTION generate_cmr_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
    new_number := 'CMR' || year_suffix || LPAD(nextval('cmr_documents_id_seq')::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;
