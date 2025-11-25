-- Create email_templates table
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
);

-- Insert all email templates
INSERT INTO email_templates (template_key, name, category, subject, html_content, variables) VALUES

-- VERIFICATION TEMPLATES
('verification_request_admin', 'Verifizierungsanfrage (Admin)', 'verification', '🔔 Neue Verifizierungsanfrage', 
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Neue Verifizierungsanfrage</h2>
  <p>Ein neuer Auftragnehmer hat eine Verifizierung beantragt:</p>
  <ul>
    <li><strong>Firma:</strong> {{company_name}}</li>
    <li><strong>Email:</strong> {{email}}</li>
    <li><strong>Telefon:</strong> {{phone}}</li>
  </ul>
  <p>Bitte prüfen Sie die Dokumente im Admin-Dashboard.</p>
</div>', 
ARRAY['company_name', 'email', 'phone']),

('verification_approved', 'Verifizierung genehmigt', 'verification', '✅ Verifizierung erfolgreich',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>✅ Ihre Verifizierung wurde genehmigt!</h2>
  <p>Herzlichen Glückwunsch! Ihr Auftragnehmer-Account wurde erfolgreich verifiziert.</p>
  <p>Sie können jetzt Aufträge annehmen und Transporte durchführen.</p>
  <p>Viel Erfolg mit Courierly!</p>
</div>',
ARRAY[]::TEXT[]),

('verification_rejected', 'Verifizierung abgelehnt', 'verification', '❌ Verifizierung abgelehnt',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Verifizierung abgelehnt</h2>
  <p>Leider konnten wir Ihre Verifizierung nicht genehmigen.</p>
  <p><strong>Grund:</strong> {{reason}}</p>
  <p>Bitte korrigieren Sie die Punkte und reichen Sie eine neue Verifizierung ein.</p>
</div>',
ARRAY['reason']),

-- ORDER TEMPLATES
('order_new_contractor', 'Neuer Auftrag (Auftragnehmer)', 'orders', 'Neuer Transportauftrag verfügbar',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>🚚 Neuer Transportauftrag!</h2>
  <p>Ein neuer Auftrag wurde erstellt:</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
    <p><strong>Auftrag #{{order_id}}</strong></p>
    <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
    <p><strong>Abholung:</strong> {{pickup_date}}</p>
    <p><strong>Fahrzeug:</strong> {{vehicle_type}}</p>
    <p><strong>Preis:</strong> €{{price}}</p>
  </div>
</div>',
ARRAY['order_id', 'pickup_city', 'delivery_city', 'pickup_date', 'vehicle_type', 'price']),

('order_assigned_customer', 'Auftrag angenommen (Kunde)', 'orders', 'Ihr Auftrag wurde angenommen',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>✅ Ihr Auftrag wurde angenommen!</h2>
  <p>Ihr Transportauftrag wurde von einem Auftragnehmer angenommen:</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
    <p><strong>Auftrag #{{order_id}}</strong></p>
    <p><strong>Auftragnehmer:</strong> {{contractor_name}}</p>
    <p><strong>Telefon:</strong> {{contractor_phone}}</p>
    <p><strong>Route:</strong> {{pickup_city}} → {{delivery_city}}</p>
  </div>
</div>',
ARRAY['order_id', 'contractor_name', 'contractor_phone', 'pickup_city', 'delivery_city']),

-- BID TEMPLATES
('bid_new_customer', 'Neues Angebot (Kunde)', 'bids', 'Neues Angebot von {{contractor_name}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>💼 Neues Angebot!</h2>
  <p>Sie haben ein neues Angebot erhalten:</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
    <p><strong>Auftrag #{{order_id}}</strong></p>
    <p><strong>Auftragnehmer:</strong> {{contractor_name}}</p>
    <p><strong>Angebotspreis:</strong> €{{bid_price}}</p>
    <p><strong>Nachricht:</strong> {{bid_message}}</p>
  </div>
</div>',
ARRAY['order_id', 'contractor_name', 'bid_price', 'bid_message']),

-- INVOICE TEMPLATES
('invoice_sent', 'Rechnung versendet', 'invoices', 'Rechnung {{invoice_number}} von Courierly',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Ihre Rechnung</h2>
  <p>Anbei erhalten Sie Ihre Rechnung:</p>
  <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
    <p><strong>Rechnungsnummer:</strong> {{invoice_number}}</p>
    <p><strong>Datum:</strong> {{invoice_date}}</p>
    <p><strong>Fällig:</strong> {{due_date}}</p>
    <p><strong>Betrag:</strong> €{{total_amount}}</p>
  </div>
  <p>Die Rechnung finden Sie im Anhang.</p>
</div>',
ARRAY['invoice_number', 'invoice_date', 'due_date', 'total_amount']),

('invoice_reminder_friendly', 'Zahlungserinnerung (freundlich)', 'invoices', 'Freundliche Zahlungserinnerung - {{invoice_number}}',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Freundliche Zahlungserinnerung</h2>
  <p>Wir möchten Sie freundlich an die Zahlung erinnern:</p>
  <div style="background: #fff3cd; padding: 15px; border-radius: 5px;">
    <p><strong>Rechnung:</strong> {{invoice_number}}</p>
    <p><strong>Fällig:</strong> {{due_date}}</p>
    <p><strong>Betrag:</strong> €{{total_amount}}</p>
  </div>
  <p>Falls Sie bereits gezahlt haben, betrachten Sie diese Email als gegenstandslos.</p>
</div>',
ARRAY['invoice_number', 'due_date', 'total_amount']),

-- PASSWORD TEMPLATES
('password_reset_request', 'Passwort zurücksetzen', 'account', 'Passwort zurücksetzen - Courierly',
'<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Passwort zurücksetzen</h2>
  <p>Sie haben eine Anfrage zum Zurücksetzen gestellt.</p>
  <p>Klicken Sie auf den Link um ein neues Passwort zu setzen:</p>
  <a href="{{reset_url}}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Passwort zurücksetzen</a>
  <p>Dieser Link ist 1 Stunde gültig.</p>
</div>',
ARRAY['reset_url'])

ON CONFLICT (template_key) DO NOTHING;
