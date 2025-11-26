const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

async function test() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
    ssl: { rejectUnauthorized: false }
  });
  
  // Lösche alte Test-Benutzer
  await pool.query("DELETE FROM users WHERE email LIKE 'test-verification-%'");
  
  const testEmail = `test-verification-${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('📝 Registriere mit:', testEmail);
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      role: 'customer',
      first_name: 'Test',
      last_name: 'User',
      phone: '+49 123 456789'
    });
    
    console.log('✅ Registrierung erfolgreich!');
    console.log('   requiresVerification:', response.data.requiresVerification);
    
    // Warte 2 Sekunden
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prüfe ob Code in DB ist
    const result = await pool.query(
      'SELECT email_verification_code, email_verified FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (result.rows.length > 0) {
      console.log('\n📧 Email-Verifizierung:');
      console.log('   Code in DB:', result.rows[0].email_verification_code);
      console.log('   Email verifiziert:', result.rows[0].email_verified);
      console.log('\n✅ Eine Email mit diesem Code sollte an', testEmail, 'gesendet worden sein!');
      console.log('   (Prüfe Resend-Dashboard ob Email versendet wurde)');
    }
    
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('\n🧹 Test-Benutzer gelöscht');
    
  } catch (error) {
    console.error('❌ Fehler:', error.response?.data || error.message);
  }
  
  await pool.end();
}

test();
