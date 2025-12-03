const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running original_customer_price migration on Railway...');
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment!');
    process.exit(1);
  }
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_original_customer_price.sql'),
      'utf8'
    );
    
    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Checking results...');
    
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
        AND column_name = 'original_customer_price'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Column original_customer_price exists:', checkResult.rows[0]);
    } else {
      console.log('❌ Column not found!');
    }
    
    // Check order #101
    const order101 = await pool.query(`
      SELECT id, price, original_customer_price, available_budget
      FROM transport_orders
      WHERE id = 101
    `);
    
    if (order101.rows.length > 0) {
      console.log('📦 Order #101:');
      console.log('   price:', order101.rows[0].price);
      console.log('   original_customer_price:', order101.rows[0].original_customer_price);
      console.log('   available_budget:', order101.rows[0].available_budget);
    }
    
    await pool.end();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
