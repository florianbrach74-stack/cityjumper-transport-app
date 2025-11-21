const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-invoice-tracking-columns', async (req, res) => {
  try {
    console.log('🔧 Adding invoice tracking columns...');

    // Add reminder tracking columns
    await pool.query(`
      ALTER TABLE sent_invoices
      ADD COLUMN IF NOT EXISTS last_reminder_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_notes TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    console.log('✅ Invoice tracking columns added successfully');

    // Check columns
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'sent_invoices'
      AND column_name IN ('last_reminder_sent_at', 'reminder_count', 'payment_notes', 'updated_at')
      ORDER BY column_name
    `);

    res.json({
      success: true,
      message: 'Invoice tracking columns added successfully',
      columns: columnsCheck.rows
    });

  } catch (error) {
    console.error('❌ Error adding invoice tracking columns:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
