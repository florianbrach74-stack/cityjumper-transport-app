const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');

// Get order summary for a date range
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start- und Enddatum sind erforderlich' });
    }

    let query = '';
    let params = [];

    if (userRole === 'admin') {
      // Admin sees all orders
      query = `
        SELECT 
          o.*,
          c.email as customer_email,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.company_name as customer_company,
          ct.email as contractor_email,
          ct.first_name as contractor_first_name,
          ct.last_name as contractor_last_name,
          ct.company_name as contractor_company
        FROM transport_orders o
        LEFT JOIN users c ON o.customer_id = c.id
        LEFT JOIN users ct ON o.contractor_id = ct.id
        WHERE o.created_at >= $1 AND o.created_at <= $2
        ORDER BY o.created_at DESC
      `;
      params = [startDate, endDate];
    } else if (userRole === 'customer') {
      // Customer sees only their orders
      query = `
        SELECT 
          o.*,
          ct.email as contractor_email,
          ct.first_name as contractor_first_name,
          ct.last_name as contractor_last_name,
          ct.company_name as contractor_company
        FROM transport_orders o
        LEFT JOIN users ct ON o.contractor_id = ct.id
        WHERE o.customer_id = $1 AND o.created_at >= $2 AND o.created_at <= $3
        ORDER BY o.created_at DESC
      `;
      params = [userId, startDate, endDate];
    } else if (userRole === 'contractor') {
      // Contractor sees only their assigned orders
      query = `
        SELECT 
          o.*,
          c.email as customer_email,
          c.first_name as customer_first_name,
          c.last_name as customer_last_name,
          c.company_name as customer_company
        FROM transport_orders o
        LEFT JOIN users c ON o.customer_id = c.id
        WHERE o.contractor_id = $1 AND o.created_at >= $2 AND o.created_at <= $3
        ORDER BY o.created_at DESC
      `;
      params = [userId, startDate, endDate];
    }

    const result = await pool.query(query, params);
    const orders = result.rows;

    // Calculate summary statistics
    const summary = {
      totalOrders: orders.length,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      inProgressOrders: orders.filter(o => ['accepted', 'in_transit', 'picked_up'].includes(o.status)).length,
      totalRevenue: 0,
      totalContractorPayout: 0,
      totalPlatformCommission: 0,
      totalWaitingTimeFees: 0
    };

    orders.forEach(order => {
      const price = parseFloat(order.price) || 0;
      const contractorPrice = parseFloat(order.contractor_price) || (price * 0.85);
      const waitingTimeFee = parseFloat(order.waiting_time_fee) || 0;

      if (userRole === 'admin') {
        summary.totalRevenue += price + (order.waiting_time_approved ? waitingTimeFee : 0);
        summary.totalContractorPayout += contractorPrice + (order.waiting_time_approved ? waitingTimeFee : 0);
        summary.totalPlatformCommission += (price - contractorPrice);
        if (order.waiting_time_approved) {
          summary.totalWaitingTimeFees += waitingTimeFee;
        }
      } else if (userRole === 'customer') {
        summary.totalRevenue += price + (order.waiting_time_approved ? waitingTimeFee : 0);
      } else if (userRole === 'contractor') {
        summary.totalRevenue += contractorPrice + (order.waiting_time_approved ? waitingTimeFee : 0);
        if (order.waiting_time_approved) {
          summary.totalWaitingTimeFees += waitingTimeFee;
        }
      }
    });

    res.json({
      success: true,
      summary,
      orders,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get orders grouped by customer (Admin only)
router.get('/by-customer', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start- und Enddatum sind erforderlich' });
    }

    const query = `
      SELECT 
        c.id as customer_id,
        c.email as customer_email,
        c.first_name as customer_first_name,
        c.last_name as customer_last_name,
        c.company_name as customer_company,
        COUNT(o.id) as order_count,
        SUM(o.price) as total_price,
        SUM(CASE WHEN o.waiting_time_approved THEN o.waiting_time_fee ELSE 0 END) as total_waiting_time_fees,
        ARRAY_AGG(
          json_build_object(
            'id', o.id,
            'pickup_city', o.pickup_city,
            'delivery_city', o.delivery_city,
            'pickup_date', o.pickup_date,
            'price', o.price,
            'contractor_price', o.contractor_price,
            'waiting_time_fee', o.waiting_time_fee,
            'waiting_time_approved', o.waiting_time_approved,
            'status', o.status,
            'created_at', o.created_at
          ) ORDER BY o.created_at DESC
        ) as orders
      FROM users c
      INNER JOIN transport_orders o ON c.id = o.customer_id
      WHERE c.role = 'customer' 
        AND o.created_at >= $1 
        AND o.created_at <= $2
      GROUP BY c.id, c.email, c.first_name, c.last_name, c.company_name
      ORDER BY total_price DESC
    `;

    const result = await pool.query(query, [startDate, endDate]);

    res.json({
      success: true,
      customers: result.rows,
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error('Get by customer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate bulk invoice for multiple orders (Admin only)
router.post('/bulk-invoice', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    console.log('Bulk invoice request:', req.body);
    const { orderIds, customerId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      console.error('Invalid orderIds:', orderIds);
      return res.status(400).json({ error: 'Mindestens eine Auftrags-ID ist erforderlich' });
    }

    console.log('Fetching orders:', orderIds);

    // Get orders
    const ordersResult = await pool.query(
      `SELECT o.*, 
              c.email as customer_email,
              c.first_name as customer_first_name,
              c.last_name as customer_last_name,
              c.company_name as customer_company
       FROM transport_orders o
       LEFT JOIN users c ON o.customer_id = c.id
       WHERE o.id = ANY($1)
       ORDER BY o.created_at ASC`,
      [orderIds]
    );

    console.log('Orders found:', ordersResult.rows.length);

    const orders = ordersResult.rows;

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Keine Aufträge gefunden' });
    }

    // Verify all orders belong to the same customer
    const customerIds = [...new Set(orders.map(o => o.customer_id))];
    if (customerIds.length > 1) {
      return res.status(400).json({ error: 'Alle Aufträge müssen vom selben Kunden sein' });
    }

    // Calculate totals
    const totals = {
      subtotal: 0,
      waitingTimeFees: 0,
      total: 0,
      orderCount: orders.length
    };

    orders.forEach(order => {
      const price = parseFloat(order.price) || 0;
      const waitingTimeFee = order.waiting_time_approved ? (parseFloat(order.waiting_time_fee) || 0) : 0;
      
      totals.subtotal += price;
      totals.waitingTimeFees += waitingTimeFee;
    });

    totals.total = totals.subtotal + totals.waitingTimeFees;

    res.json({
      success: true,
      invoice: {
        orders,
        customer: {
          id: orders[0].customer_id,
          email: orders[0].customer_email,
          name: orders[0].customer_company || `${orders[0].customer_first_name} ${orders[0].customer_last_name}`
        },
        totals,
        invoiceDate: new Date().toISOString(),
        invoiceNumber: `INV-${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Generate bulk invoice error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
