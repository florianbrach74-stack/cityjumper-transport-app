const express = require('express');
const router = express.Router();
const SavedRoute = require('../models/SavedRoute');
const auth = require('../middleware/auth');

// Get all saved routes for the authenticated customer
router.get('/', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    const routes = await SavedRoute.findByCustomerId(customerId);
    res.json({ routes });
  } catch (error) {
    console.error('Get saved routes error:', error);
    // If table doesn't exist yet, return empty array instead of error
    if (error.code === '42P01') {
      console.warn('saved_routes table does not exist yet - returning empty array');
      return res.json({ routes: [] });
    }
    res.status(500).json({ error: 'Fehler beim Laden der gespeicherten Routen' });
  }
});

// Get a specific saved route
router.get('/:id', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    
    const route = await SavedRoute.findById(id, customerId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    res.json({ route });
  } catch (error) {
    console.error('Get saved route error:', error);
    if (error.code === '42P01') {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    res.status(500).json({ error: 'Fehler beim Laden der Route' });
  }
});

// Create a new saved route
router.post('/', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Validate required fields
    const {
      route_name,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      delivery_address,
      delivery_city,
      delivery_postal_code
    } = req.body;
    
    if (!route_name || !pickup_address || !pickup_city || !pickup_postal_code ||
        !delivery_address || !delivery_city || !delivery_postal_code) {
      return res.status(400).json({ 
        error: 'Bitte alle Pflichtfelder ausfüllen' 
      });
    }
    
    const route = await SavedRoute.create(customerId, req.body);
    res.status(201).json({ 
      message: 'Route erfolgreich gespeichert',
      route 
    });
  } catch (error) {
    console.error('Create saved route error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Eine Route mit diesem Namen existiert bereits' 
      });
    }
    
    res.status(500).json({ error: 'Fehler beim Speichern der Route' });
  }
});

// Update a saved route
router.put('/:id', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    
    // Validate required fields
    const {
      route_name,
      pickup_address,
      pickup_city,
      pickup_postal_code,
      delivery_address,
      delivery_city,
      delivery_postal_code
    } = req.body;
    
    if (!route_name || !pickup_address || !pickup_city || !pickup_postal_code ||
        !delivery_address || !delivery_city || !delivery_postal_code) {
      return res.status(400).json({ 
        error: 'Bitte alle Pflichtfelder ausfüllen' 
      });
    }
    
    const route = await SavedRoute.update(id, customerId, req.body);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    res.json({ 
      message: 'Route erfolgreich aktualisiert',
      route 
    });
  } catch (error) {
    console.error('Update saved route error:', error);
    
    // Handle unique constraint violation
    if (error.code === '23505') {
      return res.status(400).json({ 
        error: 'Eine Route mit diesem Namen existiert bereits' 
      });
    }
    
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Route' });
  }
});

// Delete a saved route
router.delete('/:id', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    
    const route = await SavedRoute.delete(id, customerId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    res.json({ message: 'Route erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete saved route error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Route' });
  }
});

// Increment usage count (called when route is used for an order)
router.post('/:id/use', auth, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { id } = req.params;
    
    const route = await SavedRoute.incrementUsage(id, customerId);
    if (!route) {
      return res.status(404).json({ error: 'Route nicht gefunden' });
    }
    
    res.json({ route });
  } catch (error) {
    console.error('Increment usage error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Nutzungsstatistik' });
  }
});

module.exports = router;
