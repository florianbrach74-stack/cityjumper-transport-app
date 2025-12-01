const pool = require('../config/database');

async function autoMigrate() {
  try {
    console.log('🔍 Checking if migration is needed...');
    
    // Check if transport_orders columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('additional_stops', 'pickup_stops', 'delivery_stops', 'extra_stops_count');
    `;
    
    const result = await pool.query(checkQuery);
    
    const transportOrdersMigrated = result.rows.length >= 4;
    
    // Check if employee_assignment_mode column exists
    const checkEmployeeAssignment = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'employee_assignment_mode';
    `;
    
    const employeeResult = await pool.query(checkEmployeeAssignment);
    const employeeAssignmentMigrated = employeeResult.rows.length > 0;
    
    // Check if contractor_id column exists
    const checkContractorId = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'contractor_id';
    `;
    
    const contractorIdResult = await pool.query(checkContractorId);
    const contractorIdMigrated = contractorIdResult.rows.length > 0;
    
    // Check if loading help columns exist
    const checkLoadingHelp = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name IN ('needs_loading_help', 'needs_unloading_help', 'loading_help_fee', 'legal_delivery');
    `;
    
    const loadingHelpResult = await pool.query(checkLoadingHelp);
    const loadingHelpMigrated = loadingHelpResult.rows.length >= 4;
    
    // Check if email_templates has new templates (check for specific key)
    let emailTemplatesMigrated = false;
    try {
      const checkEmailTemplates = `
        SELECT COUNT(*) as count
        FROM email_templates 
        WHERE template_key = 'verification_request_admin';
      `;
      const emailTemplatesResult = await pool.query(checkEmailTemplates);
      emailTemplatesMigrated = emailTemplatesResult.rows[0].count > 0;
    } catch (e) {
      // Table doesn't exist yet
      emailTemplatesMigrated = false;
    }
    
    // Check if discount/skonto columns exist in sent_invoices
    let discountSkontoMigrated = false;
    try {
      const checkDiscountSkonto = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sent_invoices' 
        AND column_name IN ('discount_percentage', 'discount_amount', 'skonto_offered', 'skonto_percentage');
      `;
      
      const discountSkontoResult = await pool.query(checkDiscountSkonto);
      discountSkontoMigrated = discountSkontoResult.rows.length >= 4;
    } catch (e) {
      // Table may not exist yet
      discountSkontoMigrated = false;
    }
    
    // Check if contractor invoice tracking columns exist in sent_invoices
    let contractorInvoiceTrackingMigrated = false;
    try {
      const checkContractorInvoiceTracking = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sent_invoices' 
        AND column_name IN ('contractor_invoice_received', 'contractor_invoice_paid');
      `;
      
      const contractorInvoiceResult = await pool.query(checkContractorInvoiceTracking);
      contractorInvoiceTrackingMigrated = contractorInvoiceResult.rows.length >= 2;
    } catch (e) {
      // Table may not exist yet
      contractorInvoiceTrackingMigrated = false;
    }
    
    if (transportOrdersMigrated && employeeAssignmentMigrated && contractorIdMigrated && loadingHelpMigrated && emailTemplatesMigrated && discountSkontoMigrated && contractorInvoiceTrackingMigrated) {
      console.log('✓ All migrations already applied, skipping...');
      return;
    }
    
    console.log('🔧 Applying migrations...');
    
    // Add additional stops as JSONB array (for admin-added stops during execution)
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS additional_stops JSONB DEFAULT '[]'::jsonb;
    `);
    
    // Add initial pickup and delivery stops as JSONB arrays (for multi-stop orders at creation)
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS pickup_stops JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS delivery_stops JSONB DEFAULT '[]'::jsonb;
    `);
    
    // Add extra stops fee tracking
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS extra_stops_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS extra_stops_fee DECIMAL(10, 2) DEFAULT 0;
    `);
    
    // Add clarification time tracking
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS clarification_minutes INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS clarification_notes TEXT;
    `);
    
    // Add admin edit tracking
    await pool.query(`
      ALTER TABLE transport_orders 
      ADD COLUMN IF NOT EXISTS last_edited_by INTEGER REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;
    `);
    
    // Add contractor_id to users table
    if (!contractorIdMigrated) {
      console.log('🔧 Adding contractor_id column...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES users(id);
      `);
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_users_contractor_id ON users(contractor_id);
      `);
      console.log('  ✓ contractor_id column added');
    }
    
    // Add employee assignment mode to users table
    if (!employeeAssignmentMigrated) {
      console.log('🔧 Adding employee_assignment_mode column...');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS employee_assignment_mode VARCHAR(50) DEFAULT 'all_access';
      `);
      console.log('  ✓ Employee assignment mode added');
    }
    
    // Add loading help and legal delivery columns
    if (!loadingHelpMigrated) {
      console.log('🔧 Adding loading help and legal delivery columns...');
      await pool.query(`
        ALTER TABLE transport_orders 
        ADD COLUMN IF NOT EXISTS needs_loading_help BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS needs_unloading_help BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS loading_help_fee DECIMAL(10, 2) DEFAULT 0.00,
        ADD COLUMN IF NOT EXISTS legal_delivery BOOLEAN DEFAULT FALSE;
      `);
      console.log('  ✓ Loading help columns added');
      console.log('  ✓ Legal delivery column added');
    }
    
    // Add email templates
    if (!emailTemplatesMigrated) {
      console.log('🔧 Adding email templates...');
      const emailTemplatesMigration = require('./20251125_add_email_templates');
      await emailTemplatesMigration.up();
      console.log('  ✓ Email templates added');
    }
    
    // Add discount and skonto columns to sent_invoices
    if (!discountSkontoMigrated) {
      try {
        console.log('🔧 Adding discount and skonto columns to sent_invoices...');
        await pool.query(`
          ALTER TABLE sent_invoices 
          ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0,
          ADD COLUMN IF NOT EXISTS skonto_offered BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS skonto_percentage DECIMAL(5, 2) DEFAULT 0;
        `);
        console.log('  ✓ Discount and skonto columns added');
      } catch (e) {
        console.log('  ⚠️  Could not add discount/skonto columns (table may not exist yet):', e.message);
      }
    }
    
    // Add contractor invoice tracking columns to sent_invoices
    if (!contractorInvoiceTrackingMigrated) {
      try {
        console.log('🔧 Adding contractor invoice tracking columns to sent_invoices...');
        await pool.query(`
          ALTER TABLE sent_invoices 
          ADD COLUMN IF NOT EXISTS contractor_invoice_received BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS contractor_invoice_received_date TIMESTAMP,
          ADD COLUMN IF NOT EXISTS contractor_invoice_paid BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS contractor_invoice_paid_date TIMESTAMP,
          ADD COLUMN IF NOT EXISTS contractor_invoice_notes TEXT;
        `);
        console.log('  ✓ Contractor invoice tracking columns added');
      } catch (e) {
        console.log('  ⚠️  Could not add contractor invoice tracking columns (table may not exist yet):', e.message);
      }
    }
    
    // Check if email_verification_token column exists
    const tokenColumnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'email_verification_token'
    `);
    
    if (tokenColumnCheck.rows.length === 0) {
      console.log('🔧 Adding email_verification_token column...');
      await pool.query(`
        ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(email_verification_token);
      `);
      console.log('✅ email_verification_token column added');
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📦 New features are now available:');
    console.log('  ✓ Multi-stop orders (multiple pickups/deliveries)');
    console.log('  ✓ Admin can edit completed orders');
    console.log('  ✓ Additional stops during execution');
    console.log('  ✓ Automatic pricing: +6€ per extra stop');
    console.log('  ✓ Employee-Contractor relationship (contractor_id)');
    console.log('  ✓ Contractor invoice tracking (prevent double payments)');
    console.log('  ✓ Employee assignment mode (all_access / manual_assignment)');
    console.log('  ✓ Loading/Unloading help (+€6 each)');
    console.log('  ✓ Legal delivery with content verification');
    console.log('  ✓ Email templates (12 customizable templates)');
    console.log('  ✓ Invoice discount and skonto tracking');
    
  } catch (error) {
    console.error('⚠️  Migration error (may be safe to ignore if already applied):', error.message);
  }
}

module.exports = autoMigrate;
