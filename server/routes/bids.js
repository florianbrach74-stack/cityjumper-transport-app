const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
  createBid,
  getBidsForOrder,
  getMyBids,
  acceptBid,
  rejectBid,
} = require('../controllers/bidController');

// All routes require authentication
router.use(authenticateToken);

// Contractor routes
router.post('/orders/:orderId/bid', authorizeRole('contractor'), createBid);
router.get('/my-bids', authorizeRole('contractor'), getMyBids);

// Admin routes
router.get('/orders/:orderId', authorizeRole('admin'), getBidsForOrder);
router.post('/:bidId/accept', authorizeRole('admin'), acceptBid);
router.post('/:bidId/reject', authorizeRole('admin'), rejectBid);

module.exports = router;
