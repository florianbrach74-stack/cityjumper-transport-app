const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🔄 Starte Email-Verifizierungs-Migration...\n');
  
  try {
    // Spalten hinzufügen
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(6),
      ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
    `);
    console.log('✅ Spalten hinzugefügt');
    
    // Kommentare
    await pool.query(`
      COMMENT ON COLUMN users.phone IS 'Telefonnummer (Pflichtfeld für neue Registrierungen)';
      COMMENT ON COLUMN users.email_verified IS 'Wurde die Email-Adresse verifiziert?';
      COMMENT ON COLUMN users.email_verification_code IS '6-stelliger Verifizierungs-Code';
      COMMENT ON COLUMN users.email_verification_expires_at IS 'Ablaufzeit des Verifizierungs-Codes (15 Minuten)';
      COMMENT ON COLUMN users.email_verified_at IS 'Zeitpunkt der Email-Verifizierung';
    `);
    console.log('✅ Kommentare hinzugefügt');
    
    // Indizes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
      CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(email_verification_code);
    `);
    console.log('✅ Indizes erstellt');
    
    // Bestehende Benutzer als verifiziert markieren
    const result = await pool.query(`
      UPDATE users 
      SET email_verified = true, 
          email_verified_at = created_at 
      WHERE email_verified IS NULL OR email_verified = false
      RETURNING id;
    `);
    console.log(`✅ ${result.rowCount} bestehende Benutzer als verifiziert markiert`);
    
    // Verifizierung
    console.log('\n🔍 Verifiziere Migration...\n');
    const verify = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' 
        AND column_name LIKE '%verif%'
      ORDER BY column_name;
    `);
    
    console.log('Gefundene Spalten:');
    verify.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    console.log('🎉 Email-Verifizierung ist jetzt aktiv.\n');
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
