const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:nGCISPuECUIqXIjjZECppXBknnJnFYFS@ballast.proxy.rlwy.net:10003/railway',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🔄 Starte Datenbank-Migration für Retouren-System...\n');
  
  try {
    // Migration ausführen
    await pool.query(`
      -- Migration: Retouren-System
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS return_status VARCHAR(50) DEFAULT 'none' 
        CHECK (return_status IN ('none', 'pending', 'in_progress', 'completed')),
      ADD COLUMN IF NOT EXISTS return_fee DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS return_reason TEXT,
      ADD COLUMN IF NOT EXISTS return_initiated_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS return_initiated_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS return_completed_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS return_notes TEXT;
    `);
    
    console.log('✅ Spalten hinzugefügt');
    
    // Kommentare hinzufügen
    await pool.query(`
      COMMENT ON COLUMN transport_orders.return_status IS 'Status der Retoure: none, pending, in_progress, completed';
      COMMENT ON COLUMN transport_orders.return_fee IS 'Retourengebühr (max. Auftragswert)';
      COMMENT ON COLUMN transport_orders.return_reason IS 'Grund für die Retoure';
      COMMENT ON COLUMN transport_orders.return_initiated_by IS 'Admin der die Retoure gestartet hat';
      COMMENT ON COLUMN transport_orders.return_notes IS 'Zusätzliche Notizen zur Retoure';
    `);
    
    console.log('✅ Kommentare hinzugefügt');
    
    // Index erstellen
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_return_status ON transport_orders(return_status);
    `);
    
    console.log('✅ Index erstellt');
    
    // Verifizierung
    console.log('\n🔍 Verifiziere Migration...\n');
    const result = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'transport_orders' 
        AND column_name LIKE 'return_%'
      ORDER BY column_name;
    `);
    
    console.log('Gefundene Spalten:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    console.log('🎉 Die Retouren-Funktion ist jetzt verfügbar.\n');
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
