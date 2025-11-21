const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-dual-role-support', async (req, res) => {
  try {
    console.log('🔧 Adding dual-role support...');

    // Add roles array column (for multiple roles)
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS roles TEXT[]
    `);

    // Add current_role column (active role)
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS current_role VARCHAR(50)
    `);

    // Update existing users: Set roles array from role column
    await pool.query(`
      UPDATE users 
      SET roles = ARRAY[role]::TEXT[]
      WHERE roles IS NULL OR array_length(roles, 1) IS NULL
    `);

    // Update current_role to match role
    await pool.query(`
      UPDATE users 
      SET current_role = role
      WHERE current_role IS NULL
    `);

    // Give all contractors the customer role as well
    await pool.query(`
      UPDATE users 
      SET roles = ARRAY['contractor', 'customer']::TEXT[]
      WHERE role = 'contractor'
      AND NOT ('customer' = ANY(roles))
    `);

    console.log('✅ Dual-role support added');

    // Get statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE 'contractor' = ANY(roles) AND 'customer' = ANY(roles)) as dual_role_users,
        COUNT(*) FILTER (WHERE role = 'contractor') as contractors,
        COUNT(*) FILTER (WHERE role = 'customer') as customers
      FROM users
    `);

    res.json({
      success: true,
      message: 'Dual-role support added successfully',
      stats: stats.rows[0]
    });

  } catch (error) {
    console.error('❌ Error adding dual-role support:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
