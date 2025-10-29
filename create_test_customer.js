const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function createTestCustomer() {
  try {
    console.log('🔌 Connecting to database...');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    // Create test customer with company data
    const result = await pool.query(`
      INSERT INTO users (
        email, 
        password, 
        role, 
        first_name, 
        last_name, 
        phone,
        company_name,
        company_address,
        company_postal_code,
        company_city,
        company_country,
        tax_id,
        vat_id,
        account_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      ON CONFLICT (email) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        company_address = EXCLUDED.company_address,
        company_postal_code = EXCLUDED.company_postal_code,
        company_city = EXCLUDED.company_city,
        company_country = EXCLUDED.company_country,
        tax_id = EXCLUDED.tax_id,
        vat_id = EXCLUDED.vat_id
      RETURNING *
    `, [
      'testkunde@firma.de',
      hashedPassword,
      'customer',
      'Max',
      'Mustermann',
      '+49 30 12345678',
      'Test Transport GmbH',
      'Teststraße 123',
      '10115',
      'Berlin',
      'Deutschland',
      '123/456/78901',
      'DE123456789'
      ,
      'active'
    ]);
    
    console.log('✅ Test-Kunde erstellt:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: testkunde@firma.de');
    console.log('🔑 Passwort: test123');
    console.log('👤 Name: Max Mustermann');
    console.log('🏢 Firma: Test Transport GmbH');
    console.log('📍 Adresse: Teststraße 123, 10115 Berlin');
    console.log('🔢 Steuer-Nr: 123/456/78901');
    console.log('🇪🇺 USt-IdNr: DE123456789');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Login mit: testkunde@firma.de / test123');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

createTestCustomer();
