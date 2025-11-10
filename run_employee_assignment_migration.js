const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use DATABASE_PUBLIC_URL for Railway external connections
const connectionString = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Running Employee Assignment Migration...\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'add_employee_assignment.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing SQL...');
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify changes
    console.log('🔍 Verifying changes...\n');
    
    // Check if column exists in users table
    const usersCheck = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'employee_assignment_mode'
    `);
    
    if (usersCheck.rows.length > 0) {
      console.log('✅ users.employee_assignment_mode column added');
      console.log('   Type:', usersCheck.rows[0].data_type);
      console.log('   Default:', usersCheck.rows[0].column_default);
    } else {
      console.log('❌ users.employee_assignment_mode column NOT found');
    }
    
    // Check if column exists in transport_orders table
    const ordersCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'transport_orders' AND column_name = 'assigned_employee_id'
    `);
    
    if (ordersCheck.rows.length > 0) {
      console.log('✅ transport_orders.assigned_employee_id column added');
      console.log('   Type:', ordersCheck.rows[0].data_type);
    } else {
      console.log('❌ transport_orders.assigned_employee_id column NOT found');
    }
    
    // Check index
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'transport_orders' AND indexname = 'idx_orders_assigned_employee'
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log('✅ Index idx_orders_assigned_employee created');
    } else {
      console.log('❌ Index idx_orders_assigned_employee NOT found');
    }
    
    console.log('\n🎉 Migration verification complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
