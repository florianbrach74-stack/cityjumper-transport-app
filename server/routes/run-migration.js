const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Run migration endpoint - NO AUTH REQUIRED for emergency fixes
router.post('/run-migration/contractor-id', async (req, res) => {
  try {
    console.log('🔧 Running contractor_id migration...');
    
    // Add contractor_id column
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES users(id);
    `);
    console.log('✅ contractor_id column added');
    
    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_contractor_id ON users(contractor_id);
    `);
    console.log('✅ Index created');
    
    // Get contractors
    const contractors = await pool.query(`
      SELECT id, first_name, last_name FROM users WHERE role = 'contractor' ORDER BY created_at ASC LIMIT 1
    `);
    
    if (contractors.rows.length === 0) {
      return res.json({ success: false, error: 'No contractors found' });
    }
    
    const contractorId = contractors.rows[0].id;
    console.log(`✅ Found contractor: ${contractors.rows[0].first_name} ${contractors.rows[0].last_name} (ID: ${contractorId})`);
    
    // Update all employees
    const result = await pool.query(`
      UPDATE users 
      SET contractor_id = $1 
      WHERE role = 'employee' AND contractor_id IS NULL
      RETURNING id, first_name, last_name
    `, [contractorId]);
    
    console.log(`✅ Updated ${result.rows.length} employees`);
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      contractorId: contractorId,
      contractorName: `${contractors.rows[0].first_name} ${contractors.rows[0].last_name}`,
      updatedEmployees: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      hint: 'Migration may have already been applied'
    });
  }
});

// Fix employee role
router.post('/run-migration/fix-employee-role', async (req, res) => {
  try {
    console.log('🔧 Fixing employee role...');
    
    // Check current role
    const before = await pool.query(`
      SELECT id, first_name, last_name, email, role, contractor_id 
      FROM users 
      WHERE email = 'luci.flader@gmx.de'
    `);
    
    console.log('Before:', before.rows[0]);
    
    // Update role to employee
    const result = await pool.query(`
      UPDATE users 
      SET role = 'employee'
      WHERE email = 'luci.flader@gmx.de' AND role != 'employee'
      RETURNING id, first_name, last_name, email, role, contractor_id
    `);
    
    // Check after
    const after = await pool.query(`
      SELECT id, first_name, last_name, email, role, contractor_id 
      FROM users 
      WHERE email = 'luci.flader@gmx.de'
    `);
    
    console.log('After:', after.rows[0]);
    console.log('✅ Role fixed!');
    
    res.json({
      success: true,
      message: 'Employee role fixed',
      before: before.rows[0],
      after: after.rows[0],
      updated: result.rowCount > 0
    });
    
  } catch (error) {
    console.error('❌ Fix employee role error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Reset employee password
router.post('/run-migration/reset-employee-password', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const email = 'luci.flader@gmx.de';
    const newPassword = 'Test123!';
    
    console.log('🔐 Resetting password for:', email);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    const result = await pool.query(
      `UPDATE users 
       SET password = $1 
       WHERE email = $2
       RETURNING id, first_name, last_name, email, role`,
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      res.json({ success: false, error: 'User not found' });
    } else {
      console.log('✅ Password reset successfully!');
      res.json({
        success: true,
        message: 'Password reset successfully',
        user: result.rows[0],
        email: email,
        newPassword: newPassword,
        warning: 'Please change this password after first login!'
      });
    }
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Check order assignment
// Fix employee contractor_id
router.post('/fix-employee-contractor-id', async (req, res) => {
  try {
    console.log('🔧 Fixing employee contractor_id fields...');
    
    // Get all employees
    const employees = await pool.query(
      `SELECT id, email, first_name, last_name, contractor_id 
       FROM users 
       WHERE role = 'employee'`
    );
    
    const results = [];
    
    for (const employee of employees.rows) {
      const result = {
        id: employee.id,
        name: `${employee.first_name} ${employee.last_name}`,
        oldContractorId: employee.contractor_id
      };
      
      if (!employee.contractor_id) {
        // Find orders assigned to this employee
        const orders = await pool.query(
          `SELECT DISTINCT contractor_id 
           FROM transport_orders 
           WHERE assigned_employee_id = $1 
           LIMIT 1`,
          [employee.id]
        );
        
        if (orders.rows.length > 0) {
          const contractorId = orders.rows[0].contractor_id;
          
          // Update employee with contractor_id
          await pool.query(
            `UPDATE users 
             SET contractor_id = $1 
             WHERE id = $2`,
            [contractorId, employee.id]
          );
          
          result.newContractorId = contractorId;
          result.status = 'fixed';
        } else {
          result.status = 'no_orders';
        }
      } else {
        result.status = 'already_set';
      }
      
      results.push(result);
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('❌ Fix error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/debug/check-assignment/:orderId', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    
    // Check order
    const order = await pool.query(
      `SELECT id, status, contractor_id, assigned_employee_id, pickup_confirmed, delivery_confirmed
       FROM transport_orders 
       WHERE id = $1`,
      [orderId]
    );
    
    if (order.rows.length === 0) {
      return res.json({ error: 'Order not found' });
    }
    
    // Check employee
    const employee = await pool.query(
      `SELECT id, first_name, last_name, email, role, contractor_id
       FROM users 
       WHERE id = $1`,
      [order.rows[0].assigned_employee_id]
    );
    
    // Check contractor
    const contractor = await pool.query(
      `SELECT id, first_name, last_name, email, employee_assignment_mode
       FROM users 
       WHERE id = $1`,
      [order.rows[0].contractor_id]
    );
    
    res.json({
      order: order.rows[0],
      employee: employee.rows[0] || null,
      contractor: contractor.rows[0] || null
    });
    
  } catch (error) {
    console.error('❌ Check assignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add email templates - NO AUTH for emergency
router.post('/add-email-templates', async (req, res) => {
  try {
    console.log('📧 Adding email templates...');
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Create table or alter if exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS email_templates (
          id SERIAL PRIMARY KEY,
          template_key VARCHAR(100) UNIQUE NOT NULL,
          name VARCHAR(200) NOT NULL,
          category VARCHAR(50) NOT NULL,
          subject TEXT NOT NULL,
          html_content TEXT NOT NULL,
          variables TEXT[],
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Check if variables column is JSONB and convert to TEXT[]
      const columnCheck = await client.query(`
        SELECT data_type 
        FROM information_schema.columns 
        WHERE table_name = 'email_templates' AND column_name = 'variables'
      `);
      
      if (columnCheck.rows[0]?.data_type === 'jsonb') {
        console.log('Converting variables column from JSONB to TEXT[]...');
        // Drop default first
        await client.query(`ALTER TABLE email_templates ALTER COLUMN variables DROP DEFAULT`);
        // Then convert
        await client.query(`
          ALTER TABLE email_templates 
          ALTER COLUMN variables TYPE TEXT[] 
          USING CASE 
            WHEN variables IS NULL THEN '{}'::text[]
            ELSE ARRAY(SELECT jsonb_array_elements_text(variables))
          END
        `);
      }
      
      const templates = [
        ['verification_request_admin', 'Verifizierungsanfrage (Admin)', 'verification', '🔔 Neue Verifizierungsanfrage', 
         '<div style="font-family: Arial, sans-serif;"><h2>Neue Verifizierung</h2><p>Firma: {{company_name}}</p></div>',
         ['company_name', 'email', 'phone']],
        
        ['verification_approved', 'Verifizierung genehmigt', 'verification', '✅ Verifizierung erfolgreich',
         '<div style="font-family: Arial, sans-serif;"><h2>✅ Verifizierung genehmigt!</h2></div>',
         []],
        
        ['verification_rejected', 'Verifizierung abgelehnt', 'verification', '❌ Verifizierung abgelehnt',
         '<div style="font-family: Arial, sans-serif;"><h2>Verifizierung abgelehnt</h2><p>Grund: {{reason}}</p></div>',
         ['reason']],
        
        ['order_new_contractor', 'Neuer Auftrag (Auftragnehmer)', 'orders', 'Neuer Transportauftrag',
         '<div style="font-family: Arial, sans-serif;"><h2>🚚 Neuer Auftrag!</h2><p>Auftrag #{{order_id}}</p></div>',
         ['order_id', 'pickup_city', 'delivery_city']],
        
        ['order_assigned_customer', 'Auftrag angenommen (Kunde)', 'orders', 'Auftrag angenommen',
         '<div style="font-family: Arial, sans-serif;"><h2>✅ Auftrag angenommen!</h2></div>',
         ['order_id', 'contractor_name']],
        
        ['bid_new_customer', 'Neues Angebot (Kunde)', 'bids', 'Neues Angebot',
         '<div style="font-family: Arial, sans-serif;"><h2>💼 Neues Angebot!</h2><p>€{{bid_price}}</p></div>',
         ['order_id', 'contractor_name', 'bid_price']],
        
        ['bid_accepted_contractor', 'Angebot angenommen', 'bids', '✅ Angebot angenommen!',
         '<div style="font-family: Arial, sans-serif;"><h2>✅ Glückwunsch!</h2></div>',
         ['order_id']],
        
        ['invoice_sent', 'Rechnung versendet', 'invoices', 'Rechnung {{invoice_number}}',
         '<div style="font-family: Arial, sans-serif;"><h2>Ihre Rechnung</h2></div>',
         ['invoice_number', 'total_amount']],
        
        ['password_reset_request', 'Passwort zurücksetzen', 'account', 'Passwort zurücksetzen',
         '<div style="font-family: Arial, sans-serif;"><h2>Passwort zurücksetzen</h2><a href="{{reset_url}}">Link</a></div>',
         ['reset_url']],
        
        ['admin_notification', 'Admin-Benachrichtigung', 'admin', '[Admin] {{subject}}',
         '<div style="font-family: Arial, sans-serif;"><h2>{{subject}}</h2><p>{{message}}</p></div>',
         ['subject', 'message']]
      ];
      
      let added = 0;
      for (const [key, name, category, subject, html, vars] of templates) {
        // Convert array to PostgreSQL array format
        const varsArray = vars.length === 0 ? '{}' : '{' + vars.join(',') + '}';
        
        await client.query(`
          INSERT INTO email_templates (template_key, name, category, subject, html_content, variables)
          VALUES ($1, $2, $3, $4, $5, $6::text[])
          ON CONFLICT (template_key) DO NOTHING
        `, [key, name, category, subject, html, varsArray]);
        added++;
      }
      
      await client.query('COMMIT');
      
      const count = await client.query('SELECT COUNT(*) FROM email_templates');
      
      res.json({
        success: true,
        message: 'Email templates added',
        added: added,
        total: count.rows[0].count
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
