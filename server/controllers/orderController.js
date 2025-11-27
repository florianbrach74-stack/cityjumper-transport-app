const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/email');
const { createCMRForOrder } = require('./cmrController');
const { sendNewOrderNotification } = require('../utils/emailService');
const { calculateDistanceAndDuration } = require('../services/distanceService');
const pool = require('../config/database');

const createOrder = async (req, res) => {
  try {
    console.log('Creating order with data:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure only customers can create orders
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create orders' });
    }

    // VALIDATION 1: Pickup date must be in the future
    const pickupDate = new Date(req.body.pickup_date);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
    
    if (pickupDate < now) {
      return res.status(400).json({ 
        error: 'Das Abholdatum muss in der Zukunft liegen' 
      });
    }

    // VALIDATION 2: Time window must be at least 30 minutes
    if (req.body.pickup_time_from && req.body.pickup_time_to) {
      const timeFrom = req.body.pickup_time_from.split(':');
      const timeTo = req.body.pickup_time_to.split(':');
      
      const minutesFrom = parseInt(timeFrom[0]) * 60 + parseInt(timeFrom[1]);
      const minutesTo = parseInt(timeTo[0]) * 60 + parseInt(timeTo[1]);
      
      const diffMinutes = minutesTo - minutesFrom;
      
      if (diffMinutes < 30) {
        return res.status(400).json({ 
          error: 'Das Zeitfenster muss mindestens 30 Minuten betragen' 
        });
      }
    }

    const orderData = {
      ...req.body,
      customer_id: req.user.id,
      // Ensure required fields have defaults
      pickup_country: req.body.pickup_country || 'Deutschland',
      delivery_country: req.body.delivery_country || 'Deutschland',
      pickup_contact_name: req.body.pickup_contact_name || '',
      pickup_contact_phone: req.body.pickup_contact_phone || '',
      delivery_contact_name: req.body.delivery_contact_name || '',
      delivery_contact_phone: req.body.delivery_contact_phone || '',
      weight: req.body.weight || null,
      length: req.body.length || null,
      width: req.body.width || null,
      height: req.body.height || null,
      pallets: req.body.pallets || null,
      description: req.body.description || '',
      special_requirements: req.body.special_requirements || '',
      // Beiladungs-Daten
      is_partial_load: req.body.is_partial_load || false,
      minimum_price_at_creation: req.body.minimum_price_at_creation || null,
      // Widerrufsbelehrung-Zustimmung
      withdrawal_consent_given: req.body.withdrawal_consent_given || false,
      withdrawal_consent_timestamp: req.body.withdrawal_consent_given ? new Date() : null,
      withdrawal_consent_ip: req.body.withdrawal_consent_given ? req.ip : null,
      // Belade-/Entlade-Hilfe
      needs_loading_help: req.body.needs_loading_help || false,
      needs_unloading_help: req.body.needs_unloading_help || false,
      loading_help_fee: req.body.loading_help_fee || 0,
      // Rechtssichere Zustellung
      legal_delivery: req.body.legal_delivery || false,
    };
    
    // Wenn Beiladung, setze Deadline auf 7 Tage
    if (orderData.is_partial_load) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      orderData.partial_load_deadline = deadline.toISOString().split('T')[0];
    }

    console.log('Processed order data:', orderData);
    
    // Handle multi-stop orders
    const pickupStops = req.body.pickup_stops || [];
    const deliveryStops = req.body.delivery_stops || [];
    
    let totalDistance = 0;
    let totalDuration = 0;
    
    if (pickupStops.length > 0 || deliveryStops.length > 0) {
      // Multi-stop order - store stops without calculating route (route is calculated in frontend)
      console.log('Processing multi-stop order:', { pickupStops: pickupStops.length, deliveryStops: deliveryStops.length });
      
      // Store stops in database
      orderData.pickup_stops = JSON.stringify(pickupStops);
      orderData.delivery_stops = JSON.stringify(deliveryStops);
      
      // Calculate extra stops fee
      const totalStops = pickupStops.length + deliveryStops.length;
      orderData.extra_stops_count = Math.max(0, totalStops);
      orderData.extra_stops_fee = orderData.extra_stops_count * 6.00; // 6€ per extra stop
      
      console.log(`Multi-stop: ${totalStops} stops, fee: €${orderData.extra_stops_fee}`);
      
      // For multi-stop, use estimated distance/duration (route was calculated in frontend)
      // Set to 0 or use default values - actual route is in frontend
      totalDistance = 0;
      totalDuration = 0;
    } else {
      // Single pickup/delivery
      const { distance_km, duration_minutes, route_geometry } = await calculateDistanceAndDuration(
        orderData.pickup_address,
        orderData.pickup_postal_code,
        orderData.pickup_city,
        orderData.delivery_address,
        orderData.delivery_postal_code,
        orderData.delivery_city
      );
      
      totalDistance = distance_km;
      totalDuration = duration_minutes;
      
      if (route_geometry) {
        orderData.route_geometry = JSON.stringify(route_geometry);
      }
    }
    
    // Add calculated values to order data
    orderData.distance_km = totalDistance;
    orderData.duration_minutes = totalDuration;
    
    const order = await Order.create(orderData);
    console.log('Order created successfully:', order.id);

    // Send email notification to customer
    try {
      const customer = await User.findById(req.user.id);
      const customerName = `${customer.first_name} ${customer.last_name}`;
      const emailContent = emailTemplates.orderCreated(order, customerName);
      await sendEmail(customer.email, emailContent.subject, emailContent.html);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    // Notify ALL verified contractors about new order
    try {
      const contractors = await pool.query(
        `SELECT email, first_name, last_name FROM users 
         WHERE role = 'contractor' 
         AND account_status = 'verified'
         AND email IS NOT NULL`
      );

      console.log(`📧 Sending new order notifications to ${contractors.rows.length} contractors...`);
      
      for (const contractor of contractors.rows) {
        try {
          await sendNewOrderNotification(contractor.email, order);
          console.log(`  ✅ Notified ${contractor.first_name} ${contractor.last_name}`);
        } catch (emailError) {
          console.error(`  ❌ Failed to notify ${contractor.email}:`, emailError.message);
        }
      }
      
      console.log(`✅ Notified ${contractors.rows.length} contractors about new order #${order.id}`);
    } catch (notifyError) {
      console.error('Error notifying contractors:', notifyError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Server error while creating order' });
  }
};

const getOrders = async (req, res) => {
  try {
    let filters = {};

    // Customers see only their orders
    if (req.user.role === 'customer') {
      filters.customer_id = req.user.id;
    }
    // Contractors see their accepted orders + all orders from their employees
    else if (req.user.role === 'contractor') {
      // Get orders where contractor is assigned OR where any employee of this contractor is assigned
      const result = await pool.query(
        `SELECT o.* FROM transport_orders o
         LEFT JOIN users u ON o.contractor_id = u.id
         WHERE o.contractor_id = $1 OR (u.company_id = $1 AND u.role = 'employee')
         ORDER BY o.created_at DESC`,
        [req.user.id]
      );
      return res.json({ orders: result.rows });
    }
    // Employees see only their own orders
    else if (req.user.role === 'employee') {
      filters.contractor_id = req.user.id;
    }

    const orders = await Order.getAll(filters);
    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Server error while fetching orders' });
  }
};

const getAvailableOrders = async (req, res) => {
  try {
    // Only contractors can see available orders
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can view available orders' });
    }

    const orders = await Order.getAvailableOrders();
    res.json({ orders });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Server error while fetching available orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (
      req.user.role === 'customer' && order.customer_id !== req.user.id ||
      req.user.role === 'contractor' && order.contractor_id !== req.user.id && order.status !== 'pending'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.status(201).json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Server error while fetching order',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Only contractors can accept orders
    if (req.user.role !== 'contractor') {
      return res.status(403).json({ error: 'Only contractors can accept orders' });
    }

    const order = await Order.acceptOrder(id, req.user.id);

    if (!order) {
      return res.status(400).json({ error: 'Order not found or already accepted' });
    }

    // Get full order details with customer info
    const fullOrder = await Order.findById(id);

    // Create CMR document automatically
    try {
      console.log('🔄 Creating CMR for order', id);
      const cmr = await createCMRForOrder(id);
      console.log('✅ CMR document created:', cmr.cmr_number);
    } catch (cmrError) {
      console.error('❌ Error creating CMR:', cmrError);
      console.error('CMR Error stack:', cmrError.stack);
      // Don't fail the order acceptance if CMR creation fails
      // But log it for debugging
    }

    // Send email notifications
    try {
      const contractor = await User.findById(req.user.id);
      const customer = await User.findById(order.customer_id);
      
      const contractorName = contractor.company_name || `${contractor.first_name} ${contractor.last_name}`;
      const customerName = `${customer.first_name} ${customer.last_name}`;

      // Email to customer
      const customerEmail = emailTemplates.orderAccepted(fullOrder, contractorName, customerName);
      await sendEmail(customer.email, customerEmail.subject, customerEmail.html);

      // Email to contractor
      const contractorEmail = emailTemplates.orderAcceptedContractor(fullOrder, contractorName);
      await sendEmail(contractor.email, contractorEmail.subject, contractorEmail.html);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      message: 'Order accepted successfully',
      order: fullOrder,
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Server error while accepting order' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (req.user.role === 'contractor' && order.contractor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedOrder = await Order.updateStatus(id, status);
    
    // Send email notifications based on status
    try {
      const customer = await User.findById(order.customer_id);
      const contractor = await User.findById(order.contractor_id);
      
      if (status === 'picked_up') {
        // Email to customer when order is picked up
        await sendEmail(
          customer.email,
          '📦 Sendung abgeholt - Auftrag in Bearbeitung',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0ea5e9;">Sendung wurde abgeholt</h2>
              <p>Hallo ${customer.first_name} ${customer.last_name},</p>
              <p>Ihr Transportauftrag wurde erfolgreich abgeholt und ist nun unterwegs.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Auftrags-Details:</h3>
                <p><strong>Auftrag:</strong> #${order.id}</p>
                <p><strong>Abholung:</strong> ${order.pickup_address}, ${order.pickup_city}</p>
                <p><strong>Ziel:</strong> ${order.delivery_address}, ${order.delivery_city}</p>
                <p><strong>Fahrer:</strong> ${contractor.company_name || contractor.first_name + ' ' + contractor.last_name}</p>
              </div>
              
              <p>Sie werden benachrichtigt, sobald die Sendung zugestellt wurde.</p>
              
              <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
            </div>
          `
        );
      } else if (status === 'delivered') {
        // Email to customer when order is delivered (before signature)
        await sendEmail(
          customer.email,
          '🚚 Sendung zugestellt - Warte auf Unterschrift',
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #16a34a;">Sendung wurde zugestellt</h2>
              <p>Hallo ${customer.first_name} ${customer.last_name},</p>
              <p>Ihr Transportauftrag wurde zugestellt. Der Empfänger wird nun um Unterschrift gebeten.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Auftrags-Details:</h3>
                <p><strong>Auftrag:</strong> #${order.id}</p>
                <p><strong>Zugestellt an:</strong> ${order.delivery_address}, ${order.delivery_city}</p>
                <p><strong>Zugestellt am:</strong> ${new Date().toLocaleString('de-DE')}</p>
              </div>
              
              <p>Sie erhalten eine weitere Email sobald der Empfänger das CMR-Dokument unterschrieben hat.</p>
              
              <p style="margin-top: 30px;">Mit freundlichen Grüßen,<br>Ihr Courierly Team</p>
            </div>
          `
        );
      }
    } catch (emailError) {
      console.error('Error sending status email:', emailError);
      // Don't fail the status update if email fails
    }
    
    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Server error while updating order status',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Validation rules
const createOrderValidation = [
  body('pickup_address').notEmpty().trim(),
  body('pickup_city').notEmpty().trim(),
  body('pickup_postal_code').notEmpty().trim(),
  body('pickup_date').isDate(),
  body('delivery_address').notEmpty().trim(),
  body('delivery_city').notEmpty().trim(),
  body('delivery_postal_code').notEmpty().trim(),
  body('vehicle_type').notEmpty().trim(),
];

module.exports = {
  createOrder,
  getOrders,
  getAvailableOrders,
  getOrderById,
  acceptOrder,
  updateOrderStatus,
  createOrderValidation,
};
