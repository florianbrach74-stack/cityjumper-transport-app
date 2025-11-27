const pool = require('../config/database');

async function up() {
  console.log('🚀 Running migration: Create saved_routes table');
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_routes (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      route_name VARCHAR(255) NOT NULL,
      
      -- Pickup details
      pickup_address TEXT NOT NULL,
      pickup_city VARCHAR(255) NOT NULL,
      pickup_postal_code VARCHAR(20) NOT NULL,
      pickup_country VARCHAR(100) DEFAULT 'Deutschland',
      pickup_company VARCHAR(255),
      pickup_contact_name VARCHAR(255),
      pickup_contact_phone VARCHAR(50),
      
      -- Delivery details
      delivery_address TEXT NOT NULL,
      delivery_city VARCHAR(255) NOT NULL,
      delivery_postal_code VARCHAR(20) NOT NULL,
      delivery_country VARCHAR(100) DEFAULT 'Deutschland',
      delivery_company VARCHAR(255),
      delivery_contact_name VARCHAR(255),
      delivery_contact_phone VARCHAR(50),
      
      -- Cargo details (optional defaults)
      cargo_description TEXT,
      cargo_weight DECIMAL(10,2),
      cargo_length DECIMAL(10,2),
      cargo_width DECIMAL(10,2),
      cargo_height DECIMAL(10,2),
      
      -- Metadata
      usage_count INTEGER DEFAULT 0,
      last_used_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      CONSTRAINT unique_customer_route_name UNIQUE(customer_id, route_name)
    );
  `);
  
  // Create index for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_saved_routes_customer 
    ON saved_routes(customer_id);
  `);
  
  console.log('✅ Migration completed: saved_routes table created');
}

async function down() {
  console.log('🔄 Rolling back migration: Drop saved_routes table');
  
  await pool.query(`DROP TABLE IF EXISTS saved_routes CASCADE;`);
  
  console.log('✅ Rollback completed: saved_routes table dropped');
}

module.exports = { up, down };
