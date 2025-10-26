const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const User = require('../models/User');
const { sendEmail, emailTemplates } = require('../config/email');
const { createCMRForOrder } = require('./cmrController');
const { sendNewOrderNotification } = require('../utils/emailService');
const pool = require('../config/database');

const createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Ensure only customers can create orders
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create orders' });
    }

    const orderData = {
      ...req.body,
      customer_id: req.user.id,
    };

    const order = await Order.create(orderData);

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

    // Notify contractors in the postal code area
    try {
      const contractors = await pool.query(
        `SELECT email, first_name, last_name FROM users 
         WHERE role = 'contractor' 
         AND notification_postal_codes IS NOT NULL 
         AND ($1 = ANY(notification_postal_codes) OR $2 = ANY(notification_postal_codes))`,
        [orderData.pickup_postal_code, orderData.delivery_postal_code]
      );

      for (const contractor of contractors.rows) {
        await sendNewOrderNotification(contractor.email, order);
      }
      console.log(`✅ Notified ${contractors.rows.length} contractors about new order`);
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
    // Contractors see their accepted orders
    else if (req.user.role === 'contractor') {
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

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Server error while fetching order' });
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
      await createCMRForOrder(id);
      console.log('✅ CMR document created for order', id);
    } catch (cmrError) {
      console.error('❌ Error creating CMR:', cmrError);
      // Don't fail the order acceptance if CMR creation fails
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

    const validStatuses = ['pending', 'accepted', 'in_transit', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization
    if (
      req.user.role === 'customer' && order.customer_id !== req.user.id ||
      req.user.role === 'contractor' && order.contractor_id !== req.user.id
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedOrder = await Order.updateStatus(id, status);
    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error while updating order status' });
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
