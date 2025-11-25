const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const os = require('os');

/**
 * GET /api/system/health
 * Get system health metrics
 */
router.get('/health', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage_percent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      },
      cpu: {
        cores: os.cpus().length,
        model: os.cpus()[0].model,
        load_average: os.loadavg()
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release()
      }
    };

    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/database
 * Get database statistics
 */
router.get('/database', authenticateToken, authorizeRole('admin'), async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 SYSTEM DATABASE REQUEST [v2.6]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔹 User:', req.user?.email, '(ID:', req.user?.id, ')');
  console.log('🔹 Timestamp:', new Date().toISOString());
  
  try {
    // Get database size
    const sizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    // Get table sizes - hardcoded list to avoid pg_tables issues
    const tableNames = [
      'transport_orders', 'users', 'sent_invoices', 'order_bids', 
      'penalties', 'email_templates', 'notifications', 'system_logs'
    ];
    
    const tableSizes = [];
    for (const tableName of tableNames) {
      try {
        const result = await pool.query(`
          SELECT 
            'public' as schemaname,
            $1 as tablename,
            pg_size_pretty(pg_total_relation_size('public.' || $1)) AS size
        `, [tableName]);
        if (result.rows[0]) {
          tableSizes.push(result.rows[0]);
        }
      } catch (e) {
        // Table doesn't exist, skip
      }
    }
    
    const tablesResult = { rows: tableSizes };

    // Get connection stats
    const connectionsResult = await pool.query(`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);

    // Get index usage - use information_schema
    const indexResult = await pool.query(`
      SELECT 
        t.table_schema as schemaname,
        t.table_name as tablename,
        i.indexname,
        0 as idx_scan,
        0 as idx_tup_read,
        0 as idx_tup_fetch
      FROM information_schema.tables t
      LEFT JOIN pg_indexes i ON i.tablename = t.table_name AND i.schemaname = t.table_schema
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      LIMIT 20
    `);

    console.log('✅ Database stats fetched successfully');
    console.log('   Size:', sizeResult.rows[0].size);
    console.log('   Tables:', tablesResult.rows.length);
    console.log('   Connections:', connectionsResult.rows[0].total_connections);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.json({
      success: true,
      database: {
        size: sizeResult.rows[0].size,
        tables: tablesResult.rows,
        connections: connectionsResult.rows[0],
        indexes: indexResult.rows
      }
    });
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR fetching database stats:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/stats
 * Get application statistics
 */
router.get('/stats', authenticateToken, authorizeRole('admin'), async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 SYSTEM STATS REQUEST');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔹 User:', req.user?.email, '(ID:', req.user?.id, ')');
  console.log('🔹 Timestamp:', new Date().toISOString());
  
  try {
    // Users stats
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'customer') as customers,
        COUNT(*) FILTER (WHERE role = 'contractor') as contractors,
        COUNT(*) FILTER (WHERE role = 'employee') as employees,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE verification_status = 'approved') as verified_contractors,
        COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_verifications,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d
      FROM users
    `);

    // Orders stats
    const ordersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted_orders,
        COUNT(*) FILTER (WHERE status = 'in_transit') as in_transit_orders,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as orders_30d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as orders_7d,
        SUM(price) FILTER (WHERE status = 'completed') as total_revenue,
        AVG(price) FILTER (WHERE status = 'completed') as avg_order_value
      FROM transport_orders
    `);

    // Invoices stats
    const invoicesStats = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'unpaid') as unpaid_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'overdue') as overdue_invoices,
        SUM(total_amount) FILTER (WHERE payment_status = 'paid') as paid_amount,
        SUM(total_amount) FILTER (WHERE payment_status = 'unpaid') as unpaid_amount,
        SUM(total_amount) FILTER (WHERE payment_status = 'overdue') as overdue_amount,
        COUNT(*) FILTER (WHERE created_by IS NOT NULL) as invoices_30d
      FROM sent_invoices
    `);

    // Bids stats - handle if table doesn't exist
    let bidsStats;
    try {
      bidsStats = await pool.query(`
        SELECT 
          COUNT(*) as total_bids,
          COUNT(*) FILTER (WHERE status = 'pending') as pending_bids,
          COUNT(*) FILTER (WHERE status = 'accepted') as accepted_bids,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected_bids,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as bids_30d
        FROM order_bids
      `);
    } catch (e) {
      console.log('⚠️  Bids table not found, using defaults');
      bidsStats = { rows: [{ total_bids: 0, pending_bids: 0, accepted_bids: 0, rejected_bids: 0, bids_30d: 0 }] };
    }

    // Penalties stats
    const penaltiesStats = await pool.query(`
      SELECT 
        COUNT(*) as total_penalties,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_penalties,
        COUNT(*) FILTER (WHERE status = 'paid') as paid_penalties,
        COUNT(*) FILTER (WHERE status = 'waived') as waived_penalties,
        SUM(penalty_amount) FILTER (WHERE status = 'pending') as pending_amount,
        SUM(penalty_amount) FILTER (WHERE status = 'paid') as paid_amount
      FROM contractor_penalties
    `);

    console.log('✅ Application stats fetched successfully');
    console.log('   Users:', usersStats.rows[0].total_users);
    console.log('   Orders:', ordersStats.rows[0].total_orders);
    console.log('   Invoices:', invoicesStats.rows[0].total_invoices);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    res.json({
      success: true,
      stats: {
        users: usersStats.rows[0],
        orders: ordersStats.rows[0],
        invoices: invoicesStats.rows[0],
        bids: bidsStats.rows[0],
        penalties: penaltiesStats.rows[0]
      }
    });
  } catch (error) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERROR fetching application stats:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/activity
 * Get recent activity
 */
router.get('/activity', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Recent orders
    const recentOrders = await pool.query(`
      SELECT 
        id,
        customer_id,
        status,
        price,
        pickup_city,
        delivery_city,
        created_at
      FROM transport_orders
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    // Recent invoices
    const recentInvoices = await pool.query(`
      SELECT 
        invoice_number,
        customer_id,
        payment_status,
        total_amount,
        created_at
      FROM sent_invoices
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    // Recent bids
    const recentBids = await pool.query(`
      SELECT 
        id,
        order_id,
        contractor_id,
        status,
        bid_price,
        created_at
      FROM bids
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    res.json({
      success: true,
      activity: {
        orders: recentOrders.rows,
        invoices: recentInvoices.rows,
        bids: recentBids.rows
      }
    });
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/system/errors
 * Get error logs (if implemented)
 */
router.get('/errors', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    // This would require an error logging table
    // For now, return placeholder
    res.json({
      success: true,
      message: 'Error logging not yet implemented',
      errors: []
    });
  } catch (error) {
    console.error('Error fetching errors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
