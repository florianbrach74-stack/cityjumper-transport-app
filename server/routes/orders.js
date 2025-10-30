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
const pool = require('../config/database');

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

// Update order price (customers only, for pending orders)
router.put('/:id/price', authorizeRole('customer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    const userId = req.user.id;

    // Validate price
    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Ungültiger Preis' });
    }

    // Get order
    const orderResult = await pool.query(
      'SELECT * FROM transport_orders WHERE id = $1',
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Auftrag nicht gefunden' });
    }

    const order = orderResult.rows[0];

    // Check if user owns the order
    if (order.customer_id !== userId) {
      return res.status(403).json({ message: 'Nicht autorisiert' });
    }

    // Only allow price updates for pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Preis kann nur für ausstehende Aufträge geändert werden' });
    }

    // Price must be higher than current price
    if (price <= order.price) {
      return res.status(400).json({ message: 'Neuer Preis muss höher sein als der aktuelle Preis' });
    }

    // Calculate contractor price (85% of customer price, 15% platform commission)
    const contractorPrice = Math.round(price * 0.85 * 100) / 100;

    // Store original price if this is the first update
    if (!order.minimum_price_at_creation) {
      await pool.query(
        'UPDATE transport_orders SET minimum_price_at_creation = $1 WHERE id = $2',
        [order.price, id]
      );
    }

    // Update price, contractor_price, and price_updated_at
    await pool.query(
      'UPDATE transport_orders SET price = $1, contractor_price = $2, price_updated_at = NOW(), updated_at = NOW() WHERE id = $3',
      [price, contractorPrice, id]
    );

    res.json({ 
      message: 'Preis erfolgreich aktualisiert',
      newPrice: price,
      contractorPrice: contractorPrice
    });
  } catch (error) {
    console.error('Error updating order price:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Preises' });
  }
});

module.exports = router;
