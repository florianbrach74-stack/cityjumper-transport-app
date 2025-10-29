const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log('🔌 Connecting to Railway PostgreSQL...');
    
    const sqlFile = path.join(__dirname, 'add_account_status.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📄 Adding account_status column...');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    
    const result = await pool.query(`
      SELECT account_status, COUNT(*) as count
      FROM users 
      GROUP BY account_status;
    `);
    
    console.log('\n📊 Account status distribution:');
    result.rows.forEach(row => {
      console.log(`  - ${row.account_status}: ${row.count} users`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
