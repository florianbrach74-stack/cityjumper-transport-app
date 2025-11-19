const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-order-monitoring-columns', async (req, res) => {
  try {
    console.log('🔧 Adding order monitoring columns...');

    // Add columns for automatic monitoring
    await pool.query(`
      ALTER TABLE transport_orders
      ADD COLUMN IF NOT EXISTS pickup_window_start_notified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS pickup_window_start_notification_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS expired_and_archived BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS expiration_notification_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS archive_reason TEXT
    `);

    console.log('✅ Order monitoring columns added successfully');

    // Check columns
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'transport_orders'
      AND column_name IN (
        'pickup_window_start_notified',
        'pickup_window_start_notification_sent_at',
        'expired_and_archived',
        'expiration_notification_sent_at',
        'archived_at',
        'archive_reason'
      )
      ORDER BY column_name
    `);

    res.json({
      success: true,
      message: 'Order monitoring columns added successfully',
      columns: columnsCheck.rows
    });

  } catch (error) {
    console.error('❌ Error adding monitoring columns:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
