const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-customer-notes-column', async (req, res) => {
  try {
    console.log('🔧 Adding admin_notes column to users table...');

    // Add admin_notes column for internal notes about customers
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS admin_notes TEXT
    `);

    console.log('✅ admin_notes column added successfully');

    // Check column
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'admin_notes'
    `);

    res.json({
      success: true,
      message: 'admin_notes column added successfully',
      column: columnsCheck.rows[0]
    });

  } catch (error) {
    console.error('❌ Error adding admin_notes column:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
