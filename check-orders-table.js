const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE '%order%'
    ORDER BY table_name
  `);
  
  console.log('📋 Tabellen mit "order":');
  tables.rows.forEach(row => console.log('  -', row.table_name));
  
  // Prüfe welche Tabelle Daten hat
  for (const row of tables.rows) {
    const count = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
    console.log(`\n${row.table_name}: ${count.rows[0].count} Einträge`);
  }
  
  await pool.end();
}

check();
