const { Pool } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway';

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔧 Connecting to Railway database...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('add_pricing_settings.sql', 'utf8');
    
    console.log('📝 Executing pricing settings migration...\n');
    
    // Execute the migration
    await pool.query(sql);
    
    console.log('✅ Pricing settings migration completed successfully!\n');
    console.log('📦 New features are now available:');
    console.log('  ✓ pricing_settings table created');
    console.log('  ✓ Default pricing parameters inserted');
    console.log('  ✓ Admin can now configure:');
    console.log('    - Distanzpreise (unter/über 100km)');
    console.log('    - Stundensatz');
    console.log('    - Startgebühr');
    console.log('    - Extra-Stop-Gebühr');
    console.log('    - Plattform-Provision');
    console.log('    - Empfohlener Aufschlag');
    console.log('    - Wartezeit-Parameter\n');
    
    // Show current settings
    const result = await pool.query('SELECT * FROM pricing_settings ORDER BY setting_key');
    console.log('📊 Current pricing settings:');
    result.rows.forEach(row => {
      console.log(`  ${row.setting_key}: ${row.setting_value} ${row.setting_unit}`);
    });
    console.log('');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed!');
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
