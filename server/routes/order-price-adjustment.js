const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

/**
 * Kunde kann Preis für nicht-vermittelten Auftrag anpassen
 * GET /api/orders/:id/price-adjustment - Zeigt Formular
 * POST /api/orders/:id/price-adjustment - Speichert neuen Preis
 */

// Get order details for price adjustment
router.get('/:id/price-adjustment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get order
    const orderResult = await pool.query(`
      SELECT * FROM transport_orders
      WHERE id = $1 AND customer_id = $2
    `, [id, userId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    const order = orderResult.rows[0];
    
    // Check if order is still pending and unassigned
    if (order.status !== 'pending' || order.contractor_id !== null) {
      return res.status(400).json({ 
        error: 'Auftrag kann nicht mehr angepasst werden',
        reason: order.contractor_id ? 'Bereits zugewiesen' : 'Status nicht pending'
      });
    }
    
    // Check if order is expired
    if (order.expired_and_archived) {
      return res.status(400).json({ 
        error: 'Auftrag ist bereits abgelaufen'
      });
    }
    
    res.json({
      success: true,
      order: {
        id: order.id,
        pickup_city: order.pickup_city,
        pickup_postal_code: order.pickup_postal_code,
        delivery_city: order.delivery_city,
        delivery_postal_code: order.delivery_postal_code,
        pickup_date: order.pickup_date,
        pickup_time_from: order.pickup_time_from,
        pickup_time_to: order.pickup_time_to,
        current_price: parseFloat(order.price),
        vehicle_type: order.vehicle_type
      }
    });
    
  } catch (error) {
    console.error('Error getting order for price adjustment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order price
router.post('/:id/price-adjustment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPrice } = req.body;
    const userId = req.user.id;
    
    // Validate new price
    if (!newPrice || newPrice <= 0) {
      return res.status(400).json({ error: 'Ungültiger Preis' });
    }
    
    // Get order
    const orderResult = await pool.query(`
      SELECT * FROM transport_orders
      WHERE id = $1 AND customer_id = $2
    `, [id, userId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Auftrag nicht gefunden' });
    }
    
    const order = orderResult.rows[0];
    
    // Check if order is still pending and unassigned
    if (order.status !== 'pending' || order.contractor_id !== null) {
      return res.status(400).json({ 
        error: 'Auftrag kann nicht mehr angepasst werden'
      });
    }
    
    // Check if order is expired
    if (order.expired_and_archived) {
      return res.status(400).json({ 
        error: 'Auftrag ist bereits abgelaufen'
      });
    }
    
    const oldPrice = parseFloat(order.price);
    
    // Update price
    await pool.query(`
      UPDATE transport_orders
      SET 
        price = $1,
        updated_at = NOW()
      WHERE id = $2
    `, [newPrice, id]);
    
    // Log price change
    await pool.query(`
      INSERT INTO order_price_history (order_id, old_price, new_price, changed_by_user_id, reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, oldPrice, newPrice, userId, 'Kundenanpassung nach Zeitfenster-Start']);
    
    console.log(`✅ Price adjusted for order #${id}: €${oldPrice} → €${newPrice}`);
    
    res.json({
      success: true,
      message: 'Preis erfolgreich angepasst',
      oldPrice,
      newPrice: parseFloat(newPrice),
      order_id: id
    });
    
  } catch (error) {
    console.error('Error adjusting order price:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
