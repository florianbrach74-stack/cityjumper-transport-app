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
    const sql = fs.readFileSync('add_contractor_pricing.sql', 'utf8');
    
    console.log('📝 Executing contractor pricing migration...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Contractor pricing migration completed successfully!\n');
    console.log('📦 New features are now available:');
    console.log('  ✓ contractor_price column (85% of customer price)');
    console.log('  ✓ price_updated_at timestamp tracking');
    console.log('  ✓ 15% platform commission automatically calculated');
    console.log('  ✓ Existing orders updated with contractor prices\n');
    
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
