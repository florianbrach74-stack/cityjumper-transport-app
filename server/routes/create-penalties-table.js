const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/create-penalties-table', async (req, res) => {
  try {
    console.log('🔧 Creating contractor_penalties table...');
    
    // Create penalties table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contractor_penalties (
        id SERIAL PRIMARY KEY,
        contractor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER REFERENCES transport_orders(id) ON DELETE CASCADE,
        penalty_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        reason TEXT,
        cancellation_type VARCHAR(50) DEFAULT 'paid', -- 'paid' or 'free' (force majeure)
        status VARCHAR(50) DEFAULT 'pending', -- pending, paid, waived, deducted
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        deducted_from_order_id INTEGER REFERENCES transport_orders(id),
        notes TEXT,
        admin_notes TEXT
      )
    `);
    
    console.log('✅ contractor_penalties table created');
    
    // Check if table exists and get structure
    const tableCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'contractor_penalties'
      ORDER BY ordinal_position
    `);
    
    res.json({
      success: true,
      message: 'Penalties table created successfully',
      columns: tableCheck.rows
    });
    
  } catch (error) {
    console.error('❌ Error creating penalties table:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
