const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');
const path = require('path');

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
// Fix missing invoice numbers (manual repair)
router.post('/fix-invoice-orders', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { invoiceNumber, orderIds } = req.body;
    
    if (!invoiceNumber || !orderIds || !Array.isArray(orderIds)) {
      return res.status(400).json({ error: 'Invoice number and order IDs required' });
    }
    
    // Update orders
    for (const orderId of orderIds) {
      await pool.query(
        `UPDATE transport_orders SET invoiced_at = CURRENT_TIMESTAMP, invoice_number = $1, payment_status = 'unpaid' WHERE id = $2`,
        [invoiceNumber, orderId]
      );
    }
    
    res.json({ success: true, message: `${orderIds.length} orders updated` });
  } catch (error) {
    console.error('Error fixing invoice orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.patch('/invoice/:invoiceNumber/payment-status', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const { paymentStatus } = req.body;
    
    if (!['unpaid', 'paid', 'overdue'].includes(paymentStatus)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }
    
    // Update invoice
    await pool.query(
      `UPDATE sent_invoices SET payment_status = $1, paid_at = $2 WHERE invoice_number = $3`,
      [paymentStatus, paymentStatus === 'paid' ? new Date() : null, invoiceNumber]
    );
    
    // Update all orders with this invoice number
    await pool.query(
      `UPDATE transport_orders SET payment_status = $1 WHERE invoice_number = $2`,
      [paymentStatus, invoiceNumber]
    );
    
    res.json({ success: true, message: 'Payment status updated' });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get invoice PDF
router.get('/invoice/:invoiceNumber/pdf', async (req, res) => {
  // Get token from query parameter or header
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  // Verify token manually
  const jwt = require('jsonwebtoken');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  try {
    const { invoiceNumber } = req.params;
    console.log('📥 PDF download request for invoice:', invoiceNumber);
    
    // Get invoice details
    const invoiceResult = await pool.query(
      `SELECT * FROM sent_invoices WHERE invoice_number = $1`,
      [invoiceNumber]
    );
    
    if (invoiceResult.rows.length === 0) {
      console.error('❌ Invoice not found:', invoiceNumber);
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = invoiceResult.rows[0];
    console.log('✅ Invoice found:', invoiceNumber);
    
    // If PDF URL exists in Cloudinary, redirect to it
    if (invoice.pdf_url) {
      return res.redirect(invoice.pdf_url);
    }
    
    // Get invoice items (orders)
    const itemsResult = await pool.query(
      `SELECT io.*, 
              o.id as order_id,
              o.pickup_address,
              o.pickup_city,
              o.pickup_postal_code,
              o.delivery_address,
              o.delivery_city,
              o.delivery_postal_code,
              o.price,
              o.waiting_time_fee,
              o.waiting_time_approved,
              o.created_at,
              c.first_name as customer_first_name, 
              c.last_name as customer_last_name,
              c.company_name as customer_company,
              c.email as customer_email,
              c.company_address as customer_street,
              c.company_city as customer_city,
              c.company_postal_code as customer_postal_code,
              c.phone as customer_phone
       FROM invoice_order_items io
       JOIN transport_orders o ON io.order_id = o.id
       JOIN users c ON o.customer_id = c.id
       WHERE io.invoice_number = $1
       ORDER BY o.id`,
      [invoiceNumber]
    );
    
    const orders = itemsResult.rows;
    console.log('📦 Orders found:', orders.length);
    
    if (orders.length === 0) {
      console.error('❌ No orders found for invoice:', invoiceNumber);
      return res.status(404).json({ error: 'No orders found for this invoice' });
    }
    
    console.log('🎨 Generating PDF...');
    // Generate PDF (reuse existing PDF generation code)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rechnung_${invoiceNumber}.pdf"`);
    
    doc.pipe(res);
    
    // Add logo in top left corner
    const logoPath = path.join(__dirname, '..', 'assets', 'courierly-logo.png');
    try {
      doc.image(logoPath, 50, 10, { width: 100 });
    } catch (err) {
      console.log('⚠️ Logo not found, using text instead');
      doc.fontSize(18).fillColor('#2563eb').text('Courierly', 50, 10);
    }
    
    // Header - Left side (Company info - starts AFTER logo)
    doc.fillColor('#6b7280').fontSize(8).text('eine Marke der FB Transporte', 50, 130);
    doc.fillColor('#000000');
    
    doc.fontSize(9)
       .text('Inhaber: Florian Brach', 50, 140)
       .text('Adolf-Menzel-Straße 71', 50, 150)
       .text('12621 Berlin', 50, 160)
       .text('Tel: +49 (0)172 421 66 72', 50, 170)
       .text('Email: info@courierly.de', 50, 180)
       .text('Web: www.courierly.de', 50, 190)
       .text('USt-IdNr: DE299198928', 50, 200)
       .text('St.-Nr.: 33/237/00521', 50, 210);
    
    // Header - Right side (Invoice title)
    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('de-DE');
    
    // Calculate due date: invoice date + 14 days
    let dueDate;
    if (invoice.due_date) {
      dueDate = new Date(invoice.due_date).toLocaleDateString('de-DE');
    } else {
      const dueDateObj = new Date(invoice.invoice_date);
      dueDateObj.setDate(dueDateObj.getDate() + 14);
      dueDate = dueDateObj.toLocaleDateString('de-DE');
    }
    
    doc.fontSize(28).text('RECHNUNG', 350, 50, { align: 'right' });
    doc.fontSize(10)
       .text(`Nr: ${invoiceNumber}`, 350, 90, { align: 'right' })
       .text(`Datum: ${invoiceDate}`, 350, 110, { align: 'right' })
       .text(`Fällig: ${dueDate}`, 350, 130, { align: 'right' });
    
    // Customer info
    doc.fontSize(11).text('Rechnungsempfänger:', 50, 270);
    let customerY = 290;
    
    // Company name (if available)
    if (orders[0].customer_company) {
      doc.fontSize(10).text(orders[0].customer_company, 50, customerY);
      customerY += 10;
    }
    
    // Name
    doc.fontSize(10).text(`${orders[0].customer_first_name || ''} ${orders[0].customer_last_name || ''}`.trim(), 50, customerY);
    customerY += 10;
    
    // Street
    if (orders[0].customer_street) {
      doc.text(orders[0].customer_street, 50, customerY);
      customerY += 10;
    }
    
    // Postal code + City
    if (orders[0].customer_postal_code || orders[0].customer_city) {
      doc.text(`${orders[0].customer_postal_code || ''} ${orders[0].customer_city || ''}`.trim(), 50, customerY);
      customerY += 10;
    }
    
    // Email
    if (orders[0].customer_email) {
      doc.text(orders[0].customer_email, 50, customerY);
      customerY += 10;
    }
    
    // Phone (if available)
    if (orders[0].customer_phone) {
      doc.text(orders[0].customer_phone, 50, customerY);
      customerY += 15;
    }
    
    // Table header
    doc.fontSize(11).text('Leistungen:', 50, 350);
    doc.moveTo(50, 370).lineTo(550, 370).stroke();
    
    // Table columns
    let y = 385;
    doc.fontSize(9).fillColor('#6b7280')
       .text('Auftrag', 50, y)
       .text('Route', 150, y)
       .text('Datum', 350, y)
       .text('Betrag', 480, y, { align: 'right' });
    doc.fillColor('#000000');
    y += 20;
    
    // Calculate totals for display
    let subtotalWithoutWaiting = 0;
    let totalWaitingFees = 0;
    
    // Orders
    orders.forEach((order) => {
      const price = parseFloat(order.price) || 0;
      const waitingFee = order.waiting_time_approved ? (parseFloat(order.waiting_time_fee) || 0) : 0;
      
      subtotalWithoutWaiting += price;
      totalWaitingFees += waitingFee;
      
      // Build full pickup address
      let pickupLocation = '';
      if (order.pickup_address) {
        pickupLocation = order.pickup_address;
        if (order.pickup_postal_code && order.pickup_city) {
          pickupLocation += `, ${order.pickup_postal_code} ${order.pickup_city}`;
        } else if (order.pickup_city) {
          pickupLocation += `, ${order.pickup_city}`;
        }
      } else if (order.pickup_postal_code && order.pickup_city) {
        pickupLocation = `${order.pickup_postal_code} ${order.pickup_city}`;
      } else {
        pickupLocation = order.pickup_city || 'N/A';
      }
      
      // Build full delivery address
      let deliveryLocation = '';
      if (order.delivery_address) {
        deliveryLocation = order.delivery_address;
        if (order.delivery_postal_code && order.delivery_city) {
          deliveryLocation += `, ${order.delivery_postal_code} ${order.delivery_city}`;
        } else if (order.delivery_city) {
          deliveryLocation += `, ${order.delivery_city}`;
        }
      } else if (order.delivery_postal_code && order.delivery_city) {
        deliveryLocation = `${order.delivery_postal_code} ${order.delivery_city}`;
      } else {
        deliveryLocation = order.delivery_city || 'N/A';
      }
      
      const route = `${pickupLocation} - ${deliveryLocation}`;
      doc.fontSize(10)
         .text(`#${order.order_id}`, 50, y)
         .text(route, 150, y, { width: 180 })
         .text(new Date(order.created_at).toLocaleDateString('de-DE'), 350, y)
         .text(`€ ${price.toFixed(2)}`, 480, y, { align: 'right' });
      
      y += 15;
      
      if (waitingFee > 0) {
        doc.fontSize(8).fillColor('#f59e0b')
           .text(`zzgl. € ${waitingFee.toFixed(2)} Wartezeit`, 480, y, { align: 'right' });
        doc.fillColor('#000000').fontSize(10);
        y += 15;
      }
    });
    
    y += 20;
    
    // Totals
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 15;
    
    const nettoWithoutWaiting = subtotalWithoutWaiting;
    const nettoWithWaiting = subtotalWithoutWaiting + totalWaitingFees;
    const taxAmount = nettoWithWaiting * 0.19;
    const totalAmount = nettoWithWaiting + taxAmount;
    
    doc.fontSize(10)
       .text('Zwischensumme (Fahrten):', 350, y)
       .text(`€ ${nettoWithoutWaiting.toFixed(2)}`, 480, y, { align: 'right' });
    y += 15;
    
    if (totalWaitingFees > 0) {
      doc.fillColor('#f59e0b')
         .text('Wartezeit-Gebühren:', 350, y)
         .text(`€ ${totalWaitingFees.toFixed(2)}`, 480, y, { align: 'right' });
      doc.fillColor('#000000');
      y += 15;
    }
    
    doc.text('Nettobetrag:', 350, y)
       .text(`€ ${nettoWithWaiting.toFixed(2)}`, 480, y, { align: 'right' });
    y += 15;
    
    doc.text('zzgl. 19% MwSt.:', 350, y)
       .text(`€ ${taxAmount.toFixed(2)}`, 480, y, { align: 'right' });
    y += 20;
    
    doc.fontSize(12).fillColor('#16a34a')
       .text('Gesamtbetrag:', 350, y)
       .text(`€ ${totalAmount.toFixed(2)}`, 480, y, { align: 'right' });
    doc.fillColor('#000000').fontSize(10);
    
    y += 30;
    
    // Bank details
    doc.fontSize(10).text('Zahlungsinformationen:', 50, y);
    y += 15;
    doc.fontSize(9)
       .text('Bank: Berliner Sparkasse', 50, y)
       .text('IBAN: DE92 1005 0000 1062 9152 80', 50, y + 15)
       .text('BIC: BELADEBEXXX', 50, y + 30);
    
    // Footer
    y += 60;
    doc.fontSize(8).fillColor('#6b7280')
       .text('Vielen Dank für Ihr Vertrauen! | Courierly – eine Marke der FB Transporte', 50, y, { align: 'center', width: 500 })
       .text('Adolf-Menzel Straße 71 | 12621 Berlin | DE 92 1005 0000 1062 9152 80 | BELADEBEXXX', 50, y + 12, { align: 'center', width: 500 })
       .text('USt-IdNr: DE299198928 | Steuernummer: 33/237/00521', 50, y + 24, { align: 'center', width: 500 });
    
    doc.end();
    console.log('✅ PDF generated successfully for invoice:', req.params.invoiceNumber);
  } catch (error) {
    console.error('❌ Error generating invoice PDF:', error);
    console.error('Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

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
              c.billing_email as customer_billing_email,
              c.first_name as customer_first_name,
              c.last_name as customer_last_name,
              c.company_name as customer_company,
              c.company_address as customer_street,
              c.company_city as customer_city,
              c.company_postal_code as customer_postal_code,
              c.phone as customer_phone
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
    
    // Check if any orders are cancelled
    const cancelledOrders = orders.filter(o => o.status === 'cancelled');
    if (cancelledOrders.length > 0) {
      const cancelledIds = cancelledOrders.map(o => `#${o.id}`).join(', ');
      return res.status(400).json({ 
        error: `Folgende Aufträge sind storniert und können nicht abgerechnet werden: ${cancelledIds}. Bitte entfernen Sie diese aus der Auswahl.` 
      });
    }
    
    // Check if any orders are already invoiced
    const alreadyInvoiced = orders.filter(o => o.invoiced_at || o.invoice_number);
    if (alreadyInvoiced.length > 0 && shouldSendEmail) {
      const invoicedIds = alreadyInvoiced.map(o => `#${o.id}`).join(', ');
      return res.status(400).json({ 
        error: `Folgende Aufträge wurden bereits abgerechnet: ${invoicedIds}. Bitte entfernen Sie diese aus der Auswahl.` 
      });
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

    const invoiceDate = new Date().toLocaleDateString('de-DE');
    const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString('de-DE') : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('de-DE');
    
    // PREVIEW next invoice number (without reserving it)
    const previewResult = await pool.query('SELECT preview_next_invoice_number() as invoice_number');
    let invoiceNumber = previewResult.rows[0].invoice_number;
    console.log('👁️ Preview invoice number:', invoiceNumber);
    
    // Use billing_email if set, otherwise use standard email
    const invoiceEmail = orders[0].customer_billing_email || orders[0].customer_email;
    
    console.log('📧 Email check:', {
      shouldSendEmail,
      customerEmail: orders[0].customer_email,
      billingEmail: orders[0].customer_billing_email,
      invoiceEmail: invoiceEmail,
      willSend: shouldSendEmail && invoiceEmail
    });

    // Send email if requested
    if (shouldSendEmail && invoiceEmail) {
      console.log('🔄 Starting invoice creation process...');
      
      // Start a database transaction
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        console.log('✅ Transaction started');
        
        // RESERVE the invoice number NOW (actually increment counter)
        const reserveResult = await client.query('SELECT reserve_next_invoice_number() as invoice_number');
        invoiceNumber = reserveResult.rows[0].invoice_number;
        console.log('📄 Reserved invoice number:', invoiceNumber);
        
        // CRITICAL: Save invoice to DB FIRST (within transaction)
        const taxAmount = totals.total * 0.19;
        const totalWithTax = totals.total + taxAmount;
        
        console.log('💾 Saving invoice to database...');
        
        // Insert invoice
        await client.query(
          `INSERT INTO sent_invoices (invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, created_by)
           VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)`,
          [invoiceNumber, orders[0].customer_id, dueDate || null, totals.total, taxAmount, totalWithTax, req.user.id]
        );
        console.log('✅ Invoice saved');
        
        // Link orders to invoice and mark as invoiced
        for (const order of orders) {
          const orderTotal = parseFloat(order.price) + (order.waiting_time_approved ? parseFloat(order.waiting_time_fee) : 0);
          
          // Insert invoice item
          await client.query(
            `INSERT INTO invoice_order_items (invoice_number, order_id, amount) VALUES ($1, $2, $3)`,
            [invoiceNumber, order.id, orderTotal]
          );
          
          // Mark order as invoiced
          await client.query(
            `UPDATE transport_orders SET invoiced_at = CURRENT_TIMESTAMP, invoice_number = $1, payment_status = 'unpaid' WHERE id = $2`,
            [invoiceNumber, order.id]
          );
        }
        console.log('✅ Orders marked as invoiced:', orderIds);
        
        // COMMIT transaction - invoice is now saved!
        await client.query('COMMIT');
        console.log('✅ Transaction committed - invoice saved to database');
        
      } catch (dbError) {
        // ROLLBACK on error
        await client.query('ROLLBACK');
        console.error('❌ CRITICAL: Database transaction failed, rolling back:', dbError);
        client.release();
        throw new Error(`Failed to save invoice: ${dbError.message}`);
      }
      
      client.release();
      
      // NOW generate and send the email (after DB is saved)
      try {
        const { sendEmail } = require('../config/email');
        const PDFDocument = require('pdfkit');
        
        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        
        // Add logo in top left corner
        const logoPath = path.join(__dirname, '..', 'assets', 'courierly-logo.png');
        try {
          doc.image(logoPath, 50, 10, { width: 100 });
        } catch (err) {
          console.log('⚠️ Logo not found, using text instead');
          // Fallback to text if logo not found
          doc.fontSize(18).fillColor('#2563eb').text('Courierly', 50, 10);
        }
        
        // Header - Left side (Company info - starts AFTER logo)
        doc.fillColor('#6b7280').fontSize(8).text('eine Marke der FB Transporte', 50, 130);
        doc.fillColor('#000000');
        
        doc.fontSize(9)
           .text('Inhaber: Florian Brach', 50, 140)
           .text('Adolf-Menzel-Straße 71', 50, 150)
           .text('12621 Berlin', 50, 160)
           .text('Tel: +49 (0)172 421 66 72', 50, 170)
           .text('Email: info@courierly.de', 50, 180)
           .text('Web: www.courierly.de', 50, 190)
           .text('USt-IdNr: DE299198928', 50, 200)
           .text('St.-Nr.: 33/237/00521', 50, 210);
        
        // Header - Right side (Invoice title)
        doc.fontSize(28).text('RECHNUNG', 350, 50, { align: 'right' });
        doc.fontSize(10)
           .text(`Nr: ${invoiceNumber}`, 350, 90, { align: 'right' })
           .text(`Datum: ${invoiceDate}`, 350, 110, { align: 'right' })
           .text(`Fällig: ${dueDateFormatted}`, 350, 130, { align: 'right' });
        
        // Customer info
        doc.fontSize(11).text('Rechnungsempfänger:', 50, 270);
        let customerY = 290;
        
        // Company name (if available)
        if (orders[0].customer_company) {
          doc.fontSize(10).text(orders[0].customer_company, 50, customerY);
          customerY += 10;
        }
        
        // Name
        doc.fontSize(10).text(`${orders[0].customer_first_name || ''} ${orders[0].customer_last_name || ''}`.trim(), 50, customerY);
        customerY += 10;
        
        // Street
        if (orders[0].customer_street) {
          doc.text(orders[0].customer_street, 50, customerY);
          customerY += 10;
        }
        
        // Postal code + City
        if (orders[0].customer_postal_code || orders[0].customer_city) {
          doc.text(`${orders[0].customer_postal_code || ''} ${orders[0].customer_city || ''}`.trim(), 50, customerY);
          customerY += 10;
        }
        
        // Email
        if (orders[0].customer_email) {
          doc.text(orders[0].customer_email, 50, customerY);
          customerY += 10;
        }
        
        // Phone (if available)
        if (orders[0].customer_phone) {
          doc.text(orders[0].customer_phone, 50, customerY);
          customerY += 15;
        }
        
        // Table header
        doc.fontSize(11).text('Leistungen:', 50, 350);
        doc.moveTo(50, 370).lineTo(550, 370).stroke();
        
        // Table columns
        let y = 385;
        doc.fontSize(9).fillColor('#6b7280')
           .text('Auftrag', 50, y)
           .text('Route', 150, y)
           .text('Datum', 350, y)
           .text('Betrag', 480, y, { align: 'right' });
        doc.fillColor('#000000');
        y += 20;
        
        // Orders
        orders.forEach((order, idx) => {
          const price = parseFloat(order.price) || 0;
          const waitingFee = order.waiting_time_approved ? (parseFloat(order.waiting_time_fee) || 0) : 0;
          
          // Build full pickup address
          let pickupLocation = '';
          if (order.pickup_address) {
            pickupLocation = order.pickup_address;
            if (order.pickup_postal_code && order.pickup_city) {
              pickupLocation += `, ${order.pickup_postal_code} ${order.pickup_city}`;
            } else if (order.pickup_city) {
              pickupLocation += `, ${order.pickup_city}`;
            }
          } else if (order.pickup_postal_code && order.pickup_city) {
            pickupLocation = `${order.pickup_postal_code} ${order.pickup_city}`;
          } else {
            pickupLocation = order.pickup_city || 'N/A';
          }
          
          // Build full delivery address
          let deliveryLocation = '';
          if (order.delivery_address) {
            deliveryLocation = order.delivery_address;
            if (order.delivery_postal_code && order.delivery_city) {
              deliveryLocation += `, ${order.delivery_postal_code} ${order.delivery_city}`;
            } else if (order.delivery_city) {
              deliveryLocation += `, ${order.delivery_city}`;
            }
          } else if (order.delivery_postal_code && order.delivery_city) {
            deliveryLocation = `${order.delivery_postal_code} ${order.delivery_city}`;
          } else {
            deliveryLocation = order.delivery_city || 'N/A';
          }
          
          const route = `${pickupLocation} - ${deliveryLocation}`;
          doc.fontSize(10)
             .text(`#${order.id}`, 50, y)
             .text(route, 150, y, { width: 180 })
             .text(new Date(order.created_at).toLocaleDateString('de-DE'), 350, y)
             .text(`€ ${price.toFixed(2)}`, 480, y, { align: 'right' });
          
          y += 15;
          
          if (waitingFee > 0) {
            doc.fontSize(8).fillColor('#f59e0b')
               .text(`zzgl. € ${waitingFee.toFixed(2)} Wartezeit`, 480, y, { align: 'right' });
            doc.fillColor('#000000').fontSize(10);
            y += 15;
          }
        });
        
        y += 20;
        
        // Totals
        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 15;
        
        doc.fontSize(10)
           .text('Zwischensumme (Fahrten):', 350, y)
           .text(`€ ${totals.subtotal.toFixed(2)}`, 480, y, { align: 'right' });
        y += 15;
        
        if (totals.waitingTimeFees > 0) {
          doc.fillColor('#f59e0b')
             .text('Wartezeit-Gebühren:', 350, y)
             .text(`€ ${totals.waitingTimeFees.toFixed(2)}`, 480, y, { align: 'right' });
          doc.fillColor('#000000');
          y += 15;
        }
        
        doc.text('Nettobetrag:', 350, y)
           .text(`€ ${totals.total.toFixed(2)}`, 480, y, { align: 'right' });
        y += 15;
        
        const pdfTaxAmount = totals.total * 0.19;
        doc.text('zzgl. 19% MwSt.:', 350, y)
           .text(`€ ${pdfTaxAmount.toFixed(2)}`, 480, y, { align: 'right' });
        y += 20;
        
        doc.fontSize(12).fillColor('#16a34a')
           .text('Gesamtbetrag:', 350, y)
           .text(`€ ${(totals.total + pdfTaxAmount).toFixed(2)}`, 480, y, { align: 'right' });
        doc.fillColor('#000000').fontSize(10);
        
        if (notes) {
          y += 30;
          doc.fontSize(10).text('Anmerkungen:', 50, y);
          y += 15;
          doc.fontSize(9).text(notes, 50, y);
          y += 30;
        } else {
          y += 30;
        }
        
        // Bank details
        doc.fontSize(10).text('Zahlungsinformationen:', 50, y);
        y += 15;
        doc.fontSize(9)
           .text('Bank: Berliner Sparkasse', 50, y)
           .text('IBAN: DE92 1005 0000 1062 9152 80', 50, y + 15)
           .text('BIC: BELADEBEXXX', 50, y + 30);
        
        // Footer
        y += 60;
        doc.fontSize(8).fillColor('#6b7280')
           .text('Vielen Dank für Ihr Vertrauen! | Courierly – eine Marke der FB Transporte', 50, y, { align: 'center', width: 500 })
           .text('Adolf-Menzel Straße 71 | 12621 Berlin | DE 92 1005 0000 1062 9152 80 | BELADEBEXXX', 50, y + 12, { align: 'center', width: 500 })
           .text('USt-IdNr: DE299198928 | Steuernummer: 33/237/00521', 50, y + 24, { align: 'center', width: 500 });
        
        doc.end();
        
        // Wait for PDF to be generated
        await new Promise((resolve) => {
          doc.on('end', resolve);
        });
        
        const pdfBuffer = Buffer.concat(chunks);
        
        // Send email with PDF attachment
        await sendEmail(
          invoiceEmail,
          `Sammelrechnung ${invoiceNumber} von Courierly`,
          `
            <h2>Ihre Sammelrechnung von Courierly</h2>
            <p>Sehr geehrte/r ${orders[0].customer_first_name} ${orders[0].customer_last_name},</p>
            <p>anbei erhalten Sie Ihre Sammelrechnung für ${orders.length} Auftrag${orders.length > 1 ? 'e' : ''} als PDF-Anhang.</p>
            
            <h3>Rechnungsdetails:</h3>
            <p><strong>Rechnungsnummer:</strong> ${invoiceNumber}<br>
            <strong>Rechnungsdatum:</strong> ${invoiceDate}<br>
            <strong>Fälligkeitsdatum:</strong> ${dueDateFormatted}<br>
            <strong>Gesamtsumme:</strong> €${totals.total.toFixed(2)}</p>
            
            <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
            <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          `,
          [{
            filename: `Rechnung_${invoiceNumber}.pdf`,
            content: pdfBuffer
          }]
        );
        
        console.log('✅ Email with PDF sent to:', invoiceEmail);
        
        // Now upload PDF to Cloudinary (non-critical, can fail)
        try {
          const cloudinary = require('../config/cloudinary');
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'invoices',
                public_id: `invoice_${invoiceNumber}`,
                format: 'pdf'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            uploadStream.end(pdfBuffer);
          });
          
          console.log('☁️ PDF uploaded to Cloudinary:', uploadResult.secure_url);
          
          // Update invoice with PDF URL
          await pool.query(
            `UPDATE sent_invoices SET pdf_url = $1 WHERE invoice_number = $2`,
            [uploadResult.secure_url, invoiceNumber]
          );
          
          console.log('✅ Invoice PDF URL saved');
        } catch (cloudinaryError) {
          console.error('⚠️ Cloudinary upload failed (non-critical):', cloudinaryError.message);
          // Don't fail the request - invoice is already saved
        }
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
