-- ZipMend Transport Management Database Schema

-- Users Table (both customers and contractors)
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

-- Transport Orders Table
CREATE TABLE IF NOT EXISTS transport_orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contractor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- Pickup Information
    pickup_address VARCHAR(500) NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_postal_code VARCHAR(20) NOT NULL,
    pickup_country VARCHAR(100) DEFAULT 'Deutschland',
    pickup_date DATE NOT NULL,
    pickup_time VARCHAR(50),
    pickup_contact_name VARCHAR(200),
    pickup_contact_phone VARCHAR(50),
    
    -- Delivery Information
    delivery_address VARCHAR(500) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    delivery_postal_code VARCHAR(20) NOT NULL,
    delivery_country VARCHAR(100) DEFAULT 'Deutschland',
    delivery_date DATE,
    delivery_time VARCHAR(50),
    delivery_contact_name VARCHAR(200),
    delivery_contact_phone VARCHAR(50),
    
    -- Shipment Details
    vehicle_type VARCHAR(100) NOT NULL,
    weight DECIMAL(10, 2),
    length DECIMAL(10, 2),
    width DECIMAL(10, 2),
    height DECIMAL(10, 2),
    pallets INTEGER,
    description TEXT,
    special_requirements TEXT,
    
    -- Pricing
    price DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_transit', 'completed', 'cancelled')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer ON transport_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_contractor ON transport_orders(contractor_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON transport_orders(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_orders_updated_at BEFORE UPDATE ON transport_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
