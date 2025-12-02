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
app.use('/api/cleanup', require('./routes/cleanup'));

// Invoice routes disabled - Railway persistent cache issue
// The invoiceController.js file exists on GitHub but Railway refuses to load it
// Even after 72+ hours, Railway is still caching an old build
// Workaround: Use manual PDF download and email sending for now

app.use('/api/cancellation', require('./routes/cancellation'));
app.use('/api', require('./routes/test-email'));
app.use('/api/employee-assignment', require('./routes/employee-assignment'));
app.use('/api', require('./routes/debug-employees'));
app.use('/api', require('./routes/run-migration'));
app.use('/api', require('./routes/run-invoice-migration'));
app.use('/api', require('./routes/run-invoice-tracking-migration'));
app.use('/api', require('./routes/create-verification-table'));
app.use('/api', require('./routes/migrate-existing-documents'));
app.use('/api', require('./routes/reset-verification-documents'));
app.use('/api', require('./routes/debug-verification-docs'));
app.use('/api', require('./routes/test-cloudinary'));
app.use('/api', require('./routes/fix-verification-documents-column'));
app.use('/api', require('./routes/test-update-order'));
app.use('/api', require('./routes/run-loading-help-migration'));
app.use('/api', require('./routes/fix-order-25'));
app.use('/api', require('./routes/fix-order-27'));
app.use('/api', require('./routes/create-penalties-table'));
app.use('/api', require('./routes/penalties'));
app.use('/api', require('./routes/add-order-monitoring-columns'));
app.use('/api', require('./routes/create-price-history-table'));
app.use('/api', require('./routes/add-time-window-columns'));
app.use('/api', require('./routes/add-customer-notes-column'));
app.use('/api', require('./routes/add-billing-email-column'));
app.use('/api', require('./routes/fix-duplicate-emails'));
app.use('/api', require('./routes/add-invoice-tracking-columns'));
app.use('/api', require('./routes/create-email-templates-table'));
app.use('/api', require('./routes/fix-email-templates-body'));
app.use('/api', require('./routes/add-dual-role-support'));
app.use('/api/user', require('./routes/role-switch'));
app.use('/api', require('./routes/add-performance-indexes'));
app.use('/api', require('./routes/trigger-monitoring'));
app.use('/api', require('./routes/debug-monitoring'));
app.use('/api', require('./routes/customer-notes'));
app.use('/api/orders', require('./routes/order-price-adjustment'));
app.use('/api/invoices', require('./routes/invoice-history'));
app.use('/api/email-templates', require('./routes/email-templates'));
app.use('/api/system', require('./routes/system-monitoring'));
app.use('/api/backups', require('./routes/database-backups'));
app.use('/api', require('./routes/ensure-saved-routes-table'));
app.use('/api/saved-routes', require('./routes/savedRoutes'));

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
  console.log('🚀 Server running on port', PORT);
  console.log('📍 API available at http://localhost:' + PORT + '/api');
  console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
  console.log('🔄 Build: v2.6 - FORCE CACHE CLEAR - System Monitoring Fixed');
  
  // Run auto-migration
  try {
    const autoMigrate = require('./migrations/auto_migrate');
    await autoMigrate();
  } catch (error) {
    console.log('⚠️  Auto-migration skipped (database may not be ready yet)');
  }
  
  // Start order monitoring service (Cron-Job)
  try {
    const orderMonitoringService = require('./services/orderMonitoringService');
    orderMonitoringService.startMonitoring();
    console.log('✅ Order Monitoring Service started');
  } catch (error) {
    console.error('❌ Failed to start Order Monitoring Service:', error);
  }
  
  // DISABLED: Invoice reminder service (reduces DB load)
  // try {
  //   const invoiceReminderService = require('./services/invoiceReminderService');
  //   invoiceReminderService.startReminderService();
  //   console.log('✅ Invoice Reminder Service started');
  // } catch (error) {
  //   console.error('❌ Failed to start Invoice Reminder Service:', error);
  // }
  console.log('⏸️  Invoice Reminder Service DISABLED to reduce DB load');
  
  // DISABLED: Order cleanup service (reduces DB load)
  // try {
  //   const orderCleanupService = require('./services/orderCleanupService');
  //   orderCleanupService.startOrderCleanupService();
  //   console.log('✅ Order Cleanup Service started');
  // } catch (error) {
  //   console.error('❌ Failed to start Order Cleanup Service:', error);
  //   console.error('   This is not critical, server will continue...');
  // }
  console.log('⏸️  Order Cleanup Service DISABLED to reduce DB load');
  
  // DISABLED: Unverified accounts cleanup service (reduces DB load)
  // try {
  //   const cleanupService = require('./services/cleanupService');
  //   cleanupService.startCleanupService();
  //   console.log('✅ Unverified Accounts Cleanup Service started');
  // } catch (error) {
  //   console.error('❌ Failed to start Cleanup Service:', error);
  // }
  console.log('⏸️  Cleanup Service DISABLED to reduce DB load');
  
  // Start payment reminder service (Cron-Job)
  try {
    const paymentReminderService = require('./services/paymentReminderService');
    // Run daily at 9:00 AM
    const cron = require('node-cron');
    cron.schedule('0 9 * * *', () => {
      console.log('🔔 Running daily payment reminder check...');
      paymentReminderService.checkAndSendReminders();
    });
    console.log('✅ Payment Reminder Service started (runs daily at 9:00 AM)');
  } catch (error) {
    console.error('❌ Failed to start Payment Reminder Service:', error);
  }
  
  // Start database backup service (Cron-Job)
  try {
    const databaseBackupService = require('./services/databaseBackupService');
    databaseBackupService.startBackupService();
    console.log('✅ Database Backup Service started');
  } catch (error) {
    console.error('❌ Failed to start Database Backup Service:', error);
  }
});

module.exports = app;
