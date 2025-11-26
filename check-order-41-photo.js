const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkOrder41Photo() {
  try {
    console.log('🔍 Checking Order #41 CMR photo...\n');
    
    // Get CMR for order 41
    const cmrResult = await pool.query(
      'SELECT id, order_id, cmr_number, consignee_photo, consignee_signed_at FROM cmr_documents WHERE order_id = 41'
    );
    
    if (cmrResult.rows.length === 0) {
      console.log('❌ No CMR found for order #41');
      await pool.end();
      return;
    }
    
    const cmr = cmrResult.rows[0];
    console.log('📄 CMR found:');
    console.log(`   ID: ${cmr.id}`);
    console.log(`   CMR Number: ${cmr.cmr_number}`);
    console.log(`   Signed at: ${cmr.consignee_signed_at}`);
    console.log(`   Photo exists: ${cmr.consignee_photo ? 'YES' : 'NO'}`);
    
    if (cmr.consignee_photo) {
      const photoLength = cmr.consignee_photo.length;
      const isBase64 = cmr.consignee_photo.startsWith('data:image');
      
      console.log(`\n📸 Photo details:`);
      console.log(`   Length: ${photoLength} characters`);
      console.log(`   Is Base64: ${isBase64 ? 'YES' : 'NO'}`);
      console.log(`   Preview: ${cmr.consignee_photo.substring(0, 100)}...`);
      
      if (!isBase64) {
        console.log('\n❌ PROBLEM: Photo is not in Base64 format!');
        console.log('   Expected format: data:image/jpeg;base64,...');
      } else {
        console.log('\n✅ Photo format is correct');
      }
    } else {
      console.log('\n❌ PROBLEM: No photo saved in database!');
      console.log('   This means the photo was not uploaded or saved correctly.');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkOrder41Photo();
