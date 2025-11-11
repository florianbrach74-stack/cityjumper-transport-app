const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Run migration endpoint - NO AUTH REQUIRED for emergency fixes
router.post('/run-migration/contractor-id', async (req, res) => {
  try {
    console.log('🔧 Running contractor_id migration...');
    
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
    console.log('✅ Index created');
    
    // Get contractors
    const contractors = await pool.query(`
      SELECT id, first_name, last_name FROM users WHERE role = 'contractor' ORDER BY created_at ASC LIMIT 1
    `);
    
    if (contractors.rows.length === 0) {
      return res.json({ success: false, error: 'No contractors found' });
    }
    
    const contractorId = contractors.rows[0].id;
    console.log(`✅ Found contractor: ${contractors.rows[0].first_name} ${contractors.rows[0].last_name} (ID: ${contractorId})`);
    
    // Update all employees
    const result = await pool.query(`
      UPDATE users 
      SET contractor_id = $1 
      WHERE role = 'employee' AND contractor_id IS NULL
      RETURNING id, first_name, last_name
    `, [contractorId]);
    
    console.log(`✅ Updated ${result.rows.length} employees`);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      contractorId: contractorId,
      contractorName: `${contractors.rows[0].first_name} ${contractors.rows[0].last_name}`,
      updatedEmployees: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Migration may have already been applied'
    });
  }
});

// Fix employee role
router.post('/run-migration/fix-employee-role', async (req, res) => {
  try {
    console.log('🔧 Fixing employee role...');
    
    // Check current role
    const before = await pool.query(`
      SELECT id, first_name, last_name, email, role, contractor_id 
      FROM users 
      WHERE email = 'luci.flader@gmx.de'
    `);
    
    console.log('Before:', before.rows[0]);
    
    // Update role to employee
    const result = await pool.query(`
      UPDATE users 
      SET role = 'employee'
      WHERE email = 'luci.flader@gmx.de' AND role != 'employee'
      RETURNING id, first_name, last_name, email, role, contractor_id
    `);
    
    // Check after
    const after = await pool.query(`
      SELECT id, first_name, last_name, email, role, contractor_id 
      FROM users 
      WHERE email = 'luci.flader@gmx.de'
    `);
    
    console.log('After:', after.rows[0]);
    console.log('✅ Role fixed!');
    
    res.json({
      success: true,
      message: 'Employee role fixed',
      before: before.rows[0],
      after: after.rows[0],
      updated: result.rowCount > 0
    });
    
  } catch (error) {
    console.error('❌ Fix employee role error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

module.exports = router;
