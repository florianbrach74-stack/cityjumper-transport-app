const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

/**
 * Test-Endpoint: Zeige welche User vom Cleanup betroffen wären
 * LÖSCHT NICHTS - nur zur Überprüfung!
 */
router.get('/test-cleanup', adminAuth, async (req, res) => {
  try {
    // Zeige ALLE unverifizierte User älter als 2h
    const allUnverified = await pool.query(
      `SELECT id, email, role, "current_role", created_at, email_verified
       FROM users 
       WHERE email_verified = false 
       AND created_at < NOW() - INTERVAL '2 hours'
       ORDER BY created_at DESC`
    );
    
    // Zeige welche GELÖSCHT würden (ohne employees)
    const wouldBeDeleted = await pool.query(
      `SELECT id, email, role, "current_role", created_at, email_verified
       FROM users 
       WHERE email_verified = false 
       AND created_at < NOW() - INTERVAL '2 hours'
       AND role != 'employee'
       AND "current_role" != 'employee'
       ORDER BY created_at DESC`
    );
    
    // Zeige welche GESCHÜTZT sind (employees)
    const protected = await pool.query(
      `SELECT id, email, role, "current_role", created_at, email_verified
       FROM users 
       WHERE email_verified = false 
       AND created_at < NOW() - INTERVAL '2 hours'
       AND (role = 'employee' OR "current_role" = 'employee')
       ORDER BY created_at DESC`
    );
    
    res.json({
      summary: {
        totalUnverifiedOlderThan2h: allUnverified.rows.length,
        wouldBeDeleted: wouldBeDeleted.rows.length,
        protectedEmployees: protected.rows.length
      },
      allUnverified: allUnverified.rows.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        current_role: u.current_role,
        created_at: u.created_at,
        age_hours: Math.floor((Date.now() - new Date(u.created_at)) / (1000 * 60 * 60))
      })),
      wouldBeDeleted: wouldBeDeleted.rows.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        current_role: u.current_role,
        created_at: u.created_at,
        age_hours: Math.floor((Date.now() - new Date(u.created_at)) / (1000 * 60 * 60))
      })),
      protectedEmployees: protected.rows.map(u => ({
        id: u.id,
        email: u.email,
        role: u.role,
        current_role: u.current_role,
        created_at: u.created_at,
        age_hours: Math.floor((Date.now() - new Date(u.created_at)) / (1000 * 60 * 60)),
        reason: 'Employee - protected from cleanup'
      })),
      message: 'This is a TEST endpoint - nothing was deleted!'
    });
  } catch (error) {
    console.error('Test cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
