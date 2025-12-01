const pool = require('../config/database');

async function checkColumn() {
  try {
    console.log('🔍 Checking for email_verification_token column...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_verification_token'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Column EXISTS!');
      console.log('   Column details:', result.rows[0]);
    } else {
      console.log('❌ Column DOES NOT exist!');
    }
    
    // Zeige alle verification-bezogenen Spalten
    console.log('\n📋 All verification-related columns:');
    const allCols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%verif%'
      ORDER BY column_name
    `);
    
    allCols.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkColumn();
