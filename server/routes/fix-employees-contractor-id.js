const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

/**
 * Fix existing employees: Set contractor_id from company_id
 * This is needed because employees were created with company_id but not contractor_id
 */
router.post('/fix-employees-contractor-id', adminAuth, async (req, res) => {
  try {
    console.log('🔧 Fixing employees contractor_id...');
    
    // Get all employees without contractor_id
    const employeesWithoutContractor = await pool.query(`
      SELECT id, email, first_name, last_name, company_id, contractor_id
      FROM users
      WHERE role = 'employee' AND contractor_id IS NULL
    `);
    
    console.log(`Found ${employeesWithoutContractor.rows.length} employees without contractor_id`);
    
    if (employeesWithoutContractor.rows.length === 0) {
      return res.json({
        success: true,
        message: 'All employees already have contractor_id',
        fixed: 0
      });
    }
    
    // Update contractor_id from company_id
    const result = await pool.query(`
      UPDATE users
      SET contractor_id = company_id
      WHERE role = 'employee' AND contractor_id IS NULL AND company_id IS NOT NULL
      RETURNING id, email, first_name, last_name, contractor_id
    `);
    
    console.log(`✅ Fixed ${result.rows.length} employees`);
    result.rows.forEach(emp => {
      console.log(`   - ${emp.first_name} ${emp.last_name} (${emp.email}) -> contractor_id: ${emp.contractor_id}`);
    });
    
    res.json({
      success: true,
      message: `Fixed ${result.rows.length} employees`,
      fixed: result.rows.length,
      employees: result.rows
    });
  } catch (error) {
    console.error('❌ Fix employees error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
