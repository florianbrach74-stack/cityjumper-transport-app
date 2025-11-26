const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function checkRegistration() {
  console.log('🔍 Prüfe Registrierung von Feike GmbH...\n');
  
  try {
    // Suche Benutzer
    const result = await pool.query(`
      SELECT 
        id, email, company_name, phone,
        email_verified, email_verification_code,
        email_verified_at, created_at,
        role
      FROM users 
      WHERE email = 'info@feike-gmbh.de' OR company_name LIKE '%Feike%'
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ Benutzer nicht gefunden');
      await pool.end();
      return;
    }
    
    const user = result.rows[0];
    
    console.log('✅ Benutzer gefunden:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Firma:', user.company_name);
    console.log('   Telefon:', user.phone);
    console.log('   Rolle:', user.role);
    console.log('   Registriert:', user.created_at);
    console.log('   Email verifiziert:', user.email_verified);
    console.log('   Verifizierungs-Code:', user.email_verification_code);
    console.log('   Verifiziert am:', user.email_verified_at);
    
    // Berechne Zeit seit Registrierung
    const now = new Date();
    const registered = new Date(user.created_at);
    const diffMs = now - registered;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    console.log('\n⏰ Zeitpunkt:');
    if (diffHours > 0) {
      console.log('   Vor', diffHours, 'Stunden und', diffMins % 60, 'Minuten');
    } else {
      console.log('   Vor', diffMins, 'Minuten');
    }
    
    // Prüfe ob Email gesendet wurde
    console.log('\n📧 Email-Status:');
    if (user.email_verification_code) {
      console.log('   ✅ Verifizierungs-Code generiert:', user.email_verification_code);
      console.log('   📧 Email sollte versendet worden sein');
      console.log('   ⚠️  Wenn nicht angekommen: Prüfe Resend-Dashboard');
    } else {
      console.log('   ❌ KEIN Verifizierungs-Code generiert!');
      console.log('   ❌ Email wurde NICHT versendet!');
    }
    
    // Setze auf verifiziert
    if (!user.email_verified) {
      console.log('\n🔧 Setze Benutzer auf verifiziert...');
      
      await pool.query(`
        UPDATE users 
        SET email_verified = true,
            email_verified_at = NOW(),
            email_verification_code = NULL,
            email_verification_expires_at = NULL
        WHERE id = $1
      `, [user.id]);
      
      console.log('✅ Benutzer auf verifiziert gesetzt!');
      console.log('   Email-Verifizierung: true');
      console.log('   Verifiziert am:', new Date().toISOString());
      console.log('   Code gelöscht: ja');
    } else {
      console.log('\n✅ Benutzer ist bereits verifiziert');
    }
    
    // Finale Prüfung
    const finalCheck = await pool.query(
      'SELECT email_verified, email_verified_at FROM users WHERE id = $1',
      [user.id]
    );
    
    console.log('\n✅ Finale Prüfung:');
    console.log('   Email verifiziert:', finalCheck.rows[0].email_verified);
    console.log('   Verifiziert am:', finalCheck.rows[0].email_verified_at);
    
    console.log('\n🎉 Fertig! Feike GmbH kann sich jetzt einloggen.\n');
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await pool.end();
  }
}

checkRegistration();
