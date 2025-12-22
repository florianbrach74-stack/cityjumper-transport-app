const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { validatePassword } = require('../utils/passwordValidator');

// Get all employees for a contractor
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can view employees' });
    }

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, created_at 
       FROM users 
       WHERE company_id = $1 AND role = 'employee'
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ employees: result.rows });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new employee
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can create employees' });
    }

    const { email, password, first_name, last_name, phone } = req.body;

    // Validate required fields
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Passwort ist nicht sicher genug',
        details: passwordValidation.errors 
      });
    }

    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get contractor's company name
    const contractor = await pool.query('SELECT company_name FROM users WHERE id = $1', [req.user.id]);

    // Create employee
    const result = await pool.query(
      `INSERT INTO users (email, password, role, company_id, contractor_id, company_name, first_name, last_name, phone)
       VALUES ($1, $2, 'employee', $3, $3, $4, $5, $6, $7)
       RETURNING id, email, first_name, last_name, phone, created_at`,
      [email, hashedPassword, req.user.id, contractor.rows[0].company_name, first_name, last_name, phone]
    );

    res.status(201).json({ 
      message: 'Employee created successfully',
      employee: result.rows[0] 
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete employee
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can delete employees' });
    }

    const { id } = req.params;

    // Verify employee belongs to this contractor
    const employee = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2 AND role = $3',
      [id, req.user.id, 'employee']
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
