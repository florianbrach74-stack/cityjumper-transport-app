/**
 * Migration Script: Update pdf_url for completed multi-stop orders
 * 
 * This script:
 * 1. Finds all completed multi-stop CMR groups
 * 2. Generates combined PDF for each group
 * 3. Updates pdf_url in database for all CMRs in the group
 * 
 * Run with: node server/scripts/migrate-multistop-pdfs.js
 */

const pool = require('../config/database');
const MultiStopPdfGenerator = require('../services/multiStopPdfGenerator');

async function migrateMultiStopPdfs() {
  console.log('🚀 Starting Multi-Stop PDF Migration...\n');
  
  try {
    // Find all multi-stop CMR groups where all stops are completed
    const result = await pool.query(`
      SELECT 
        cmr_group_id,
        order_id,
        COUNT(*) as total_cmrs,
        COUNT(CASE WHEN (consignee_signature IS NOT NULL OR delivery_photo_base64 IS NOT NULL OR consignee_photo IS NOT NULL) THEN 1 END) as completed_cmrs
      FROM cmr_documents
      WHERE cmr_group_id IS NOT NULL
      GROUP BY cmr_group_id, order_id
      HAVING COUNT(*) = COUNT(CASE WHEN (consignee_signature IS NOT NULL OR delivery_photo_base64 IS NOT NULL OR consignee_photo IS NOT NULL) THEN 1 END)
      ORDER BY cmr_group_id
    `);
    
    const groups = result.rows;
    console.log(`📊 Found ${groups.length} completed multi-stop orders\n`);
    
    if (groups.length === 0) {
      console.log('✅ No multi-stop orders to migrate');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const group of groups) {
      try {
        console.log(`\n📦 Processing Order ${group.order_id} (Group ${group.cmr_group_id})`);
        console.log(`   Total CMRs: ${group.total_cmrs}, Completed: ${group.completed_cmrs}`);
        
        // Generate combined PDF
        console.log('   🔄 Generating combined PDF...');
        const { filepath, filename } = await MultiStopPdfGenerator.generateCombinedPDF(
          group.order_id,
          group.cmr_group_id
        );
        
        console.log(`   ✅ Combined PDF generated: ${filename}`);
        
        // Update pdf_url for all CMRs in this group
        const pdfUrl = `/uploads/cmr/${filename}`;
        const updateResult = await pool.query(
          `UPDATE cmr_documents 
           SET pdf_url = $1 
           WHERE cmr_group_id = $2
           RETURNING id, cmr_number`,
          [pdfUrl, group.cmr_group_id]
        );
        
        console.log(`   💾 Updated ${updateResult.rows.length} CMRs with pdf_url: ${pdfUrl}`);
        updateResult.rows.forEach(cmr => {
          console.log(`      - CMR ${cmr.cmr_number} (ID: ${cmr.id})`);
        });
        
        successCount++;
        console.log(`   ✅ Order ${group.order_id} migrated successfully`);
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error processing Order ${group.order_id}:`, error.message);
        console.error(`      Stack:`, error.stack);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log(`   Total orders: ${groups.length}`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(60));
    
    if (successCount > 0) {
      console.log('\n🎉 Migration completed! All completed multi-stop orders now have combined PDFs.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error stack:', error.stack);
    throw error;
  } finally {
    // Close database connection
    await pool.end();
    console.log('\n👋 Database connection closed');
  }
}

// Run migration
migrateMultiStopPdfs()
  .then(() => {
    console.log('\n✅ Migration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
