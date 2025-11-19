const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-billing-email-column', async (req, res) => {
  try {
    console.log('🔧 Adding billing_email column to users table...');

    // Add billing_email column for separate invoice email address
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255)
    `);

    console.log('✅ billing_email column added successfully');

    // Check column
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'billing_email'
    `);

    res.json({
      success: true,
      message: 'billing_email column added successfully',
      column: columnsCheck.rows[0]
    });

  } catch (error) {
    console.error('❌ Error adding billing_email column:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
