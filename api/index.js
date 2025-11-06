const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Routes - mount without /api prefix since Vercel handles that
app.use('/auth', require('../server/routes/auth'));
app.use('/orders', require('../server/routes/orders'));
app.use('/cmr', require('../server/routes/cmr'));
app.use('/pricing', require('../server/routes/pricing'));
app.use('/reports', require('../server/routes/reports'));
app.use('/admin', require('../server/routes/admin'));
app.use('/bids', require('../server/routes/bids'));
app.use('/verification', require('../server/routes/verification'));
app.use('/users', require('../server/routes/users'));
app.use('/contractors', require('../server/routes/contractors'));
app.use('/employees', require('../server/routes/employees'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CityJumper API is running',
    env: {
      hasDB: !!process.env.DB_HOST,
      hasJWT: !!process.env.JWT_SECRET,
      hasEmail: !!process.env.EMAIL_HOST
    }
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'CityJumper API', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.url });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Export for Vercel
module.exports = app;
