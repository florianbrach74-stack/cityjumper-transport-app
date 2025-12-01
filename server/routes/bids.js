const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  createBid,
  updateBid,
  getBidsForOrder,
  getMyBids,
  acceptBid,
  rejectBid,
  withdrawBid,
} = require('../controllers/bidController');

// All routes require authentication
router.use(authenticateToken);

// Contractor routes
router.post('/orders/:orderId/bid', authorizeRole('contractor'), createBid);
router.patch('/:bidId', authorizeRole('contractor'), updateBid);
router.get('/my-bids', authorizeRole('contractor'), getMyBids);
router.delete('/:bidId/withdraw', authorizeRole('contractor'), withdrawBid);

// Admin routes
router.get('/orders/:orderId', authorizeRole('admin'), getBidsForOrder);
router.post('/:bidId/accept', authorizeRole('admin'), acceptBid);
router.post('/:bidId/reject', authorizeRole('admin'), rejectBid);
router.patch('/:bidId/price', authorizeRole('admin'), async (req, res) => {
  try {
    const { bidId } = req.params;
    const { bid_amount } = req.body;
    
    if (!bid_amount || bid_amount <= 0) {
      return res.status(400).json({ error: 'Ungültiger Preis' });
    }
    
    const pool = require('../config/database');
    
    // Check if bid exists and is pending
    const bidCheck = await pool.query(
      'SELECT * FROM order_bids WHERE id = $1',
      [bidId]
    );
    
    if (bidCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Bewerbung nicht gefunden' });
    }
    
    if (bidCheck.rows[0].status !== 'pending') {
      return res.status(400).json({ error: 'Nur ausstehende Bewerbungen können bearbeitet werden' });
    }
    
    // Update bid amount
    await pool.query(
      'UPDATE order_bids SET bid_amount = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [bid_amount, bidId]
    );
    
    res.json({ 
      success: true, 
      message: 'Preis erfolgreich aktualisiert',
      bid_amount 
    });
  } catch (error) {
    console.error('Error updating bid price:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Preises' });
  }
});

module.exports = router;
