const express = require('express');
const router = express.Router();
const pool = require('../config/database');

/**
 * Debug endpoint to see what orders the monitoring would find
 */
router.get('/debug-monitoring', async (req, res) => {
  try {
    console.log('🔍 Debug: Checking monitoring queries...');
    
    const now = new Date();
    const nowISO = now.toISOString();
    
    // Query 1: Orders where pickup window started
    const query1 = `
      SELECT 
        o.id,
        o.pickup_date,
        o.pickup_time_from,
        o.pickup_time_to,
        o.pickup_window_start_notified,
        o.expired_and_archived,
        o.status,
        o.contractor_id,
        (o.pickup_date + o.pickup_time_from) as pickup_start_timestamp,
        u.email as customer_email,
        u.first_name,
        u.last_name
      FROM transport_orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
      AND o.contractor_id IS NULL
      AND o.pickup_window_start_notified = FALSE
      AND o.pickup_date IS NOT NULL
      AND o.pickup_time_from IS NOT NULL
      ORDER BY o.id DESC
      LIMIT 10
    `;
    
    const result1 = await pool.query(query1);
    
    // Query 2: Check which ones match the time condition
    const query2 = `
      SELECT 
        o.id,
        o.pickup_date,
        o.pickup_time_from,
        o.pickup_time_to,
        (o.pickup_date + o.pickup_time_from) as pickup_start_timestamp,
        (o.pickup_date + o.pickup_time_from) <= $1 as should_notify,
        u.email as customer_email
      FROM transport_orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
      AND o.contractor_id IS NULL
      AND o.pickup_window_start_notified = FALSE
      AND o.pickup_date IS NOT NULL
      AND o.pickup_time_from IS NOT NULL
      AND (o.pickup_date + o.pickup_time_from) <= $1
    `;
    
    const result2 = await pool.query(query2, [now]);
    
    // Query 3: Check expired orders
    const query3 = `
      SELECT 
        o.id,
        o.pickup_date,
        o.pickup_time_from,
        o.pickup_time_to,
        o.expired_and_archived,
        CASE 
          WHEN o.pickup_time_to IS NOT NULL THEN
            (o.pickup_date + o.pickup_time_to) + interval '1 hour'
          ELSE
            (o.pickup_date + o.pickup_time_from) + interval '1 hour'
        END as expiry_timestamp,
        CASE 
          WHEN o.pickup_time_to IS NOT NULL THEN
            (o.pickup_date + o.pickup_time_to) + interval '1 hour' <= $1
          ELSE
            (o.pickup_date + o.pickup_time_from) + interval '1 hour' <= $1
        END as should_expire,
        u.email as customer_email
      FROM transport_orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
      AND o.contractor_id IS NULL
      AND o.expired_and_archived = FALSE
      AND o.pickup_date IS NOT NULL
    `;
    
    const result3 = await pool.query(query3, [now]);
    
    res.json({
      success: true,
      current_time: nowISO,
      current_time_local: now.toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }),
      pending_orders: {
        total: result1.rows.length,
        orders: result1.rows.map(o => ({
          id: o.id,
          pickup_date: o.pickup_date,
          pickup_time_from: o.pickup_time_from,
          pickup_time_to: o.pickup_time_to,
          pickup_start_timestamp: o.pickup_start_timestamp,
          notified: o.pickup_window_start_notified,
          archived: o.expired_and_archived,
          customer: o.customer_email
        }))
      },
      should_notify_now: {
        count: result2.rows.length,
        orders: result2.rows.map(o => ({
          id: o.id,
          pickup_start: o.pickup_start_timestamp,
          should_notify: o.should_notify,
          customer: o.customer_email
        }))
      },
      should_expire_now: {
        count: result3.rows.filter(o => o.should_expire).length,
        orders: result3.rows.map(o => ({
          id: o.id,
          expiry_timestamp: o.expiry_timestamp,
          should_expire: o.should_expire,
          customer: o.customer_email
        }))
      }
    });
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;
