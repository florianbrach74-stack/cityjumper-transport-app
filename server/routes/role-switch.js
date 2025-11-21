const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

/**
 * GET /api/user/available-roles
 * Get available roles for current user
 */
router.get('/available-roles', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT roles, "current_role", role FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const availableRoles = user.roles || [user.role];

    res.json({
      success: true,
      availableRoles,
      currentRole: user.current_role || user.role,
      canSwitch: availableRoles.length > 1
    });

  } catch (error) {
    console.error('Error fetching available roles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/user/switch-role
 * Switch to a different role
 */
router.post('/switch-role', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({ error: 'Target role is required' });
    }

    // Get user's available roles
    const userResult = await pool.query(
      'SELECT roles, role, email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const availableRoles = user.roles || [user.role];

    // Check if user has access to target role
    if (!availableRoles.includes(targetRole)) {
      return res.status(403).json({ 
        error: 'You do not have access to this role',
        availableRoles 
      });
    }

    // Update current_role
    await pool.query(
      'UPDATE users SET "current_role" = $1 WHERE id = $2',
      [targetRole, userId]
    );

    // Generate new JWT with updated role
    const token = jwt.sign(
      { 
        id: userId, 
        email: user.email,
        role: targetRole,
        firstName: user.first_name,
        lastName: user.last_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Switched to ${targetRole} role`,
      token,
      role: targetRole,
      user: {
        id: userId,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: targetRole,
        availableRoles
      }
    });

  } catch (error) {
    console.error('Error switching role:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
