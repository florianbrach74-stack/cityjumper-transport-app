const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/create-price-history-table', async (req, res) => {
  try {
    console.log('🔧 Creating order_price_history table...');

    // Create price history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_price_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES transport_orders(id) ON DELETE CASCADE,
        old_price NUMERIC(10,2) NOT NULL,
        new_price NUMERIC(10,2) NOT NULL,
        changed_by_user_id INTEGER REFERENCES users(id),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ order_price_history table created');

    // Add 'expired' status to transport_orders if not exists
    await pool.query(`
      DO $$ 
      BEGIN
        -- This will add 'expired' as a valid status
        -- PostgreSQL doesn't have ALTER TYPE ADD VALUE IF NOT EXISTS
        -- So we just try to add it and ignore if it already exists
        BEGIN
          ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'expired';
        EXCEPTION
          WHEN duplicate_object THEN null;
        END;
      END $$;
    `);

    console.log('✅ Added "expired" status to order_status enum');

    // Check table structure
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'order_price_history'
      ORDER BY ordinal_position
    `);

    res.json({
      success: true,
      message: 'Price history table created successfully',
      columns: tableCheck.rows
    });

  } catch (error) {
    console.error('❌ Error creating price history table:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
