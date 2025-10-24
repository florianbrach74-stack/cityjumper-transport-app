const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Make a user admin by email
router.post('/make-admin', async (req, res) => {
  try {
    const { email, secret } = req.body;
    
    // Simple security: require a secret key
    if (secret !== process.env.ADMIN_SETUP_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    // Update user role to admin
    const result = await pool.query(
      `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, email, role, first_name, last_name`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ User ${email} is now an admin`);
    res.json({ 
      success: true, 
      message: 'User is now an admin',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Make admin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all admins
router.get('/list-admins', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC`
    );
    
    res.json({ 
      success: true, 
      admins: result.rows 
    });
  } catch (error) {
    console.error('❌ List admins error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
