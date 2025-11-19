const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-time-window-columns', async (req, res) => {
  try {
    console.log('🔧 Adding time window columns to transport_orders...');

    // Add new time window columns
    await pool.query(`
      ALTER TABLE transport_orders
      ADD COLUMN IF NOT EXISTS pickup_time_from VARCHAR(10),
      ADD COLUMN IF NOT EXISTS pickup_time_to VARCHAR(10),
      ADD COLUMN IF NOT EXISTS delivery_time_from VARCHAR(10),
      ADD COLUMN IF NOT EXISTS delivery_time_to VARCHAR(10)
    `);

    console.log('✅ Time window columns added successfully');

    // Migrate existing data from pickup_time to pickup_time_from
    await pool.query(`
      UPDATE transport_orders
      SET pickup_time_from = pickup_time
      WHERE pickup_time IS NOT NULL AND pickup_time_from IS NULL
    `);

    // Migrate existing data from delivery_time to delivery_time_from
    await pool.query(`
      UPDATE transport_orders
      SET delivery_time_from = delivery_time
      WHERE delivery_time IS NOT NULL AND delivery_time_from IS NULL
    `);

    console.log('✅ Migrated existing time data');

    // Check columns
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'transport_orders'
      AND column_name IN (
        'pickup_time',
        'pickup_time_from',
        'pickup_time_to',
        'delivery_time',
        'delivery_time_from',
        'delivery_time_to'
      )
      ORDER BY column_name
    `);

    res.json({
      success: true,
      message: 'Time window columns added and data migrated successfully',
      columns: columnsCheck.rows
    });

  } catch (error) {
    console.error('❌ Error adding time window columns:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
