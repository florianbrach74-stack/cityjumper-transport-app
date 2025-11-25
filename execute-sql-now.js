// Execute SQL directly on Railway database
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:RYPHEqJnZKmOSqHHxGFfNIxqUXMXbxLW@junction.proxy.rlwy.net:56406/railway';

// SSL config for Railway
const config = {
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
};

async function executeSql() {
  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Connected to Railway database\n');
    
    // 1. Fix column type
    console.log('🔧 Step 1: Fixing variables column...');
    await client.query('ALTER TABLE email_templates ALTER COLUMN variables DROP DEFAULT');
    console.log('   ✅ Default dropped');
    
    await client.query(`
      ALTER TABLE email_templates 
      ALTER COLUMN variables TYPE TEXT[] 
      USING CASE 
        WHEN variables IS NULL THEN '{}'::text[]
        ELSE ARRAY(SELECT jsonb_array_elements_text(variables))
      END
    `);
    console.log('   ✅ Column converted to TEXT[]\n');
    
    // 2. Insert templates
    console.log('📧 Step 2: Adding templates...');
    
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
      
      ['bid_new_admin', 'Neue Bewerbung (Admin)', 'bids', '🎯 Neue Bewerbung',
       '<div style="font-family: Arial, sans-serif;"><h2>Neue Bewerbung</h2></div>',
       ['order_id', 'contractor_name']],
      
      ['bid_accepted_contractor', 'Angebot angenommen', 'bids', '✅ Angebot angenommen!',
       '<div style="font-family: Arial, sans-serif;"><h2>✅ Glückwunsch!</h2></div>',
       ['order_id']],
      
      ['invoice_sent', 'Rechnung versendet', 'invoices', 'Rechnung {{invoice_number}}',
       '<div style="font-family: Arial, sans-serif;"><h2>Ihre Rechnung</h2></div>',
       ['invoice_number', 'total_amount']],
      
      ['password_reset_request', 'Passwort zurücksetzen', 'account', 'Passwort zurücksetzen',
       '<div style="font-family: Arial, sans-serif;"><h2>Passwort zurücksetzen</h2><a href="{{reset_url}}">Link</a></div>',
       ['reset_url']],
      
      ['password_reset_success', 'Passwort geändert', 'account', 'Passwort geändert',
       '<div style="font-family: Arial, sans-serif;"><h2>✅ Passwort geändert</h2></div>',
       []],
      
      ['admin_notification', 'Admin-Benachrichtigung', 'admin', '[Admin] {{subject}}',
       '<div style="font-family: Arial, sans-serif;"><h2>{{subject}}</h2><p>{{message}}</p></div>',
       ['subject', 'message']]
    ];
    
    let added = 0;
    for (const [key, name, category, subject, html, vars] of templates) {
      try {
        await client.query(`
          INSERT INTO email_templates (template_key, name, category, subject, html_content, variables)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (template_key) DO NOTHING
        `, [key, name, category, subject, html, vars]);
        console.log(`   ✅ ${name}`);
        added++;
      } catch (e) {
        console.log(`   ⏭️  ${name} - ${e.message}`);
      }
    }
    
    console.log(`\n📊 Added: ${added} templates\n`);
    
    // 3. Check total
    const result = await client.query('SELECT COUNT(*) FROM email_templates');
    console.log(`✅ Total templates in database: ${result.rows[0].count}\n`);
    
    // List all
    const all = await client.query('SELECT template_key, name FROM email_templates ORDER BY id');
    console.log('📋 All templates:');
    all.rows.forEach(t => console.log(`   - ${t.template_key}: ${t.name}`));
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

executeSql();
