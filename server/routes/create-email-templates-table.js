const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.post('/create-email-templates-table', async (req, res) => {
  try {
    console.log('🔧 Creating email_templates table...');

    // Create email_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        template_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        subject TEXT NOT NULL,
        html_content TEXT NOT NULL,
        variables JSONB DEFAULT '[]'::jsonb,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ email_templates table created');

    // Insert default templates
    const defaultTemplates = [
      {
        template_key: 'invoice_reminder_friendly',
        name: 'Freundliche Zahlungserinnerung',
        category: 'invoices',
        subject: 'Freundliche Zahlungserinnerung - Rechnung {{invoice_number}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Zahlungserinnerung</h2>
            <p>Sehr geehrte/r {{customer_name}},</p>
            <p>wir möchten Sie freundlich an die ausstehende Zahlung für folgende Rechnung erinnern:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
              <p><strong>Rechnungsdatum:</strong> {{invoice_date}}</p>
              <p><strong>Fälligkeitsdatum:</strong> {{due_date}}</p>
              <p><strong>Betrag:</strong> €{{total_amount}}</p>
            </div>
            
            <p>Falls Sie die Rechnung bereits beglichen haben, betrachten Sie diese Email bitte als gegenstandslos.</p>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Zahlungsinformationen:</strong></p>
              <p style="margin: 5px 0;">Bank: Berliner Sparkasse</p>
              <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
              <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
            </div>
            
            <p>Bei Fragen erreichen Sie uns unter:<br>
            📧 info@courierly.de<br>
            📞 01724216672</p>
            
            <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          </div>
        `,
        variables: JSON.stringify(['customer_name', 'invoice_number', 'invoice_date', 'due_date', 'total_amount']),
        description: 'Erste freundliche Erinnerung bei überfälliger Rechnung'
      },
      {
        template_key: 'invoice_reminder_urgent',
        name: 'Dringende Zahlungserinnerung',
        category: 'invoices',
        subject: 'Dringende Zahlungserinnerung - Rechnung {{invoice_number}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">⚠️ Dringende Zahlungserinnerung</h2>
            <p>Sehr geehrte/r {{customer_name}},</p>
            <p>die Zahlung für folgende Rechnung ist nun bereits mehrere Tage überfällig:</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
              <p><strong>Fälligkeitsdatum:</strong> {{due_date}}</p>
              <p><strong>Offener Betrag:</strong> €{{total_amount}}</p>
            </div>
            
            <p style="color: #dc2626;"><strong>Bitte begleichen Sie den Betrag umgehend, um Mahngebühren zu vermeiden.</strong></p>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Zahlungsinformationen:</strong></p>
              <p style="margin: 5px 0;">Bank: Berliner Sparkasse</p>
              <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
              <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
            </div>
            
            <p>Bei Fragen oder Zahlungsschwierigkeiten kontaktieren Sie uns bitte umgehend:<br>
            📧 info@courierly.de<br>
            📞 01724216672</p>
            
            <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          </div>
        `,
        variables: JSON.stringify(['customer_name', 'invoice_number', 'due_date', 'total_amount']),
        description: 'Dringende Erinnerung nach 7 Tagen'
      },
      {
        template_key: 'invoice_reminder_final',
        name: 'Letzte Mahnung',
        category: 'invoices',
        subject: 'Letzte Mahnung - Rechnung {{invoice_number}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">🚨 Letzte Mahnung</h2>
            <p>Sehr geehrte/r {{customer_name}},</p>
            <p>trotz mehrfacher Erinnerung ist die Zahlung für folgende Rechnung noch nicht eingegangen:</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
              <p><strong>Fälligkeitsdatum:</strong> {{due_date}}</p>
              <p><strong>Offener Betrag:</strong> €{{total_amount}}</p>
              <p style="color: #dc2626;"><strong>Tage überfällig:</strong> {{days_overdue}}</p>
            </div>
            
            <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #dc2626; font-weight: bold; margin: 0;">⚠️ WICHTIG</p>
              <p style="margin: 10px 0;">Dies ist unsere letzte Mahnung. Bitte begleichen Sie den Betrag innerhalb von 7 Tagen.</p>
              <p style="margin: 10px 0; color: #dc2626;">Andernfalls müssen wir rechtliche Schritte einleiten und ein Inkassoverfahren einleiten.</p>
            </div>
            
            <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Zahlungsinformationen:</strong></p>
              <p style="margin: 5px 0;">Bank: Berliner Sparkasse</p>
              <p style="margin: 5px 0;">IBAN: DE92 1005 0000 1062 9152 80</p>
              <p style="margin: 5px 0;">BIC: BELADEBEXXX</p>
              <p style="margin: 5px 0; color: #dc2626;"><strong>Verwendungszweck: {{invoice_number}}</strong></p>
            </div>
            
            <p>Kontaktieren Sie uns SOFORT bei Zahlungsschwierigkeiten:<br>
            📧 info@courierly.de<br>
            📞 01724216672</p>
            
            <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          </div>
        `,
        variables: JSON.stringify(['customer_name', 'invoice_number', 'due_date', 'total_amount', 'days_overdue']),
        description: 'Letzte Mahnung nach 14 Tagen'
      },
      {
        template_key: 'order_confirmation',
        name: 'Auftragsbestätigung',
        category: 'orders',
        subject: 'Auftragsbestätigung - Auftrag #{{order_id}}',
        html_content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">Auftragsbestätigung</h2>
            <p>Sehr geehrte/r {{customer_name}},</p>
            <p>vielen Dank für Ihren Auftrag! Wir haben Ihre Buchung erhalten und bestätigen:</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Auftragsnummer:</strong> #{{order_id}}</p>
              <p><strong>Abholung:</strong> {{pickup_address}}, {{pickup_city}}</p>
              <p><strong>Zustellung:</strong> {{delivery_address}}, {{delivery_city}}</p>
              <p><strong>Datum:</strong> {{pickup_date}}</p>
              <p><strong>Preis:</strong> €{{price}}</p>
            </div>
            
            <p>Wir suchen nun einen geeigneten Fahrer für Ihren Auftrag. Sie erhalten eine weitere Email, sobald ein Fahrer zugewiesen wurde.</p>
            
            <p>Bei Fragen erreichen Sie uns unter:<br>
            📧 info@courierly.de<br>
            📞 01724216672</p>
            
            <p>Mit freundlichen Grüßen<br>Ihr Courierly Team</p>
          </div>
        `,
        variables: JSON.stringify(['customer_name', 'order_id', 'pickup_address', 'pickup_city', 'delivery_address', 'delivery_city', 'pickup_date', 'price']),
        description: 'Bestätigung nach Auftragserstellung'
      }
    ];

    for (const template of defaultTemplates) {
      await pool.query(
        `INSERT INTO email_templates (template_key, name, category, subject, html_content, variables, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (template_key) DO NOTHING`,
        [template.template_key, template.name, template.category, template.subject, template.html_content, template.variables, template.description]
      );
    }

    console.log('✅ Default email templates inserted');

    // Check tables
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_templates'
    `);

    const countResult = await pool.query('SELECT COUNT(*) as count FROM email_templates');

    res.json({
      success: true,
      message: 'Email templates table created successfully',
      table_exists: tableCheck.rows.length > 0,
      template_count: parseInt(countResult.rows[0].count)
    });

  } catch (error) {
    console.error('❌ Error creating email templates table:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.detail
    });
  }
});

module.exports = router;
