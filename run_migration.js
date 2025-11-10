// Run this with: railway run node run_migration.js
const { Pool } = require('pg');

// Use DATABASE_URL from Railway environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found. Run with: railway run node run_migration.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('🔧 Adding contractor_id column...\n');
    
    // Add contractor_id column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES users(id);
    `);
    console.log('✅ contractor_id column added');
    
    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_contractor_id ON users(contractor_id);
    `);
    console.log('✅ Index created\n');
    
    // Show employees
    console.log('📋 Employees:');
    const employees = await pool.query(`
      SELECT id, first_name, last_name, email, contractor_id
      FROM users
      WHERE role = 'employee'
      ORDER BY created_at DESC
    `);
    
    employees.rows.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name} (ID: ${emp.id}, contractor_id: ${emp.contractor_id || 'NULL'})`);
    });
    
    // Show contractors
    console.log('\n📋 Contractors:');
    const contractors = await pool.query(`
      SELECT id, first_name, last_name, email, company_name
      FROM users
      WHERE role = 'contractor'
      ORDER BY created_at DESC
    `);
    
    contractors.rows.forEach(con => {
      console.log(`  - ${con.first_name} ${con.last_name} (ID: ${con.id}, Company: ${con.company_name || 'N/A'})`);
    });
    
    // Auto-assign employees to first contractor if needed
    if (employees.rows.some(e => !e.contractor_id) && contractors.rows.length > 0) {
      console.log('\n🔧 Auto-assigning employees to first contractor...');
      const contractorId = contractors.rows[0].id;
      
      const result = await pool.query(`
        UPDATE users 
        SET contractor_id = $1 
        WHERE role = 'employee' AND contractor_id IS NULL
        RETURNING id, first_name, last_name
      `, [contractorId]);
      
      result.rows.forEach(emp => {
        console.log(`  ✅ ${emp.first_name} ${emp.last_name} → contractor_id: ${contractorId}`);
      });
      
      console.log('\n✅ All employees now have a contractor_id!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
