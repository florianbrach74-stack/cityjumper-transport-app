const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
  try {
    // Check all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    
    console.log('📋 Tabellen in der Datenbank:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    console.log('');
    
    // Check all contractors
    const contractorsResult = await pool.query(`
      SELECT id, email, first_name, last_name, company_name, verification_status, account_status
      FROM users 
      WHERE role = 'contractor'
      ORDER BY id;
    `);
    
    console.log('👷 Alle Auftragnehmer:');
    contractorsResult.rows.forEach(user => {
      console.log(`ID: ${user.id} - ${user.email}`);
      console.log(`  Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Firma: ${user.company_name || 'keine'}`);
      console.log(`  Verifiziert: ${user.verification_status || 'pending'}`);
      console.log(`  Status: ${user.account_status || 'active'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
