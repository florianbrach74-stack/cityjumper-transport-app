const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getAvailableOrders,
  getOrderById,
  acceptOrder,
  updateOrderStatus,
  createOrderValidation,
} = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get available orders (contractors only)
router.get('/available', authorizeRole('contractor'), getAvailableOrders);

// Get user's orders
router.get('/', getOrders);

// Create new order (customers only)
router.post('/', authorizeRole('customer'), createOrderValidation, createOrder);

// Get specific order
router.get('/:id', getOrderById);

// Accept order (contractors only)
router.put('/:id/accept', authorizeRole('contractor'), acceptOrder);

// Update order status
router.put('/:id/status', updateOrderStatus);

module.exports = router;
