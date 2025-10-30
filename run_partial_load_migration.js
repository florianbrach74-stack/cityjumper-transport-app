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
    const sql = fs.readFileSync('add_partial_load_support.sql', 'utf8');
    
    console.log('📝 Executing partial load migration...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Partial load migration completed successfully!\n');
    console.log('📦 New features are now available:');
    console.log('  ✓ Partial load (Beiladung) support');
    console.log('  ✓ Orders below minimum wage can be marked as partial load');
    console.log('  ✓ 7-day flexible delivery window');
    console.log('  ✓ Visible to contractors as partial load\n');
    
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
