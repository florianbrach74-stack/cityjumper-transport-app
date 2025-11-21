const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

/**
 * GET /api/invoices
 * Get all invoices (admin) or user's invoices (customer)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { status, customer_id, from_date, to_date, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        i.*,
        u.email as customer_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.company_name as customer_company,
        COUNT(io.id) as order_count
      FROM sent_invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      LEFT JOIN invoice_order_items io ON i.invoice_number = io.invoice_number
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Role-based filtering
    if (role === 'customer') {
      conditions.push(`i.customer_id = $${paramIndex++}`);
      params.push(userId);
    } else if (role === 'admin' && customer_id) {
      conditions.push(`i.customer_id = $${paramIndex++}`);
      params.push(customer_id);
    }

    // Status filter
    if (status) {
      conditions.push(`i.payment_status = $${paramIndex++}`);
      params.push(status);
    }

    // Date range filter
    if (from_date) {
      conditions.push(`i.invoice_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`i.invoice_date <= $${paramIndex++}`);
      params.push(to_date);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY i.id, u.email, u.first_name, u.last_name, u.company_name
      ORDER BY i.invoice_date DESC, i.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT i.id) as total FROM sent_invoices i`;
    const countConditions = [];
    const countParams = [];
    let countParamIndex = 1;

    if (role === 'customer') {
      countConditions.push(`i.customer_id = $${countParamIndex++}`);
      countParams.push(userId);
    } else if (role === 'admin' && customer_id) {
      countConditions.push(`i.customer_id = $${countParamIndex++}`);
      countParams.push(customer_id);
    }
    if (status) {
      countConditions.push(`i.payment_status = $${countParamIndex++}`);
      countParams.push(status);
    }
    if (from_date) {
      countConditions.push(`i.invoice_date >= $${countParamIndex++}`);
      countParams.push(from_date);
    }
    if (to_date) {
      countConditions.push(`i.invoice_date <= $${countParamIndex++}`);
      countParams.push(to_date);
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`;
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      invoices: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/invoices/:invoiceNumber
 * Get invoice details with all orders
 */
router.get('/:invoiceNumber', authenticateToken, async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const { role, id: userId } = req.user;

    // Get invoice
    const invoiceResult = await pool.query(
      `SELECT 
        i.*,
        u.email as customer_email,
        u.billing_email as customer_billing_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.company_name as customer_company,
        u.company_address as customer_address,
        u.company_postal_code as customer_postal_code,
        u.company_city as customer_city,
        u.tax_id as customer_tax_id,
        u.vat_id as customer_vat_id
      FROM sent_invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.invoice_number = $1`,
      [invoiceNumber]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const invoice = invoiceResult.rows[0];

    // Check permissions
    if (role === 'customer' && invoice.customer_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get invoice items (orders)
    const itemsResult = await pool.query(
      `SELECT 
        io.*,
        o.pickup_address,
        o.pickup_city,
        o.pickup_postal_code,
        o.delivery_address,
        o.delivery_city,
        o.delivery_postal_code,
        o.pickup_date,
        o.vehicle_type,
        o.waiting_time_approved,
        o.waiting_time_fee
      FROM invoice_order_items io
      LEFT JOIN transport_orders o ON io.order_id = o.id
      WHERE io.invoice_number = $1
      ORDER BY io.created_at ASC`,
      [invoiceNumber]
    );

    res.json({
      success: true,
      invoice: {
        ...invoice,
        items: itemsResult.rows
      }
    });

  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/invoices/stats/summary
 * Get invoice statistics
 */
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { customer_id } = req.query;

    let whereClause = '';
    const params = [];

    if (role === 'customer') {
      whereClause = 'WHERE customer_id = $1';
      params.push(userId);
    } else if (role === 'admin' && customer_id) {
      whereClause = 'WHERE customer_id = $1';
      params.push(customer_id);
    }

    const query = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_count,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN payment_status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
        SUM(CASE WHEN payment_status = 'unpaid' THEN total_amount ELSE 0 END) as unpaid_amount,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN payment_status = 'overdue' THEN total_amount ELSE 0 END) as overdue_amount,
        SUM(total_amount) as total_amount
      FROM sent_invoices
      ${whereClause}
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      stats: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PATCH /api/invoices/:invoiceNumber/payment-status
 * Update payment status (admin only)
 */
router.patch('/:invoiceNumber/payment-status', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const { payment_status, payment_notes } = req.body;

    if (!['unpaid', 'paid', 'overdue'].includes(payment_status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment status'
      });
    }

    const result = await pool.query(
      `UPDATE sent_invoices 
       SET payment_status = $1, 
           paid_at = $2,
           payment_notes = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE invoice_number = $4
       RETURNING *`,
      [
        payment_status,
        payment_status === 'paid' ? new Date() : null,
        payment_notes || null,
        invoiceNumber
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    // Also update all orders linked to this invoice
    await pool.query(
      `UPDATE transport_orders 
       SET payment_status = $1
       WHERE invoice_number = $2`,
      [payment_status, invoiceNumber]
    );

    res.json({
      success: true,
      invoice: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/invoices/:invoiceNumber/send-reminder
 * Send payment reminder email (admin only)
 */
router.post('/:invoiceNumber/send-reminder', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const { reminder_type = 'friendly' } = req.body; // friendly, urgent, final

    // Get invoice details
    const invoiceResult = await pool.query(
      `SELECT 
        i.*,
        u.email as customer_email,
        u.billing_email as customer_billing_email,
        u.first_name as customer_first_name,
        u.last_name as customer_last_name,
        u.company_name as customer_company
      FROM sent_invoices i
      LEFT JOIN users u ON i.customer_id = u.id
      WHERE i.invoice_number = $1`,
      [invoiceNumber]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    const invoice = invoiceResult.rows[0];
    const recipientEmail = invoice.customer_billing_email || invoice.customer_email;

    // Send reminder email
    const { sendEmail } = require('../config/email');
    
    const reminderTemplates = {
      friendly: {
        subject: `Freundliche Zahlungserinnerung - Rechnung ${invoiceNumber}`,
        message: `
          <h2>Zahlungserinnerung</h2>
          <p>Sehr geehrte/r ${invoice.customer_first_name} ${invoice.customer_last_name},</p>
          <p>wir möchten Sie freundlich an die ausstehende Zahlung für folgende Rechnung erinnern:</p>
          <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}<br>
          <strong>Rechnungsdatum:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('de-DE')}<br>
          <strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}<br>
          <strong>Betrag:</strong> €${parseFloat(invoice.total_amount).toFixed(2)}</p>
          <p>Falls Sie die Rechnung bereits beglichen haben, betrachten Sie diese Email bitte als gegenstandslos.</p>
          <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
        `
      },
      urgent: {
        subject: `Dringende Zahlungserinnerung - Rechnung ${invoiceNumber}`,
        message: `
          <h2 style="color: #f59e0b;">Dringende Zahlungserinnerung</h2>
          <p>Sehr geehrte/r ${invoice.customer_first_name} ${invoice.customer_last_name},</p>
          <p>die Zahlung für folgende Rechnung ist überfällig:</p>
          <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}<br>
          <strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}<br>
          <strong>Offener Betrag:</strong> €${parseFloat(invoice.total_amount).toFixed(2)}</p>
          <p style="color: #dc2626;"><strong>Bitte begleichen Sie den Betrag umgehend.</strong></p>
          <p>Bei Fragen kontaktieren Sie uns bitte unter info@courierly.de</p>
          <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
        `
      },
      final: {
        subject: `Letzte Mahnung - Rechnung ${invoiceNumber}`,
        message: `
          <h2 style="color: #dc2626;">Letzte Mahnung</h2>
          <p>Sehr geehrte/r ${invoice.customer_first_name} ${invoice.customer_last_name},</p>
          <p>trotz mehrfacher Erinnerung ist die Zahlung für folgende Rechnung noch nicht eingegangen:</p>
          <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}<br>
          <strong>Fälligkeitsdatum:</strong> ${new Date(invoice.due_date).toLocaleDateString('de-DE')}<br>
          <strong>Offener Betrag:</strong> €${parseFloat(invoice.total_amount).toFixed(2)}</p>
          <p style="color: #dc2626;"><strong>Dies ist unsere letzte Mahnung. Bitte begleichen Sie den Betrag innerhalb von 7 Tagen, andernfalls müssen wir rechtliche Schritte einleiten.</strong></p>
          <p>Kontakt: info@courierly.de | 01724216672</p>
          <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
        `
      }
    };

    const template = reminderTemplates[reminder_type];

    await sendEmail(
      recipientEmail,
      template.subject,
      template.message
    );

    // Log reminder
    await pool.query(
      `UPDATE sent_invoices 
       SET last_reminder_sent_at = CURRENT_TIMESTAMP,
           reminder_count = COALESCE(reminder_count, 0) + 1
       WHERE invoice_number = $1`,
      [invoiceNumber]
    );

    res.json({
      success: true,
      message: `${reminder_type} reminder sent to ${recipientEmail}`
    });

  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
