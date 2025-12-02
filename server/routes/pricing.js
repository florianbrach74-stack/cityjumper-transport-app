const express = require('express');
const router = express.Router();
const { calculatePriceBreakdown, validatePrice } = require('../utils/priceCalculator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const pool = require('../config/database');
const { calculateDistanceAndDuration } = require('../services/distanceService');

// In-memory cache for geocoding results (reduces API calls)
const geocodeCache = new Map();
const CACHE_MAX_SIZE = 1000; // Store max 1000 addresses
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Geocode using LocationIQ (OpenStreetMap-based, free tier with hard limits)
// FREE: 10,000 requests/day - NO credit card needed, CANNOT become expensive
router.post('/geocode', async (req, res) => {
  try {
    const { fullAddress } = req.body;

    if (!fullAddress) {
      return res.status(400).json({ 
        error: 'Adresse ist erforderlich' 
      });
    }

    // Normalize address for cache key
    const cacheKey = fullAddress.toLowerCase().trim();
    
    // Check cache first
    const cached = geocodeCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`💾 Cache hit: ${fullAddress}`);
      return res.json(cached.data);
    }

    const axios = require('axios');
    const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
    
    if (!LOCATIONIQ_API_KEY) {
      console.error('❌ LOCATIONIQ_API_KEY not configured');
      return res.status(500).json({ 
        error: 'Geocoding service not configured' 
      });
    }
    
    console.log(`🔍 Geocoding with LocationIQ: ${fullAddress}`);
    
    const response = await axios.get('https://us1.locationiq.com/v1/search', {
      params: {
        q: fullAddress,
        key: LOCATIONIQ_API_KEY,
        format: 'json',
        countrycodes: 'de',
        limit: 1,
        addressdetails: 1
      },
      timeout: 10000
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      
      const responseData = {
        success: true,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        display_name: result.display_name
      };
      
      // Store in cache (limit size)
      if (geocodeCache.size >= CACHE_MAX_SIZE) {
        const firstKey = geocodeCache.keys().next().value;
        geocodeCache.delete(firstKey);
      }
      geocodeCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });
      
      console.log(`✅ Geocoded: ${result.display_name} (cached)`);
      return res.json(responseData);
    }
    
    res.status(404).json({ 
      error: 'Adresse konnte nicht gefunden werden'
    });
  } catch (error) {
    console.error('Geocoding error:', error.message);
    res.status(500).json({ 
      error: error.message || 'Fehler beim Geocoding' 
    });
  }
});

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

    // For multistop routes, calculate exact distance for each segment
    console.log(`📍 Calculating multistop route: ${pickupStops.length} pickup stops, ${deliveryStops.length} delivery stops`);
    
    let totalDistance = 0;
    let totalDuration = 0;
    const segments = [];

    // Build the complete route: Pickup → Pickup Stops → Delivery Stops → Delivery
    const allStops = [
      { address: pickupAddress, postal_code: pickupPostalCode, city: pickupCity, type: 'pickup' },
      ...pickupStops.map(s => ({ ...s, type: 'pickup_stop' })),
      ...deliveryStops.map(s => ({ ...s, type: 'delivery_stop' })),
      { address: deliveryAddress, postal_code: deliveryPostalCode, city: deliveryCity, type: 'delivery' }
    ];

    // Calculate distance for each segment (A→B, B→C, C→D, etc.)
    for (let i = 0; i < allStops.length - 1; i++) {
      const from = allStops[i];
      const to = allStops[i + 1];
      
      try {
        console.log(`  📏 Segment ${i + 1}: ${from.city} → ${to.city}`);
        
        const segmentRoute = await calculateDistanceAndDuration(
          from.address,
          from.postal_code,
          from.city,
          to.address,
          to.postal_code,
          to.city
        );
        
        totalDistance += segmentRoute.distance_km || 0;
        totalDuration += segmentRoute.duration_minutes || 0;
        
        segments.push({
          from: `${from.city}`,
          to: `${to.city}`,
          distance_km: segmentRoute.distance_km,
          duration_minutes: segmentRoute.duration_minutes
        });
        
        console.log(`     ✅ ${segmentRoute.distance_km}km, ${segmentRoute.duration_minutes}min`);
      } catch (error) {
        console.error(`     ❌ Segment ${i + 1} failed:`, error.message);
        throw new Error(`Fehler bei Segment ${i + 1}: ${from.city} → ${to.city}`);
      }
    }

    console.log(`✅ Multistop route calculated: ${totalDistance}km, ${totalDuration}min (${segments.length} segments)`);

    res.json({
      success: true,
      distance_km: totalDistance,
      duration_minutes: totalDuration,
      is_multistop: true,
      pickup_stops_count: pickupStops.length,
      delivery_stops_count: deliveryStops.length,
      segments: segments,
      total_stops: allStops.length
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
