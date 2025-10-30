const pool = require('../config/database');

async function autoMigrate() {
  try {
    console.log('🔍 Checking if migration is needed...');
    
    // Check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('additional_stops', 'pickup_stops', 'delivery_stops', 'extra_stops_count');
    `;
    
    const result = await pool.query(checkQuery);
    
    if (result.rows.length >= 4) {
      console.log('✓ Migration already applied, skipping...');
      return;
    }
    
    console.log('🔧 Applying migration...');
    
    // Add additional stops as JSONB array (for admin-added stops during execution)
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS additional_stops JSONB DEFAULT '[]'::jsonb;
    `);
    
    // Add initial pickup and delivery stops as JSONB arrays (for multi-stop orders at creation)
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS pickup_stops JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS delivery_stops JSONB DEFAULT '[]'::jsonb;
    `);
    
    // Add extra stops fee tracking
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS extra_stops_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS extra_stops_fee DECIMAL(10, 2) DEFAULT 0;
    `);
    
    // Add clarification time tracking
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS clarification_minutes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS clarification_notes TEXT;
    `);
    
    // Add admin edit tracking
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
    `);
    
    console.log('✅ Migration completed successfully!');
    console.log('📦 New features are now available:');
    console.log('  ✓ Multi-stop orders (multiple pickups/deliveries)');
    console.log('  ✓ Admin can edit completed orders');
    console.log('  ✓ Additional stops during execution');
    console.log('  ✓ Automatic pricing: +6€ per extra stop');
    
  } catch (error) {
    console.error('⚠️  Migration error (may be safe to ignore if already applied):', error.message);
  }
}

module.exports = autoMigrate;
