const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Update admin notes for a customer
 * Only admins can update notes
 */
router.put('/customers/:userId/notes', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { admin_notes } = req.body;

    console.log(`📝 Updating admin notes for user #${userId}`);

    const result = await pool.query(
      `UPDATE users 
       SET admin_notes = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'customer'
       RETURNING id, email, first_name, last_name, admin_notes`,
      [admin_notes, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    console.log(`✅ Admin notes updated for user #${userId}`);

    res.json({
      success: true,
      message: 'Admin notes updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error updating admin notes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get customer with admin notes
 * Only admins can view notes
 */
router.get('/customers/:userId', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT id, email, first_name, last_name, company_name, phone, 
              admin_notes, created_at, updated_at
       FROM users 
       WHERE id = $1 AND role = 'customer'`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
