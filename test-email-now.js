const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function testEmailNow() {
  console.log('🧪 Teste Email-Verifizierung JETZT...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  
  try {
    console.log('📝 Registriere:', testEmail);
    
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: 'Test123!',
      role: 'customer',
      first_name: 'Test',
      last_name: 'User',
      phone: '+49 123 456789'
    });
    
    console.log('✅ Registrierung erfolgreich');
    console.log('   requiresVerification:', response.data.requiresVerification);
    
    // Warte 2 Sekunden
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Prüfe DB
    const result = await pool.query(
      'SELECT email_verified, email_verification_code FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('\n📧 Email-Status:');
      console.log('   Email verifiziert:', user.email_verified);
      console.log('   Code generiert:', user.email_verification_code);
      
      if (user.email_verification_code) {
        console.log('   ✅ Code vorhanden - Email sollte versendet worden sein!');
      } else {
        console.log('   ❌ KEIN Code - Email wurde NICHT versendet!');
      }
    }
    
    // Cleanup
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('\n✅ Test-Benutzer gelöscht');
    
    console.log('\n🎉 Test abgeschlossen!\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.response?.data || error.message);
  } finally {
    await pool.end();
  }
}

testEmailNow();
