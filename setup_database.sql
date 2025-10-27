-- Complete Database Setup for CityJumper Transport App

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('customer', 'contractor')),
    company_name VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transport_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contractor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    pickup_address VARCHAR(500) NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_postal_code VARCHAR(20) NOT NULL,
    pickup_country VARCHAR(100) DEFAULT 'Deutschland',
    pickup_date DATE NOT NULL,
    pickup_time VARCHAR(50),
    pickup_contact_name VARCHAR(200),
    pickup_contact_phone VARCHAR(50),
    delivery_address VARCHAR(500) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_postal_code VARCHAR(20) NOT NULL,
    delivery_country VARCHAR(100) DEFAULT 'Deutschland',
    delivery_date DATE,
    delivery_time VARCHAR(50),
    delivery_contact_name VARCHAR(200),
    delivery_contact_phone VARCHAR(50),
    vehicle_type VARCHAR(100) NOT NULL,
    weight DECIMAL(10, 2),
    length DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    pallets INTEGER,
    description TEXT,
    special_requirements TEXT,
    price DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cmr_documents (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES transport_orders(id) ON DELETE CASCADE,
    cmr_number VARCHAR(50) UNIQUE NOT NULL,
    sender_name VARCHAR(255) NOT NULL,
    sender_address VARCHAR(500) NOT NULL,
    sender_city VARCHAR(100) NOT NULL,
    sender_postal_code VARCHAR(20) NOT NULL,
    sender_country VARCHAR(100) NOT NULL,
    consignee_name VARCHAR(255) NOT NULL,
    consignee_address VARCHAR(500) NOT NULL,
    consignee_city VARCHAR(100) NOT NULL,
    consignee_postal_code VARCHAR(20) NOT NULL,
    consignee_country VARCHAR(100) NOT NULL,
    carrier_name VARCHAR(255) NOT NULL,
    carrier_address VARCHAR(500),
    carrier_city VARCHAR(100),
    carrier_postal_code VARCHAR(20),
    place_of_loading VARCHAR(255),
    place_of_delivery VARCHAR(255),
    documents_attached TEXT,
    goods_description TEXT,
    number_of_packages INTEGER,
    method_of_packing VARCHAR(100),
    marks_and_numbers TEXT,
    gross_weight DECIMAL(10, 2),
    volume DECIMAL(10, 2),
    special_agreements TEXT,
    carriage_charges_paid BOOLEAN DEFAULT false,
    carriage_charges_forward BOOLEAN DEFAULT false,
    cash_on_delivery DECIMAL(10, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'in_transit', 'delivered', 'signed')),
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
    consignee_signed_name VARCHAR(255),
    consignee_photo TEXT,
    sender_photo TEXT,
    carrier_photo TEXT,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON transport_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_contractor ON transport_orders(contractor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON transport_orders(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_cmr_order ON cmr_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_cmr_number ON cmr_documents(cmr_number);
CREATE INDEX IF NOT EXISTS idx_cmr_status ON cmr_documents(status);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_orders_updated_at BEFORE UPDATE ON transport_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cmr_documents_updated_at BEFORE UPDATE ON cmr_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
