const express = require('express');
const router = express.Router();
const { calculatePriceBreakdown, validatePrice } = require('../utils/priceCalculator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');
const { calculateDistanceAndDuration } = require('../services/distanceService');

// Calculate route (distance and duration) between addresses (supports multistop)
router.post('/calculate-route', async (req, res) => {
  try {
    const { 
      pickupAddress, 
      pickupPostalCode, 
      pickupCity,
      deliveryAddress,
      deliveryPostalCode,
      deliveryCity,
      pickupStops = [],  // Optional: additional pickup stops
      deliveryStops = [] // Optional: additional delivery stops
    } = req.body;

    if (!pickupAddress || !pickupPostalCode || !pickupCity || 
        !deliveryAddress || !deliveryPostalCode || !deliveryCity) {
      return res.status(400).json({ 
        error: 'Alle Adressdaten sind erforderlich' 
      });
    }

    // For simple routes (no multistop), use existing service
    if (pickupStops.length === 0 && deliveryStops.length === 0) {
      const routeData = await calculateDistanceAndDuration(
        pickupAddress,
        pickupPostalCode,
        pickupCity,
        deliveryAddress,
        deliveryPostalCode,
        deliveryCity
      );

      return res.json({
        success: true,
        distance_km: routeData.distance_km,
        duration_minutes: routeData.duration_minutes,
        route_geometry: routeData.route_geometry
      });
    }

    // For multistop routes, calculate total distance
    console.log(`📍 Calculating multistop route: ${pickupStops.length} pickup stops, ${deliveryStops.length} delivery stops`);
    
    let totalDistance = 0;
    let totalDuration = 0;

    // Calculate main route (pickup to delivery)
    const mainRoute = await calculateDistanceAndDuration(
      pickupAddress,
      pickupPostalCode,
      pickupCity,
      deliveryAddress,
      deliveryPostalCode,
      deliveryCity
    );
    
    totalDistance += mainRoute.distance_km || 0;
    totalDuration += mainRoute.duration_minutes || 0;

    // Add pickup stops (estimate: +5km and +10min per stop)
    totalDistance += pickupStops.length * 5;
    totalDuration += pickupStops.length * 10;

    // Add delivery stops (estimate: +5km and +10min per stop)
    totalDistance += deliveryStops.length * 5;
    totalDuration += deliveryStops.length * 10;

    console.log(`✅ Multistop route calculated: ${totalDistance}km, ${totalDuration}min`);

    res.json({
      success: true,
      distance_km: totalDistance,
      duration_minutes: totalDuration,
      route_geometry: mainRoute.route_geometry,
      is_multistop: true,
      pickup_stops_count: pickupStops.length,
      delivery_stops_count: deliveryStops.length
    });
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(400).json({ 
      error: error.message || 'Fehler bei der Routenberechnung' 
    });
  }
});

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

// ============================================
// ADMIN ENDPOINTS - Pricing Settings Management
// ============================================

// Get all pricing settings (Admin only)
router.get('/settings', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pricing_settings ORDER BY setting_key'
    );
    
    res.json({
      success: true,
      settings: result.rows
    });
  } catch (error) {
    console.error('Get pricing settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a pricing setting (Admin only)
router.put('/settings/:key', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.id;

    if (value === undefined || value === null) {
      return res.status(400).json({ error: 'Wert ist erforderlich' });
    }

    // Validate value is a number
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return res.status(400).json({ error: 'Wert muss eine Zahl sein' });
    }

    // Update setting
    const result = await pool.query(
      `UPDATE pricing_settings 
       SET setting_value = $1, updated_at = NOW(), updated_by = $2 
       WHERE setting_key = $3 
       RETURNING *`,
      [numValue, userId, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Einstellung nicht gefunden' });
    }

    res.json({
      success: true,
      setting: result.rows[0],
      message: 'Einstellung erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Update pricing setting error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset all settings to defaults (Admin only)
router.post('/settings/reset', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const userId = req.user.id;

    await pool.query(`
      UPDATE pricing_settings SET
        setting_value = CASE setting_key
          WHEN 'distance_price_under_100km' THEN 0.50
          WHEN 'distance_price_over_100km' THEN 0.70
          WHEN 'hourly_rate' THEN 22.50
          WHEN 'start_fee' THEN 6.00
          WHEN 'extra_stop_fee' THEN 6.00
          WHEN 'platform_commission' THEN 15.00
          WHEN 'recommended_markup' THEN 20.00
          WHEN 'waiting_time_free_minutes' THEN 30
          WHEN 'waiting_time_block_minutes' THEN 5
          WHEN 'waiting_time_block_price' THEN 3.00
          ELSE setting_value
        END,
        updated_at = NOW(),
        updated_by = $1
    `, [userId]);

    const result = await pool.query('SELECT * FROM pricing_settings ORDER BY setting_key');

    res.json({
      success: true,
      settings: result.rows,
      message: 'Alle Einstellungen wurden auf Standardwerte zurückgesetzt'
    });
  } catch (error) {
    console.error('Reset pricing settings error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
