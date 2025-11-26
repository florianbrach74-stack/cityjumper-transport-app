const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🔄 Starte Cleanup-Tracking Migration...\n');
  
  try {
    // Migration ausführen
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS cleaned_up BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS cleaned_up_at TIMESTAMP;
    `);
    
    console.log('✅ Spalten hinzugefügt');
    
    // Kommentare hinzufügen
    await pool.query(`
      COMMENT ON COLUMN transport_orders.cleaned_up IS 'Wurde dieser Auftrag bereinigt (CMR/sensible Daten gelöscht)?';
      COMMENT ON COLUMN transport_orders.cleaned_up_at IS 'Zeitpunkt der Bereinigung';
    `);
    
    console.log('✅ Kommentare hinzugefügt');
    
    // Index erstellen
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_cleaned_up ON transport_orders(cleaned_up, completed_at);
    `);
    
    console.log('✅ Index erstellt');
    
    // Verifizierung
    console.log('\n🔍 Verifiziere Migration...\n');
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'transport_orders' 
        AND column_name LIKE 'cleaned_%'
      ORDER BY column_name;
    `);
    
    console.log('Gefundene Spalten:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) = ${row.column_default}`);
    });
    
    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    console.log('🎉 Cleanup-Tracking ist jetzt aktiv.\n');
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
