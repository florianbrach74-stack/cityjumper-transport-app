// Direct migration runner - connects to Railway DB and adds templates
require('dotenv').config();
const { Pool } = require('pg');

// Use Railway DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('🚀 Starting email templates migration...\n');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create table
    console.log('📋 Creating email_templates table...');
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
    console.log('✅ Table ready\n');
    
    // Templates with ARRAY syntax
    const templates = [
      ['verification_request_admin', 'Verifizierungsanfrage (Admin)', 'verification', '🔔 Neue Verifizierungsanfrage', 
       '<div style="font-family: Arial, sans-serif;"><h2>Neue Verifizierung</h2><p>Firma: {{company_name}}</p><p>Email: {{email}}</p></div>',
       ['company_name', 'email', 'phone']],
      
      ['verification_approved', 'Verifizierung genehmigt', 'verification', '✅ Verifizierung erfolgreich',
       '<div style="font-family: Arial, sans-serif;"><h2>✅ Verifizierung genehmigt!</h2><p>Sie können jetzt Aufträge annehmen.</p></div>',
       []],
      
      ['verification_rejected', 'Verifizierung abgelehnt', 'verification', '❌ Verifizierung abgelehnt',
       '<div style="font-family: Arial, sans-serif;"><h2>Verifizierung abgelehnt</h2><p>Grund: {{reason}}</p></div>',
       ['reason']],
      
      ['order_new_contractor', 'Neuer Auftrag (Auftragnehmer)', 'orders', 'Neuer Transportauftrag verfügbar',
       '<div style="font-family: Arial, sans-serif;"><h2>🚚 Neuer Auftrag!</h2><p>Auftrag #{{order_id}}</p><p>{{pickup_city}} → {{delivery_city}}</p></div>',
       ['order_id', 'pickup_city', 'delivery_city', 'pickup_date', 'vehicle_type', 'price']],
      
      ['order_assigned_customer', 'Auftrag angenommen (Kunde)', 'orders', 'Ihr Auftrag wurde angenommen',
       '<div style="font-family: Arial, sans-serif;"><h2>✅ Auftrag angenommen!</h2><p>Auftragnehmer: {{contractor_name}}</p></div>',
       ['order_id', 'contractor_name', 'contractor_phone', 'pickup_city', 'delivery_city']],
      
      ['bid_new_customer', 'Neues Angebot (Kunde)', 'bids', 'Neues Angebot von {{contractor_name}}',
       '<div style="font-family: Arial, sans-serif;"><h2>💼 Neues Angebot!</h2><p>Preis: €{{bid_price}}</p></div>',
       ['order_id', 'contractor_name', 'bid_price', 'bid_message']],
      
      ['bid_new_admin', 'Neue Bewerbung (Admin)', 'bids', '🎯 Neue Bewerbung',
       '<div style="font-family: Arial, sans-serif;"><h2>Neue Bewerbung</h2><p>Auftrag #{{order_id}}</p></div>',
       ['order_id', 'contractor_name', 'bid_price']],
      
      ['bid_accepted_contractor', 'Angebot angenommen (Auftragnehmer)', 'bids', '✅ Ihr Angebot wurde angenommen!',
       '<div style="font-family: Arial, sans-serif;"><h2>✅ Glückwunsch!</h2><p>Auftrag #{{order_id}}</p></div>',
       ['order_id', 'pickup_city', 'delivery_city', 'price']],
      
      ['invoice_sent', 'Rechnung versendet', 'invoices', 'Rechnung {{invoice_number}}',
       '<div style="font-family: Arial, sans-serif;"><h2>Ihre Rechnung</h2><p>Rechnung: {{invoice_number}}</p><p>Betrag: €{{total_amount}}</p></div>',
       ['invoice_number', 'invoice_date', 'due_date', 'total_amount']],
      
      ['password_reset_request', 'Passwort zurücksetzen', 'account', 'Passwort zurücksetzen',
       '<div style="font-family: Arial, sans-serif;"><h2>Passwort zurücksetzen</h2><a href="{{reset_url}}">Passwort zurücksetzen</a></div>',
       ['reset_url']],
      
      ['password_reset_success', 'Passwort geändert', 'account', 'Passwort erfolgreich geändert',
       '<div style="font-family: Arial, sans-serif;"><h2>✅ Passwort geändert</h2><p>Sie können sich jetzt anmelden.</p></div>',
       []],
      
      ['admin_notification', 'Admin-Benachrichtigung', 'admin', '[Admin] {{subject}}',
       '<div style="font-family: Arial, sans-serif;"><h2>Admin-Benachrichtigung</h2><p>{{message}}</p></div>',
       ['subject', 'message']]
    ];
    
    console.log('📧 Inserting templates...\n');
    
    let added = 0;
    let skipped = 0;
    
    for (const [key, name, category, subject, html, vars] of templates) {
      try {
        await client.query(`
          INSERT INTO email_templates (template_key, name, category, subject, html_content, variables)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (template_key) DO NOTHING
        `, [key, name, category, subject, html, vars]);
        
        console.log(`✅ ${name}`);
        added++;
      } catch (err) {
        console.log(`⏭️  ${name} - ${err.message}`);
        skipped++;
      }
    }
    
    await client.query('COMMIT');
    
    // Count total
    const result = await client.query('SELECT COUNT(*) FROM email_templates');
    const total = result.rows[0].count;
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MIGRATION COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Added: ${added}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📝 Total in DB: ${total}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
