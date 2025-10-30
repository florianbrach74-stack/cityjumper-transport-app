const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔧 Starting database migration...\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add_additional_stops.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📦 New features are now available:');
    console.log('  ✓ Multi-stop orders (multiple pickups/deliveries)');
    console.log('  ✓ Admin can edit completed orders');
    console.log('  ✓ Additional stops during execution');
    console.log('  ✓ Automatic pricing: +6€ per extra stop\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
}

runMigration();
