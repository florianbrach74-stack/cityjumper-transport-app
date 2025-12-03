const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running original_customer_price migration...');
  
  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add_original_customer_price.sql'),
      'utf8'
    );
    
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
    
    // Check orders with available_budget
    const ordersResult = await pool.query(`
      SELECT id, price, original_customer_price, available_budget
      FROM transport_orders
      WHERE available_budget IS NOT NULL
      LIMIT 5
    `);
    
    console.log('📦 Sample orders with available_budget:');
    ordersResult.rows.forEach(order => {
      console.log(`   Order #${order.id}: price=${order.price}, original=${order.original_customer_price}, budget=${order.available_budget}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
