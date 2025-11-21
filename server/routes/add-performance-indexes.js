const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/add-performance-indexes', async (req, res) => {
  try {
    console.log('🔧 Adding performance indexes...');

    const results = {
      created: [],
      already_exists: [],
      errors: []
    };

    // Users table indexes
    const userIndexes = [
      { name: 'idx_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
      { name: 'idx_users_role', sql: 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)' },
      { name: 'idx_users_verification_status', sql: 'CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status)' },
      { name: 'idx_users_account_status', sql: 'CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status)' },
      { name: 'idx_users_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC)' }
    ];

    // Transport orders indexes
    const orderIndexes = [
      { name: 'idx_orders_customer_id', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON transport_orders(customer_id)' },
      { name: 'idx_orders_contractor_id', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_contractor_id ON transport_orders(contractor_id)' },
      { name: 'idx_orders_status', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_status ON transport_orders(status)' },
      { name: 'idx_orders_payment_status', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON transport_orders(payment_status)' },
      { name: 'idx_orders_pickup_date', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_pickup_date ON transport_orders(pickup_date)' },
      { name: 'idx_orders_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON transport_orders(created_at DESC)' },
      { name: 'idx_orders_invoice_number', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON transport_orders(invoice_number)' },
      { name: 'idx_orders_invoiced_at', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_invoiced_at ON transport_orders(invoiced_at)' },
      { name: 'idx_orders_pickup_postal_code', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_pickup_postal_code ON transport_orders(pickup_postal_code)' },
      { name: 'idx_orders_delivery_postal_code', sql: 'CREATE INDEX IF NOT EXISTS idx_orders_delivery_postal_code ON transport_orders(delivery_postal_code)' }
    ];

    // Sent invoices indexes
    const invoiceIndexes = [
      { name: 'idx_sent_invoices_customer_id', sql: 'CREATE INDEX IF NOT EXISTS idx_sent_invoices_customer_id ON sent_invoices(customer_id)' },
      { name: 'idx_sent_invoices_payment_status', sql: 'CREATE INDEX IF NOT EXISTS idx_sent_invoices_payment_status ON sent_invoices(payment_status)' },
      { name: 'idx_sent_invoices_invoice_date', sql: 'CREATE INDEX IF NOT EXISTS idx_sent_invoices_invoice_date ON sent_invoices(invoice_date DESC)' },
      { name: 'idx_sent_invoices_due_date', sql: 'CREATE INDEX IF NOT EXISTS idx_sent_invoices_due_date ON sent_invoices(due_date)' },
      { name: 'idx_sent_invoices_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_sent_invoices_created_at ON sent_invoices(created_at DESC)' }
    ];

    // Invoice order items indexes
    const invoiceItemIndexes = [
      { name: 'idx_invoice_items_invoice_number', sql: 'CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_number ON invoice_order_items(invoice_number)' },
      { name: 'idx_invoice_items_order_id', sql: 'CREATE INDEX IF NOT EXISTS idx_invoice_items_order_id ON invoice_order_items(order_id)' }
    ];

    // Bids indexes
    const bidIndexes = [
      { name: 'idx_bids_order_id', sql: 'CREATE INDEX IF NOT EXISTS idx_bids_order_id ON bids(order_id)' },
      { name: 'idx_bids_contractor_id', sql: 'CREATE INDEX IF NOT EXISTS idx_bids_contractor_id ON bids(contractor_id)' },
      { name: 'idx_bids_status', sql: 'CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status)' },
      { name: 'idx_bids_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at DESC)' }
    ];

    // Penalties indexes
    const penaltyIndexes = [
      { name: 'idx_penalties_contractor_id', sql: 'CREATE INDEX IF NOT EXISTS idx_penalties_contractor_id ON contractor_penalties(contractor_id)' },
      { name: 'idx_penalties_order_id', sql: 'CREATE INDEX IF NOT EXISTS idx_penalties_order_id ON contractor_penalties(order_id)' },
      { name: 'idx_penalties_status', sql: 'CREATE INDEX IF NOT EXISTS idx_penalties_status ON contractor_penalties(status)' },
      { name: 'idx_penalties_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_penalties_created_at ON contractor_penalties(created_at DESC)' }
    ];

    // Email templates indexes
    const templateIndexes = [
      { name: 'idx_email_templates_category', sql: 'CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category)' },
      { name: 'idx_email_templates_template_key', sql: 'CREATE INDEX IF NOT EXISTS idx_email_templates_template_key ON email_templates(template_key)' }
    ];

    // Combine all indexes
    const allIndexes = [
      ...userIndexes,
      ...orderIndexes,
      ...invoiceIndexes,
      ...invoiceItemIndexes,
      ...bidIndexes,
      ...penaltyIndexes,
      ...templateIndexes
    ];

    // Create indexes
    for (const index of allIndexes) {
      try {
        await pool.query(index.sql);
        results.created.push(index.name);
        console.log(`✅ Created index: ${index.name}`);
      } catch (error) {
        if (error.code === '42P07') {
          // Index already exists
          results.already_exists.push(index.name);
        } else {
          results.errors.push({
            index: index.name,
            error: error.message
          });
          console.error(`❌ Error creating index ${index.name}:`, error.message);
        }
      }
    }

    // Create composite indexes for common queries
    const compositeIndexes = [
      {
        name: 'idx_orders_customer_status',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON transport_orders(customer_id, status)'
      },
      {
        name: 'idx_orders_contractor_status',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_contractor_status ON transport_orders(contractor_id, status)'
      },
      {
        name: 'idx_orders_status_pickup_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_orders_status_pickup_date ON transport_orders(status, pickup_date)'
      },
      {
        name: 'idx_invoices_customer_status',
        sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_customer_status ON sent_invoices(customer_id, payment_status)'
      },
      {
        name: 'idx_invoices_status_due_date',
        sql: 'CREATE INDEX IF NOT EXISTS idx_invoices_status_due_date ON sent_invoices(payment_status, due_date)'
      }
    ];

    for (const index of compositeIndexes) {
      try {
        await pool.query(index.sql);
        results.created.push(index.name);
        console.log(`✅ Created composite index: ${index.name}`);
      } catch (error) {
        if (error.code === '42P07') {
          results.already_exists.push(index.name);
        } else {
          results.errors.push({
            index: index.name,
            error: error.message
          });
          console.error(`❌ Error creating composite index ${index.name}:`, error.message);
        }
      }
    }

    console.log(`✅ Performance indexes added: ${results.created.length} created, ${results.already_exists.length} already existed`);

    res.json({
      success: true,
      message: 'Performance indexes added successfully',
      stats: {
        created: results.created.length,
        already_exists: results.already_exists.length,
        errors: results.errors.length,
        total: allIndexes.length + compositeIndexes.length
      },
      details: results
    });

  } catch (error) {
    console.error('❌ Error adding performance indexes:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
