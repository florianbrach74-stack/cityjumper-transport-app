const express = require('express');
const router = express.Router();
const { calculatePriceBreakdown, validatePrice } = require('../utils/priceCalculator');

// Calculate price based on route
router.post('/calculate', async (req, res) => {
  try {
    const { distanceKm, durationMinutes } = req.body;

    if (!distanceKm || !durationMinutes) {
      return res.status(400).json({ 
        error: 'Distanz und Fahrzeit sind erforderlich' 
      });
    }

    const priceInfo = calculatePriceBreakdown(distanceKm, durationMinutes);

    res.json({
      success: true,
      ...priceInfo
    });
  } catch (error) {
    console.error('Price calculation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Validate proposed price
router.post('/validate', async (req, res) => {
  try {
    const { proposedPrice, distanceKm, durationMinutes } = req.body;

    if (!proposedPrice || !distanceKm || !durationMinutes) {
      return res.status(400).json({ 
        error: 'Preis, Distanz und Fahrzeit sind erforderlich' 
      });
    }

    const validation = validatePrice(
      parseFloat(proposedPrice),
      parseFloat(distanceKm),
      parseFloat(durationMinutes)
    );

    res.json({
      success: true,
      ...validation
    });
  } catch (error) {
    console.error('Price validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
