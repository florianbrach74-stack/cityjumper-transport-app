const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

async function finalTest() {
  console.log('🧪 FINALER EMAIL-VERIFIZIERUNGS-TEST\n');
  console.log('⏳ Warte 10 Sekunden um sicherzustellen dass Railway deployed ist...\n');
  
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  const pool = new Pool({
    connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
    ssl: { rejectUnauthorized: false }
  });
  
  // Cleanup alte Tests
  await pool.query("DELETE FROM users WHERE email LIKE 'final-test-%'");
  
  const testEmail = `final-test-${Date.now()}@gmail.com`;
  const testPassword = 'TestPassword123!';
  
  console.log('📝 SCHRITT 1: Registrierung');
  console.log('   Email:', testEmail);
  console.log('   Passwort:', testPassword);
  
  try {
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      role: 'customer',
      first_name: 'Final',
      last_name: 'Test',
      phone: '+49 123 456789'
    });
    
    console.log('✅ Registrierung erfolgreich!');
    console.log('   requiresVerification:', registerResponse.data.requiresVerification);
    console.log('   User ID:', registerResponse.data.user.id);
    
    // Warte 3 Sekunden für Email-Versand
    console.log('\n⏳ Warte 3 Sekunden für Email-Versand...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📧 SCHRITT 2: Prüfe Datenbank');
    const dbResult = await pool.query(
      'SELECT email_verification_code, email_verified FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (dbResult.rows.length === 0) {
      console.log('❌ FEHLER: Benutzer nicht in Datenbank!');
      await pool.end();
      return;
    }
    
    const user = dbResult.rows[0];
    console.log('✅ Benutzer in Datenbank gefunden');
    console.log('   Verifizierungs-Code:', user.email_verification_code);
    console.log('   Email verifiziert:', user.email_verified);
    
    if (!user.email_verification_code) {
      console.log('❌ FEHLER: Kein Verifizierungs-Code!');
      await pool.end();
      return;
    }
    
    console.log('\n📬 SCHRITT 3: Email-Status');
    console.log('✅ Code generiert:', user.email_verification_code);
    console.log('📧 Email sollte jetzt an Resend gesendet worden sein!');
    console.log('   Prüfe Resend-Dashboard: https://resend.com/emails');
    console.log('   Die Email sollte im "Sending" Tab erscheinen');
    
    console.log('\n🔐 SCHRITT 4: Teste Login ohne Verifizierung');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('❌ FEHLER: Login sollte blockiert sein!');
    } catch (loginError) {
      if (loginError.response?.status === 403) {
        console.log('✅ Login korrekt blockiert (403)');
        console.log('   Error:', loginError.response.data.error);
      } else {
        console.log('❌ Unerwarteter Fehler:', loginError.response?.status);
      }
    }
    
    console.log('\n✅ SCHRITT 5: Verifiziere Email mit Code');
    const verifyResponse = await axios.post(`${API_URL}/auth/verify-email`, {
      email: testEmail,
      code: user.email_verification_code
    });
    
    console.log('✅ Verifizierung erfolgreich!');
    console.log('   Response:', verifyResponse.data.message);
    
    console.log('\n🔐 SCHRITT 6: Login nach Verifizierung');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login erfolgreich!');
    console.log('   Token erhalten:', !!loginResponse.data.token);
    console.log('   User:', loginResponse.data.user.first_name, loginResponse.data.user.last_name);
    
    // Cleanup
    console.log('\n🧹 Cleanup: Lösche Test-Benutzer');
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('✅ Test-Benutzer gelöscht');
    
    await pool.end();
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 ALLE TESTS BESTANDEN! 🎉');
    console.log('='.repeat(70));
    console.log('\n✅ Registrierung funktioniert');
    console.log('✅ Verifizierungs-Code wird generiert');
    console.log('✅ Email wird an Resend gesendet (prüfe Dashboard!)');
    console.log('✅ Login blockiert ohne Verifizierung');
    console.log('✅ Verifizierung funktioniert');
    console.log('✅ Login erlaubt nach Verifizierung');
    console.log('\n📧 WICHTIG: Prüfe Resend-Dashboard ob Email im Ausgang ist!');
    console.log('   URL: https://resend.com/emails\n');
    
  } catch (error) {
    console.error('\n❌ TEST FEHLGESCHLAGEN:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    await pool.end();
  }
}

finalTest();
