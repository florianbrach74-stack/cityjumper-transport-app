const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Read DATABASE_URL from environment or use default
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/courierly_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔄 Connecting to database...');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_loading_help_and_legal_delivery.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Running migration: add_loading_help_and_legal_delivery.sql');
    console.log('---');
    
    // Execute migration
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Added columns:');
    console.log('  - needs_loading_help (BOOLEAN)');
    console.log('  - needs_unloading_help (BOOLEAN)');
    console.log('  - loading_help_fee (DECIMAL)');
    console.log('  - legal_delivery (BOOLEAN)');
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('needs_loading_help', 'needs_unloading_help', 'loading_help_fee', 'legal_delivery')
      ORDER BY column_name
    `);
    
    console.log('');
    console.log('✓ Verification:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type}) - Default: ${row.column_default || 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('');
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
