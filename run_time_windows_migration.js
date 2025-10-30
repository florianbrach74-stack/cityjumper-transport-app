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
    const sql = fs.readFileSync('add_time_windows.sql', 'utf8');
    
    console.log('📝 Executing time windows migration...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Time windows migration completed successfully!\n');
    console.log('📦 New features are now available:');
    console.log('  ✓ Time windows for pickup (from/to)');
    console.log('  ✓ Time windows for delivery (from/to)');
    console.log('  ✓ Flexible scheduling (e.g., 11:00-13:00)');
    console.log('  ✓ Existing data migrated to new format\n');
    
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
