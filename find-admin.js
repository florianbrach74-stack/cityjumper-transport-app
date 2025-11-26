const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function findAdmin() {
  const result = await pool.query(
    "SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1"
  );
  
  if (result.rows.length > 0) {
    console.log('Admin gefunden:', result.rows[0].email);
  } else {
    console.log('Kein Admin gefunden');
  }
  
  await pool.end();
}

findAdmin();
