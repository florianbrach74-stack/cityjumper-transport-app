const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkCustomers() {
  try {
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        first_name, 
        last_name, 
        company_name,
        company_address,
        company_postal_code,
        company_city,
        tax_id,
        vat_id
      FROM users 
      WHERE role = 'customer'
      ORDER BY id;
    `);
    
    console.log('📊 Kunden in der Datenbank:\n');
    result.rows.forEach(user => {
      console.log(`ID: ${user.id} - ${user.email}`);
      console.log(`  Name: ${user.first_name} ${user.last_name}`);
      console.log(`  Firma: ${user.company_name || 'keine'}`);
      if (user.company_name) {
        console.log(`  Adresse: ${user.company_address || 'keine'}`);
        console.log(`  PLZ/Ort: ${user.company_postal_code || ''} ${user.company_city || ''}`);
        console.log(`  Steuer-Nr: ${user.tax_id || 'keine'}`);
        console.log(`  USt-ID: ${user.vat_id || 'keine'}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCustomers();
