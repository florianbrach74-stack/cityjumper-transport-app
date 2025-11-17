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
        WHERE (o.status = 'completed' OR o.cancellation_status IS NOT NULL)
          AND o.updated_at >= $1 AND o.updated_at < ($2::date + interval '1 day')
        ORDER BY o.updated_at DESC
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
        WHERE o.customer_id = $1 
          AND (o.status = 'completed' OR o.cancellation_status IS NOT NULL)
          AND o.updated_at >= $2 AND o.updated_at < ($3::date + interval '1 day')
        ORDER BY o.updated_at DESC
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
        WHERE o.contractor_id = $1 
          AND (o.status = 'completed' OR o.cancellation_status IS NOT NULL)
          AND o.updated_at >= $2 AND o.updated_at < ($3::date + interval '1 day')
        ORDER BY o.updated_at DESC
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
      cancelledOrders: orders.filter(o => o.cancellation_status).length,
      totalRevenue: 0,
      totalContractorPayout: 0,
      totalPlatformCommission: 0,
      totalWaitingTimeFees: 0,
      totalCancellationFees: 0,
      totalContractorPenalties: 0,
      totalCustomerCompensations: 0
    };

    orders.forEach(order => {
      // Use customer_price if available, otherwise fall back to price
      const customerPrice = parseFloat(order.customer_price || order.price) || 0;
      const contractorPrice = parseFloat(order.contractor_price || order.price) || 0;
      const waitingTimeFee = parseFloat(order.waiting_time_fee) || 0;
      const cancellationFee = parseFloat(order.cancellation_fee) || 0;
      const contractorPenalty = parseFloat(order.contractor_penalty) || 0;
      const customerCompensation = parseFloat(order.customer_compensation) || 0;
      
      // Calculate commission: difference between customer price and contractor price
      const commission = customerPrice - contractorPrice;
      
      // Debug logging for first order
      if (order.id === orders[0].id) {
        console.log('📊 Commission calculation for order', order.id);
        console.log('   customer_price:', order.customer_price);
        console.log('   contractor_price:', order.contractor_price);
        console.log('   price:', order.price);
        console.log('   Calculated customerPrice:', customerPrice);
        console.log('   Calculated contractorPrice:', contractorPrice);
        console.log('   Commission:', commission);
      }

      if (userRole === 'admin') {
        summary.totalRevenue += customerPrice + (order.waiting_time_approved ? waitingTimeFee : 0);
        summary.totalContractorPayout += contractorPrice + (order.waiting_time_approved ? waitingTimeFee : 0);
        summary.totalPlatformCommission += commission;
        if (order.waiting_time_approved) {
          summary.totalWaitingTimeFees += waitingTimeFee;
        }
        
        // Add cancellation fees and penalties
        if (order.cancellation_status === 'cancelled_by_customer') {
          summary.totalCancellationFees += cancellationFee;
          summary.totalRevenue += cancellationFee; // Customer pays cancellation fee
        } else if (order.cancellation_status === 'cancelled_by_contractor') {
          summary.totalContractorPenalties += contractorPenalty;
          summary.totalCustomerCompensations += customerCompensation;
          summary.totalRevenue += customerCompensation; // Compensation goes to customer
        }
      } else if (userRole === 'customer') {
        summary.totalRevenue += customerPrice + (order.waiting_time_approved ? waitingTimeFee : 0);
        
        // Customer sees cancellation fees they paid
        if (order.cancellation_status === 'cancelled_by_customer') {
          summary.totalCancellationFees += cancellationFee;
          summary.totalRevenue += cancellationFee;
        }
        // Customer sees compensation they received
        if (order.cancellation_status === 'cancelled_by_contractor') {
          summary.totalCustomerCompensations += customerCompensation;
          summary.totalRevenue -= customerCompensation; // Reduce their cost
        }
      } else if (userRole === 'contractor') {
        summary.totalRevenue += contractorPrice + (order.waiting_time_approved ? waitingTimeFee : 0);
        if (order.waiting_time_approved) {
          summary.totalWaitingTimeFees += waitingTimeFee;
        }
        
        // Contractor sees cancellation fees they received (from customer cancellation)
        if (order.cancellation_status === 'cancelled_by_customer' && order.contractor_id === userId) {
          summary.totalCancellationFees += cancellationFee;
          summary.totalRevenue += cancellationFee * 0.85; // Contractor gets 85% of cancellation fee
        }
        // Contractor sees penalties they paid
        if (order.cancellation_status === 'cancelled_by_contractor' && order.contractor_id === userId) {
          summary.totalContractorPenalties += contractorPenalty;
          summary.totalRevenue -= contractorPenalty; // Reduce their earnings
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
    const { orderIds, customerId, sendEmail: shouldSendEmail, notes, dueDate } = req.body;

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

    const invoiceNumber = `INV-${Date.now()}`;
    const invoiceDate = new Date().toLocaleDateString('de-DE');
    const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString('de-DE') : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE');

    // Send email if requested
    if (shouldSendEmail && orders[0].customer_email) {
      try {
        const { sendEmail } = require('../config/email');
        
        const ordersList = orders.map((order, idx) => 
          `${idx + 1}. Auftrag #${order.id} - ${order.pickup_city} → ${order.delivery_city} (${new Date(order.created_at).toLocaleDateString('de-DE')}) - €${parseFloat(order.price).toFixed(2)}`
        ).join('\n');

        await sendEmail({
          to: orders[0].customer_email,
          subject: `Sammelrechnung ${invoiceNumber} von Courierly`,
          html: `
            <h2>Ihre Sammelrechnung von Courierly</h2>
            <p>Sehr geehrte/r ${orders[0].customer_first_name} ${orders[0].customer_last_name},</p>
            <p>anbei erhalten Sie Ihre Sammelrechnung für ${orders.length} Auftrag${orders.length > 1 ? 'e' : ''}.</p>
            
            <h3>Rechnungsdetails:</h3>
            <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}<br>
            <strong>Rechnungsdatum:</strong> ${invoiceDate}<br>
            <strong>Fälligkeitsdatum:</strong> ${dueDateFormatted}</p>
            
            <h3>Positionen:</h3>
            <pre style="font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 5px;">${ordersList}</pre>
            
            <h3>Summen:</h3>
            <p><strong>Zwischensumme:</strong> €${totals.subtotal.toFixed(2)}<br>
            ${totals.waitingTimeFees > 0 ? `<strong>Wartezeit-Gebühren:</strong> €${totals.waitingTimeFees.toFixed(2)}<br>` : ''}
            <strong>Gesamtsumme:</strong> €${totals.total.toFixed(2)}</p>
            
            ${notes ? `<p><strong>Anmerkungen:</strong><br>${notes}</p>` : ''}
            
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          `
        });
        
        console.log('✅ Email sent to:', orders[0].customer_email);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        // Don't fail the whole request if email fails
      }
    }

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
        invoiceNumber
      },
      emailSent: shouldSendEmail && orders[0].customer_email
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
