const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Debug endpoint to check and fix employee contractor_id
router.get('/debug/employees', async (req, res) => {
  try {
    // Get all employees
    const employees = await pool.query(`
      SELECT id, first_name, last_name, email, contractor_id, role
      FROM users
      WHERE role = 'employee'
      ORDER BY created_at DESC
    `);
    
    // Get all contractors
    const contractors = await pool.query(`
      SELECT id, first_name, last_name, email, company_name, role
      FROM users
      WHERE role = 'contractor'
      ORDER BY created_at DESC
    `);
    
    // Find employees without contractor_id
    const orphanEmployees = employees.rows.filter(e => !e.contractor_id);
    
    res.json({
      employees: employees.rows,
      contractors: contractors.rows,
      orphanEmployees: orphanEmployees,
      summary: {
        totalEmployees: employees.rows.length,
        totalContractors: contractors.rows.length,
        employeesWithoutContractor: orphanEmployees.length
      }
    });
  } catch (error) {
    console.error('Debug employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix endpoint to assign employees to first contractor
router.post('/debug/fix-employees', async (req, res) => {
  try {
    // Get first contractor
    const contractors = await pool.query(`
      SELECT id FROM users WHERE role = 'contractor' ORDER BY created_at ASC LIMIT 1
    `);
    
    if (contractors.rows.length === 0) {
      return res.status(400).json({ error: 'No contractors found' });
    }
    
    const contractorId = contractors.rows[0].id;
    
    // Update all employees without contractor_id
    const result = await pool.query(`
      UPDATE users 
      SET contractor_id = $1 
      WHERE role = 'employee' AND contractor_id IS NULL
      RETURNING id, first_name, last_name
    `, [contractorId]);
    
    res.json({
      success: true,
      contractorId: contractorId,
      updatedEmployees: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Fix employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
