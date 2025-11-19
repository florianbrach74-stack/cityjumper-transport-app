const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/fix-duplicate-emails', async (req, res) => {
  try {
    console.log('🔧 Fixing duplicate email issue for orders #31 and #32...');

    // Mark orders as notified to stop duplicate emails
    // Don't change status - just mark as notified
    const result = await pool.query(`
      UPDATE transport_orders
      SET 
        expired_and_archived = TRUE,
        expiration_notification_sent_at = NOW()
      WHERE id IN (31, 32)
      RETURNING id, status, expired_and_archived, expiration_notification_sent_at
    `);

    console.log('✅ Orders updated:', result.rows);

    res.json({
      success: true,
      message: 'Orders marked as notified - no more duplicate emails',
      updated_orders: result.rows
    });

  } catch (error) {
    console.error('❌ Error fixing duplicate emails:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
