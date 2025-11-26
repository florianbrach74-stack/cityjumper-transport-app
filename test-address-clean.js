const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function test() {
  console.log('🧪 Teste Adress-Pflichtfelder (nach Deployment)\n');
  
  const email1 = `no-address-${Date.now()}@test.com`;
  const email2 = `with-address-${Date.now()}@test.com`;
  
  try {
    // Test 1: Ohne Adresse
    console.log('📝 Test 1: OHNE Adresse');
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email: email1,
        password: 'Test123!',
        role: 'customer',
        first_name: 'Test',
        last_name: 'User',
        phone: '+49 123 456789'
      });
      console.log('❌ Sollte fehlschlagen!');
    } catch (e) {
      if (e.response?.data?.error?.includes('Rechnungsadresse')) {
        console.log('✅ Korrekt blockiert:', e.response.data.error);
      } else {
        console.log('⚠️  Anderer Fehler:', e.response?.data?.error || e.message);
      }
    }
    
    // Test 2: Mit Adresse
    console.log('\n📝 Test 2: MIT Adresse');
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: email2,
      password: 'Test123!',
      role: 'customer',
      first_name: 'Test',
      last_name: 'User',
      phone: '+49 123 456789',
      company_address: 'Teststr. 1',
      company_postal_code: '10115',
      company_city: 'Berlin'
    });
    
    console.log('✅ Erfolgreich registriert!');
    console.log('   Email:', response.data.email);
    
    // Prüfe DB
    const result = await pool.query(
      'SELECT company_address, company_postal_code, company_city FROM users WHERE email = $1',
      [email2]
    );
    
    if (result.rows.length > 0) {
      console.log('\n📍 Adresse in DB:');
      console.log('   Straße:', result.rows[0].company_address);
      console.log('   PLZ:', result.rows[0].company_postal_code);
      console.log('   Stadt:', result.rows[0].company_city);
    }
    
    // Cleanup
    await pool.query('DELETE FROM users WHERE email IN ($1, $2)', [email1, email2]);
    console.log('\n✅ Test-Benutzer gelöscht');
    
    console.log('\n🎉 Adresse ist jetzt Pflichtfeld!\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

test();
