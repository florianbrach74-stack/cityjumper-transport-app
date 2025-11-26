const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteWeirdTable() {
  try {
    console.log('🔍 Checking for weird table...\n');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📊 All tables in database:');
    console.log('─'.repeat(80));
    tablesResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.tablename}`);
    });
    
    // Check if the weird table exists
    const weirdTableName = 'he es komplett fertig sodass es funktionier';
    const checkResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE '%komplett%'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('\n❌ Found weird table:', checkResult.rows[0].tablename);
      console.log('\n🗑️  Deleting weird table...');
      
      // Delete the table
      await pool.query(`DROP TABLE IF EXISTS "${checkResult.rows[0].tablename}" CASCADE`);
      
      console.log('✅ Weird table deleted successfully!');
    } else {
      console.log('\n✅ No weird table found - database is clean!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

deleteWeirdTable();
