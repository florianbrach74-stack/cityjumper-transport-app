const pool = require('./config/database');

const templates = [
  // VERIFICATION
  {
    key: 'verification_request_admin',
    name: 'Verifizierungsanfrage (Admin)',
    category: 'verification',
    subject: '🔔 Neue Verifizierungsanfrage',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Neue Verifizierungsanfrage</h2>
      <p>Ein neuer Auftragnehmer hat eine Verifizierung beantragt:</p>
      <ul>
        <li><strong>Firma:</strong> {{company_name}}</li>
        <li><strong>Email:</strong> {{email}}</li>
        <li><strong>Telefon:</strong> {{phone}}</li>
      </ul>
      <p>Bitte prüfen Sie die Dokumente im Admin-Dashboard.</p>
    </div>`,
    vars: ['company_name', 'email', 'phone']
  },
  {
    key: 'verification_approved',
    name: 'Verifizierung genehmigt',
    category: 'verification',
    subject: '✅ Verifizierung erfolgreich',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>✅ Ihre Verifizierung wurde genehmigt!</h2>
      <p>Herzlichen Glückwunsch! Ihr Auftragnehmer-Account wurde erfolgreich verifiziert.</p>
      <p>Sie können jetzt Aufträge annehmen und Transporte durchführen.</p>
      <p>Viel Erfolg mit Courierly!</p>
    </div>`,
    vars: []
  },
  {
    key: 'verification_rejected',
    name: 'Verifizierung abgelehnt',
    category: 'verification',
    subject: '❌ Verifizierung abgelehnt',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verifizierung abgelehnt</h2>
      <p>Leider konnten wir Ihre Verifizierung nicht genehmigen.</p>
      <p><strong>Grund:</strong> {{reason}}</p>
      <p>Bitte korrigieren Sie die Punkte und reichen Sie eine neue Verifizierung ein.</p>
    </div>`,
    vars: ['reason']
  },

  // ORDERS
  {
    key: 'order_new_contractor',
    name: 'Neuer Auftrag (Auftragnehmer)',
    category: 'orders',
    subject: 'Neuer Transportauftrag verfügbar',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🚚 Neuer Transportauftrag!</h2>
      <p>Ein neuer Auftrag wurde erstellt:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
        <p><strong>Abholung:</strong> {{pickup_date}}</p>
        <p><strong>Fahrzeug:</strong> {{vehicle_type}}</p>
        <p><strong>Preis:</strong> €{{price}}</p>
      </div>
    </div>`,
    vars: ['order_id', 'pickup_city', 'delivery_city', 'pickup_date', 'vehicle_type', 'price']
  },
  {
    key: 'order_assigned_customer',
    name: 'Auftrag angenommen (Kunde)',
    category: 'orders',
    subject: 'Ihr Auftrag wurde angenommen',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>✅ Ihr Auftrag wurde angenommen!</h2>
      <p>Ihr Transportauftrag wurde von einem Auftragnehmer angenommen:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Auftragnehmer:</strong> {{contractor_name}}</p>
        <p><strong>Telefon:</strong> {{contractor_phone}}</p>
        <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
      </div>
    </div>`,
    vars: ['order_id', 'contractor_name', 'contractor_phone', 'pickup_city', 'delivery_city']
  },
  {
    key: 'order_pickup_warning',
    name: 'Abholzeitfenster-Warnung',
    category: 'orders',
    subject: '⏰ Ihr Auftrag #{{order_id}} - Noch nicht vermittelt',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>⏰ Abholzeitfenster läuft ab</h2>
      <p>Ihr Auftrag wurde noch nicht vermittelt:</p>
      <div style="background: #fff3cd; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
        <p><strong>Verbleibende Zeit:</strong> {{hours_remaining}} Stunden</p>
      </div>
    </div>`,
    vars: ['order_id', 'pickup_city', 'delivery_city', 'hours_remaining']
  },
  {
    key: 'order_expired',
    name: 'Auftrag abgelaufen',
    category: 'orders',
    subject: '❌ Auftrag #{{order_id}} konnte nicht vermittelt werden',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Auftrag konnte nicht vermittelt werden</h2>
      <p>Leider konnten wir keinen Auftragnehmer finden:</p>
      <div style="background: #f8d7da; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
      </div>
      <p>Möchten Sie den Auftrag mit angepassten Konditionen neu erstellen?</p>
    </div>`,
    vars: ['order_id', 'pickup_city', 'delivery_city']
  },

  // BIDS
  {
    key: 'bid_new_customer',
    name: 'Neues Angebot (Kunde)',
    category: 'bids',
    subject: 'Neues Angebot von {{contractor_name}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>💼 Neues Angebot!</h2>
      <p>Sie haben ein neues Angebot erhalten:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Auftragnehmer:</strong> {{contractor_name}}</p>
        <p><strong>Angebotspreis:</strong> €{{bid_price}}</p>
        <p><strong>Nachricht:</strong> {{bid_message}}</p>
      </div>
    </div>`,
    vars: ['order_id', 'contractor_name', 'bid_price', 'bid_message']
  },
  {
    key: 'bid_new_admin',
    name: 'Neue Bewerbung (Admin)',
    category: 'bids',
    subject: '🎯 Neue Bewerbung für Auftrag',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Neue Bewerbung</h2>
      <p>Ein Auftragnehmer hat sich beworben:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Auftragnehmer:</strong> {{contractor_name}}</p>
        <p><strong>Preis:</strong> €{{bid_price}}</p>
      </div>
    </div>`,
    vars: ['order_id', 'contractor_name', 'bid_price']
  },
  {
    key: 'bid_accepted_contractor',
    name: 'Angebot angenommen (Auftragnehmer)',
    category: 'bids',
    subject: '✅ Ihr Angebot wurde angenommen!',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>✅ Glückwunsch!</h2>
      <p>Der Kunde hat Ihr Angebot angenommen:</p>
      <div style="background: #d4edda; padding: 15px; border-radius: 5px;">
        <p><strong>Auftrag #{{order_id}}</strong></p>
        <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
        <p><strong>Preis:</strong> €{{price}}</p>
      </div>
    </div>`,
    vars: ['order_id', 'pickup_city', 'delivery_city', 'price']
  },

  // INVOICES
  {
    key: 'invoice_sent',
    name: 'Rechnung versendet',
    category: 'invoices',
    subject: 'Rechnung {{invoice_number}} von Courierly',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Ihre Rechnung</h2>
      <p>Anbei erhalten Sie Ihre Rechnung:</p>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        <p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
        <p><strong>Datum:</strong> {{invoice_date}}</p>
        <p><strong>Fällig:</strong> {{due_date}}</p>
        <p><strong>Betrag:</strong> €{{total_amount}}</p>
      </div>
      <p>Die Rechnung finden Sie im Anhang.</p>
    </div>`,
    vars: ['invoice_number', 'invoice_date', 'due_date', 'total_amount']
  },
  {
    key: 'invoice_reminder_friendly',
    name: 'Zahlungserinnerung (freundlich)',
    category: 'invoices',
    subject: 'Freundliche Zahlungserinnerung - {{invoice_number}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Freundliche Zahlungserinnerung</h2>
      <p>Wir möchten Sie freundlich an die Zahlung erinnern:</p>
      <div style="background: #fff3cd; padding: 15px; border-radius: 5px;">
        <p><strong>Rechnung:</strong> {{invoice_number}}</p>
        <p><strong>Fällig:</strong> {{due_date}}</p>
        <p><strong>Betrag:</strong> €{{total_amount}}</p>
      </div>
      <p>Falls Sie bereits gezahlt haben, betrachten Sie diese Email als gegenstandslos.</p>
    </div>`,
    vars: ['invoice_number', 'due_date', 'total_amount']
  },
  {
    key: 'invoice_reminder_urgent',
    name: 'Zahlungserinnerung (dringend)',
    category: 'invoices',
    subject: 'Dringende Zahlungserinnerung - {{invoice_number}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>⚠️ Dringende Zahlungserinnerung</h2>
      <p>Die Zahlung ist überfällig:</p>
      <div style="background: #f8d7da; padding: 15px; border-radius: 5px;">
        <p><strong>Rechnung:</strong> {{invoice_number}}</p>
        <p><strong>Fällig:</strong> {{due_date}}</p>
        <p><strong>Betrag:</strong> €{{total_amount}}</p>
        <p><strong>Überfällig:</strong> {{days_overdue}} Tage</p>
      </div>
      <p>Bitte begleichen Sie den Betrag umgehend.</p>
    </div>`,
    vars: ['invoice_number', 'due_date', 'total_amount', 'days_overdue']
  },
  {
    key: 'invoice_reminder_final',
    name: 'Letzte Mahnung',
    category: 'invoices',
    subject: '🚨 Letzte Mahnung - {{invoice_number}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>🚨 Letzte Mahnung</h2>
      <p>Dies ist unsere letzte Mahnung:</p>
      <div style="background: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545;">
        <p><strong>Rechnung:</strong> {{invoice_number}}</p>
        <p><strong>Betrag:</strong> €{{total_amount}}</p>
        <p><strong>Überfällig:</strong> {{days_overdue}} Tage</p>
        <p><strong>Mahngebühren:</strong> €{{late_fee}}</p>
      </div>
      <p><strong>Bitte zahlen Sie innerhalb von 7 Tagen.</strong></p>
    </div>`,
    vars: ['invoice_number', 'total_amount', 'days_overdue', 'late_fee']
  },

  // PASSWORD
  {
    key: 'password_reset_request',
    name: 'Passwort zurücksetzen',
    category: 'account',
    subject: 'Passwort zurücksetzen - Courierly',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Passwort zurücksetzen</h2>
      <p>Sie haben eine Anfrage zum Zurücksetzen gestellt.</p>
      <p>Klicken Sie auf den Link um ein neues Passwort zu setzen:</p>
      <a href="{{reset_url}}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Passwort zurücksetzen</a>
      <p>Dieser Link ist 1 Stunde gültig.</p>
      <p>Falls Sie diese Anfrage nicht gestellt haben, ignorieren Sie diese Email.</p>
    </div>`,
    vars: ['reset_url']
  },
  {
    key: 'password_reset_success',
    name: 'Passwort geändert',
    category: 'account',
    subject: 'Passwort erfolgreich geändert',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>✅ Passwort geändert</h2>
      <p>Ihr Passwort wurde erfolgreich geändert.</p>
      <p>Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p>
      <p>Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie uns sofort!</p>
    </div>`,
    vars: []
  },

  // ADMIN
  {
    key: 'admin_notification',
    name: 'Admin-Benachrichtigung',
    category: 'admin',
    subject: '[Admin] {{subject}}',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Admin-Benachrichtigung</h2>
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
        {{message}}
      </div>
    </div>`,
    vars: ['subject', 'message']
  }
];

async function addTemplates() {
  console.log('🔄 Adding email templates...\n');
  
  let added = 0;
  let skipped = 0;
  
  for (const t of templates) {
    try {
      // Check if exists
      const existing = await pool.query(
        'SELECT id FROM email_templates WHERE template_key = $1',
        [t.key]
      );
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  ${t.name} - bereits vorhanden`);
        skipped++;
        continue;
      }
      
      // Insert
      await pool.query(
        `INSERT INTO email_templates (template_key, name, category, subject, html_content, variables)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [t.key, t.name, t.category, t.subject, t.html, t.vars]
      );
      
      console.log(`✅ ${t.name} - hinzugefügt`);
      added++;
      
    } catch (error) {
      console.error(`❌ Fehler bei ${t.name}:`);
      console.error('   Error:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
  
  console.log(`\n📊 Zusammenfassung:`);
  console.log(`   ✅ Hinzugefügt: ${added}`);
  console.log(`   ⏭️  Übersprungen: ${skipped}`);
  console.log(`   📝 Gesamt: ${templates.length}`);
  
  await pool.end();
}

addTemplates().catch(console.error);
