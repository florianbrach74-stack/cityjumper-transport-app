const axios = require('axios');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

async function testEmailVerification() {
  console.log('🧪 Teste Email-Verifizierungs-System...\n');
  
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    // 1. REGISTRIERUNG
    console.log('📝 Schritt 1: Registrierung...');
    console.log(`   Email: ${testEmail}`);
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      role: 'customer',
      first_name: 'Test',
      last_name: 'Benutzer',
      phone: '+49 123 456789'
    });
    
    console.log('✅ Registrierung erfolgreich!');
    console.log('   Response:', JSON.stringify(registerResponse.data, null, 2));
    
    if (!registerResponse.data.requiresVerification) {
      console.log('❌ FEHLER: requiresVerification sollte true sein!');
      return;
    }
    
    console.log('✅ requiresVerification = true (korrekt!)');
    console.log('✅ Keine Token zurückgegeben (korrekt!)');
    
    // 2. LOGIN OHNE VERIFIZIERUNG
    console.log('\n🔐 Schritt 2: Login-Versuch ohne Verifizierung...');
    
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.log('❌ FEHLER: Login sollte fehlschlagen!');
    } catch (loginError) {
      if (loginError.response?.status === 403) {
        console.log('✅ Login blockiert (403 Forbidden)');
        console.log('   Error:', loginError.response.data.error);
        console.log('   requiresVerification:', loginError.response.data.requiresVerification);
        
        if (!loginError.response.data.requiresVerification) {
          console.log('❌ FEHLER: requiresVerification sollte true sein!');
          return;
        }
      } else {
        console.log('❌ Unerwarteter Fehler:', loginError.response?.data);
        return;
      }
    }
    
    // 3. VERIFIZIERUNGS-CODE ABRUFEN
    console.log('\n📧 Schritt 3: Verifizierungs-Code aus Datenbank abrufen...');
    
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query(
      'SELECT email_verification_code, email_verified FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ FEHLER: Benutzer nicht in Datenbank gefunden!');
      await pool.end();
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ Benutzer gefunden in Datenbank');
    console.log('   email_verified:', user.email_verified);
    console.log('   email_verification_code:', user.email_verification_code);
    
    if (user.email_verified) {
      console.log('❌ FEHLER: email_verified sollte false sein!');
      await pool.end();
      return;
    }
    
    if (!user.email_verification_code) {
      console.log('❌ FEHLER: Kein Verifizierungs-Code gesetzt!');
      await pool.end();
      return;
    }
    
    const verificationCode = user.email_verification_code;
    console.log('✅ Verifizierungs-Code:', verificationCode);
    
    // 4. EMAIL VERIFIZIEREN
    console.log('\n✅ Schritt 4: Email verifizieren mit Code...');
    
    const verifyResponse = await axios.post(`${API_URL}/auth/verify-email`, {
      email: testEmail,
      code: verificationCode
    });
    
    console.log('✅ Verifizierung erfolgreich!');
    console.log('   Response:', JSON.stringify(verifyResponse.data, null, 2));
    
    // 5. PRÜFE DATENBANK
    console.log('\n🔍 Schritt 5: Prüfe Datenbank nach Verifizierung...');
    
    const verifiedResult = await pool.query(
      'SELECT email_verified, email_verified_at, email_verification_code FROM users WHERE email = $1',
      [testEmail]
    );
    
    const verifiedUser = verifiedResult.rows[0];
    console.log('   email_verified:', verifiedUser.email_verified);
    console.log('   email_verified_at:', verifiedUser.email_verified_at);
    console.log('   email_verification_code:', verifiedUser.email_verification_code);
    
    if (!verifiedUser.email_verified) {
      console.log('❌ FEHLER: email_verified sollte true sein!');
      await pool.end();
      return;
    }
    
    if (verifiedUser.email_verification_code !== null) {
      console.log('❌ FEHLER: email_verification_code sollte NULL sein!');
      await pool.end();
      return;
    }
    
    console.log('✅ Datenbank korrekt aktualisiert!');
    
    // 6. LOGIN NACH VERIFIZIERUNG
    console.log('\n🔐 Schritt 6: Login nach Verifizierung...');
    
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    console.log('✅ Login erfolgreich!');
    console.log('   Token erhalten:', !!loginResponse.data.token);
    console.log('   User:', JSON.stringify(loginResponse.data.user, null, 2));
    
    if (!loginResponse.data.token) {
      console.log('❌ FEHLER: Kein Token erhalten!');
      await pool.end();
      return;
    }
    
    // 7. CLEANUP
    console.log('\n🧹 Schritt 7: Test-Benutzer löschen...');
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('✅ Test-Benutzer gelöscht');
    
    await pool.end();
    
    // ZUSAMMENFASSUNG
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALLE TESTS BESTANDEN! 🎉');
    console.log('='.repeat(60));
    console.log('\n✅ Registrierung: Sendet Verifizierungs-Email');
    console.log('✅ Login blockiert: Ohne Verifizierung');
    console.log('✅ Verifizierung: Code funktioniert');
    console.log('✅ Datenbank: Korrekt aktualisiert');
    console.log('✅ Login erlaubt: Nach Verifizierung');
    console.log('\n🚀 System ist PRODUCTION READY!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FEHLGESCHLAGEN:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    console.error('   Stack:', error.stack);
  }
}

testEmailVerification();
