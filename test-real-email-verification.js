const axios = require('axios');

const API_URL = 'https://cityjumper-api-production-01e4.up.railway.app/api';

async function testRealEmailVerification() {
  console.log('🧪 Teste Email-Verifizierung mit echter Email...\n');
  
  // WICHTIG: Verwende eine ECHTE Email-Adresse die du kontrollierst!
  const testEmail = 'florianbrach74@gmail.com'; // Ändere dies zu deiner Email!
  const testPassword = 'TestPassword123!';
  
  console.log('⚠️  WICHTIG: Dieser Test sendet eine echte Email an:', testEmail);
  console.log('   Bitte prüfe dein Email-Postfach nach der Registrierung!\n');
  
  try {
    // REGISTRIERUNG
    console.log('📝 Starte Registrierung...');
    
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: testPassword,
      role: 'customer',
      first_name: 'Test',
      last_name: 'Verifizierung',
      phone: '+49 123 456789'
    });
    
    console.log('✅ Registrierung erfolgreich!');
    console.log('   requiresVerification:', registerResponse.data.requiresVerification);
    console.log('   Email:', registerResponse.data.email);
    
    console.log('\n📧 Eine Verifizierungs-Email sollte jetzt an', testEmail, 'gesendet worden sein!');
    console.log('   Bitte prüfe dein Postfach (auch Spam-Ordner)');
    console.log('   Die Email enthält einen 6-stelligen Code\n');
    
    // Zeige auch den Code aus der Datenbank (für Backup)
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
      ssl: { rejectUnauthorized: false }
    });
    
    const result = await pool.query(
      'SELECT email_verification_code FROM users WHERE email = $1',
      [testEmail]
    );
    
    if (result.rows.length > 0) {
      console.log('🔑 Backup: Code aus Datenbank:', result.rows[0].email_verification_code);
      console.log('   (Falls die Email nicht ankommt, kannst du diesen Code verwenden)\n');
    }
    
    await pool.end();
    
    console.log('✅ Test abgeschlossen!');
    console.log('📧 Bitte prüfe jetzt dein Email-Postfach und verifiziere die Email.');
    console.log('   Dann kannst du dich mit diesen Credentials einloggen:');
    console.log('   Email:', testEmail);
    console.log('   Passwort:', testPassword);
    
  } catch (error) {
    console.error('\n❌ TEST FEHLGESCHLAGEN:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRealEmailVerification();
