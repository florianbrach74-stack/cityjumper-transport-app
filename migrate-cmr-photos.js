const { Pool } = require('pg');

// Railway Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    console.log('🔄 Verbinde mit Datenbank...');
    
    const client = await pool.connect();
    console.log('✅ Verbunden!');
    
    console.log('🔄 Führe Migration aus...');
    
    await client.query(`
      ALTER TABLE cmr_documents 
      ADD COLUMN IF NOT EXISTS consignee_signed_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS consignee_photo TEXT,
      ADD COLUMN IF NOT EXISTS sender_photo TEXT,
      ADD COLUMN IF NOT EXISTS carrier_photo TEXT;
    `);
    
    console.log('✅ Migration erfolgreich!');
    
    // Überprüfe ob Felder existieren
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cmr_documents' 
      AND column_name IN ('consignee_signed_name', 'consignee_photo', 'sender_photo', 'carrier_photo');
    `);
    
    console.log('\n📋 Neue Felder:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name} (${row.data_type})`);
    });
    
    client.release();
    await pool.end();
    
    console.log('\n🎉 Fertig! Die Datenbank ist bereit für Foto-Upload!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    process.exit(1);
  }
}

runMigration();
