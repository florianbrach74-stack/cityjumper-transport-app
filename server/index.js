const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase payload limit for file uploads (PDFs as base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/password-reset', require('./routes/password-reset'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cmr', require('./routes/cmr'));
app.use('/api/bids', require('./routes/bids'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/users', require('./routes/users'));
app.use('/api/setup', require('./routes/setup'));
app.use('/api/admin-setup', require('./routes/admin-setup'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/contractors', require('./routes/contractors'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/reports', require('./routes/reports'));

// Invoice routes temporarily disabled - Railway cache issue
// The invoiceController file exists but Railway is caching an old build
// Will be re-enabled once Railway cache clears

app.use('/api/cancellation', require('./routes/cancellation'));
app.use('/api', require('./routes/test-email'));
app.use('/api/employee-assignment', require('./routes/employee-assignment'));
app.use('/api', require('./routes/debug-employees'));
app.use('/api', require('./routes/run-migration'));
app.use('/api', require('./routes/create-verification-table'));
app.use('/api', require('./routes/migrate-existing-documents'));
app.use('/api', require('./routes/reset-verification-documents'));
app.use('/api', require('./routes/debug-verification-docs'));
app.use('/api', require('./routes/test-cloudinary'));
app.use('/api', require('./routes/fix-verification-documents-column'));

// Serve static files (CMR PDFs)
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Courierly API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API available at http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Run auto-migration
  try {
    const autoMigrate = require('./migrations/auto_migrate');
    await autoMigrate();
  } catch (error) {
    console.log('⚠️  Auto-migration skipped (database may not be ready yet)');
  }
});

module.exports = app;
