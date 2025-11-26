const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Check users table
    console.log('📊 USERS TABLE:');
    console.log('─'.repeat(80));
    const usersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    usersColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${def}`);
    });
    
    // Check transport_orders table
    console.log('\n📦 TRANSPORT_ORDERS TABLE:');
    console.log('─'.repeat(80));
    const ordersColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'transport_orders'
      ORDER BY ordinal_position
    `);
    ordersColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(required)';
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${def}`);
    });
    
    // Check for missing critical columns
    console.log('\n🔍 Checking for critical columns...\n');
    
    const criticalUserColumns = ['email_verified', 'email_verification_code', 'company_id'];
    const criticalOrderColumns = ['cancellation_status', 'cancelled_by', 'available_budget'];
    
    const userCols = usersColumns.rows.map(c => c.column_name);
    const orderCols = ordersColumns.rows.map(c => c.column_name);
    
    console.log('Users table:');
    criticalUserColumns.forEach(col => {
      const exists = userCols.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });
    
    console.log('\nTransport_orders table:');
    criticalOrderColumns.forEach(col => {
      const exists = orderCols.includes(col);
      console.log(`  ${exists ? '✅' : '❌'} ${col}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
