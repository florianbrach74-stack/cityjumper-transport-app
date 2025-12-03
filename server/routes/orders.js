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

    // Get current customer price (what customer actually pays)
    const currentCustomerPrice = parseFloat(order.original_customer_price || order.price);
    
    // Price must be higher than current customer price
    if (price <= currentCustomerPrice) {
      return res.status(400).json({ message: 'Neuer Preis muss höher sein als der aktuelle Preis' });
    }

    // Store original price if this is the first update
    if (!order.minimum_price_at_creation) {
      await pool.query(
        'UPDATE transport_orders SET minimum_price_at_creation = $1 WHERE id = $2',
        [currentCustomerPrice, id]
      );
    }

    // Calculate increase amount
    const increaseAmount = price - currentCustomerPrice;
    
    // Update both price (for contractors) and original_customer_price (for customer invoice)
    // If there's a platform bonus, maintain it by adding increase to both
    const newContractorPrice = parseFloat(order.price) + increaseAmount;
    const newOriginalCustomerPrice = price;
    
    await pool.query(
      'UPDATE transport_orders SET price = $1, original_customer_price = $2, price_updated_at = NOW(), updated_at = NOW() WHERE id = $3',
      [newContractorPrice, newOriginalCustomerPrice, id]
    );

    res.json({ 
      message: 'Preis erfolgreich aktualisiert',
      newPrice: price,
      originalCustomerPrice: newOriginalCustomerPrice,
      contractorPrice: order.contractor_price // Keep original contractor price
    });
  } catch (error) {
    console.error('Error updating order price:', error);
    res.status(500).json({ message: 'Serverfehler beim Aktualisieren des Preises' });
  }
});

module.exports = router;
