const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkOrder9() {
  try {
    // Check order 9 with customer data
    const result = await pool.query(`
      SELECT o.*, 
        c.email as customer_email, 
        c.first_name as customer_first_name, 
        c.last_name as customer_last_name, 
        c.company_name as customer_company
      FROM transport_orders o
      LEFT JOIN users c ON o.customer_id = c.id
      WHERE o.id = 9;
    `);
    
    console.log('📦 Auftrag #9 mit Kundendaten:');
    console.log(JSON.stringify(result.rows[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder9();
