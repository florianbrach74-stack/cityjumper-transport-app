const pool = require('../config/database');
const cron = require('node-cron');

/**
 * Order Cleanup Service
 * Löscht Aufträge die älter als 3 Monate sind (nach Abschluss)
 * Behält nur die Rechnungsdaten
 */

async function cleanupOldOrders() {
  console.log('\n🧹 [Order Cleanup] Starte Bereinigung alter Aufträge...');
  
  try {
    // Berechne Datum: 3 Monate zurück
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    console.log(`📅 Lösche Aufträge abgeschlossen vor: ${threeMonthsAgo.toISOString().split('T')[0]}`);
    
    // 1. Finde Aufträge die gelöscht werden sollen
    const ordersToDelete = await pool.query(`
      SELECT id, customer_id, contractor_id, invoice_number, 
             completed_at, cancellation_timestamp,
             COALESCE(completed_at, cancellation_timestamp) as finish_date
      FROM transport_orders
      WHERE (status = 'completed' OR (cancellation_status IS NOT NULL AND status != 'pending'))
        AND COALESCE(completed_at, cancellation_timestamp) < $1
        AND COALESCE(completed_at, cancellation_timestamp) IS NOT NULL
    `, [threeMonthsAgo]);
    
    if (ordersToDelete.rows.length === 0) {
      console.log('✅ Keine alten Aufträge zum Löschen gefunden.');
      return { deleted: 0, kept: 0 };
    }
    
    console.log(`📦 Gefunden: ${ordersToDelete.rows.length} Aufträge zum Löschen`);
    
    let deletedCount = 0;
    let keptCount = 0;
    let cmrDeletedCount = 0;
    
    for (const order of ordersToDelete.rows) {
      try {
        // 2. Prüfe ob Rechnung existiert
        const hasInvoice = order.invoice_number !== null;
        
        if (hasInvoice) {
          console.log(`  📄 Auftrag #${order.id} hat Rechnung ${order.invoice_number} - wird behalten`);
          keptCount++;
          
          // Lösche nur CMR und sensible Daten, behalte Rechnung
          await pool.query(`
            UPDATE transport_orders
            SET 
              -- Lösche CMR-Daten
              cmr_signature = NULL,
              cmr_signature_name = NULL,
              cmr_signed_at = NULL,
              cmr_pdf_path = NULL,
              
              -- Lösche sensible Adressdaten (behalte nur Städte für Statistik)
              pickup_address = NULL,
              pickup_contact_name = NULL,
              pickup_contact_phone = NULL,
              delivery_address = NULL,
              delivery_contact_name = NULL,
              delivery_contact_phone = NULL,
              
              -- Lösche Beschreibung und Anforderungen
              description = NULL,
              special_requirements = NULL,
              
              -- Lösche Notizen
              waiting_time_notes = NULL,
              pickup_waiting_notes = NULL,
              delivery_waiting_notes = NULL,
              return_notes = NULL,
              cancellation_reason = NULL,
              
              -- Markiere als bereinigt
              cleaned_up = true,
              cleaned_up_at = NOW()
            WHERE id = $1
          `, [order.id]);
          
          cmrDeletedCount++;
          console.log(`    ✅ CMR und sensible Daten gelöscht, Rechnung behalten`);
        } else {
          // 3. Keine Rechnung -> Auftrag komplett löschen
          console.log(`  🗑️  Auftrag #${order.id} hat keine Rechnung - wird komplett gelöscht`);
          
          await pool.query('DELETE FROM transport_orders WHERE id = $1', [order.id]);
          deletedCount++;
          console.log(`    ✅ Auftrag komplett gelöscht`);
        }
      } catch (error) {
        console.error(`  ❌ Fehler bei Auftrag #${order.id}:`, error.message);
      }
    }
    
    console.log('\n📊 Cleanup-Zusammenfassung:');
    console.log(`  🗑️  Komplett gelöscht: ${deletedCount} Aufträge`);
    console.log(`  📄 Rechnung behalten: ${keptCount} Aufträge`);
    console.log(`  🧹 CMR gelöscht: ${cmrDeletedCount} Dokumente`);
    console.log('✅ [Order Cleanup] Bereinigung abgeschlossen\n');
    
    return {
      deleted: deletedCount,
      kept: keptCount,
      cmrDeleted: cmrDeletedCount
    };
    
  } catch (error) {
    console.error('❌ [Order Cleanup] Fehler:', error);
    throw error;
  }
}

/**
 * Manuelle Bereinigung (für Tests)
 */
async function cleanupOldOrdersManual() {
  console.log('🔧 Manuelle Bereinigung gestartet...');
  return await cleanupOldOrders();
}

/**
 * Starte automatische Bereinigung
 * Läuft jeden Tag um 3:00 Uhr morgens
 */
function startOrderCleanupService() {
  console.log('🧹 [Order Cleanup] Service gestartet - läuft täglich um 3:00 Uhr');
  
  // Cronjob: Jeden Tag um 3:00 Uhr
  cron.schedule('0 3 * * *', async () => {
    console.log('\n⏰ [Order Cleanup] Geplante Bereinigung gestartet...');
    try {
      await cleanupOldOrders();
    } catch (error) {
      console.error('❌ [Order Cleanup] Fehler bei geplanter Bereinigung:', error);
    }
  });
  
  console.log('✅ [Order Cleanup] Service bereit');
}

module.exports = {
  startOrderCleanupService,
  cleanupOldOrders,
  cleanupOldOrdersManual
};
