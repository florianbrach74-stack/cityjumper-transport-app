const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔧 Connecting to Railway database...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('add_multi_stop_features.sql', 'utf8');
    
    console.log('📝 Executing migration...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📦 New features are now available:');
    console.log('  ✓ Multi-stop orders (multiple pickups/deliveries)');
    console.log('  ✓ Admin can edit completed orders');
    console.log('  ✓ Additional stops during execution');
    console.log('  ✓ Automatic pricing: +6€ per extra stop\n');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
