-- Fix email templates table and add new templates
-- Run with: railway run psql -f fix-email-templates.sql

BEGIN;

-- 1. Fix column type
ALTER TABLE email_templates ALTER COLUMN variables DROP DEFAULT;

ALTER TABLE email_templates 
ALTER COLUMN variables TYPE TEXT[] 
USING CASE 
  WHEN variables IS NULL THEN '{}'::text[]
  ELSE ARRAY(SELECT jsonb_array_elements_text(variables))
END;

-- 2. Insert new templates
INSERT INTO email_templates (template_key, name, category, subject, html_content, variables) VALUES

('verification_request_admin', 'Verifizierungsanfrage (Admin)', 'verification', '🔔 Neue Verifizierungsanfrage', 
 '<div style="font-family: Arial, sans-serif;"><h2>Neue Verifizierung</h2><p>Firma: {{company_name}}</p><p>Email: {{email}}</p></div>',
 ARRAY['company_name', 'email', 'phone']),

('verification_approved', 'Verifizierung genehmigt', 'verification', '✅ Verifizierung erfolgreich',
 '<div style="font-family: Arial, sans-serif;"><h2>✅ Verifizierung genehmigt!</h2><p>Sie können jetzt Aufträge annehmen.</p></div>',
 ARRAY[]::TEXT[]),

('verification_rejected', 'Verifizierung abgelehnt', 'verification', '❌ Verifizierung abgelehnt',
 '<div style="font-family: Arial, sans-serif;"><h2>Verifizierung abgelehnt</h2><p>Grund: {{reason}}</p></div>',
 ARRAY['reason']),

('order_new_contractor', 'Neuer Auftrag (Auftragnehmer)', 'orders', 'Neuer Transportauftrag verfügbar',
 '<div style="font-family: Arial, sans-serif;"><h2>🚚 Neuer Auftrag!</h2><p>Auftrag #{{order_id}}</p><p>{{pickup_city}} → {{delivery_city}}</p></div>',
 ARRAY['order_id', 'pickup_city', 'delivery_city', 'pickup_date', 'vehicle_type', 'price']),

('order_assigned_customer', 'Auftrag angenommen (Kunde)', 'orders', 'Ihr Auftrag wurde angenommen',
 '<div style="font-family: Arial, sans-serif;"><h2>✅ Auftrag angenommen!</h2><p>Auftragnehmer: {{contractor_name}}</p></div>',
 ARRAY['order_id', 'contractor_name', 'contractor_phone', 'pickup_city', 'delivery_city']),

('bid_new_customer', 'Neues Angebot (Kunde)', 'bids', 'Neues Angebot von {{contractor_name}}',
 '<div style="font-family: Arial, sans-serif;"><h2>💼 Neues Angebot!</h2><p>Preis: €{{bid_price}}</p></div>',
 ARRAY['order_id', 'contractor_name', 'bid_price', 'bid_message']),

('bid_new_admin', 'Neue Bewerbung (Admin)', 'bids', '🎯 Neue Bewerbung',
 '<div style="font-family: Arial, sans-serif;"><h2>Neue Bewerbung</h2><p>Auftrag #{{order_id}}</p></div>',
 ARRAY['order_id', 'contractor_name', 'bid_price']),

('bid_accepted_contractor', 'Angebot angenommen (Auftragnehmer)', 'bids', '✅ Ihr Angebot wurde angenommen!',
 '<div style="font-family: Arial, sans-serif;"><h2>✅ Glückwunsch!</h2><p>Auftrag #{{order_id}}</p></div>',
 ARRAY['order_id', 'pickup_city', 'delivery_city', 'price']),

('invoice_sent', 'Rechnung versendet', 'invoices', 'Rechnung {{invoice_number}}',
 '<div style="font-family: Arial, sans-serif;"><h2>Ihre Rechnung</h2><p>Rechnung: {{invoice_number}}</p><p>Betrag: €{{total_amount}}</p></div>',
 ARRAY['invoice_number', 'invoice_date', 'due_date', 'total_amount']),

('password_reset_request', 'Passwort zurücksetzen', 'account', 'Passwort zurücksetzen',
 '<div style="font-family: Arial, sans-serif;"><h2>Passwort zurücksetzen</h2><a href="{{reset_url}}">Passwort zurücksetzen</a></div>',
 ARRAY['reset_url']),

('password_reset_success', 'Passwort geändert', 'account', 'Passwort erfolgreich geändert',
 '<div style="font-family: Arial, sans-serif;"><h2>✅ Passwort geändert</h2><p>Sie können sich jetzt anmelden.</p></div>',
 ARRAY[]::TEXT[]),

('admin_notification', 'Admin-Benachrichtigung', 'admin', '[Admin] {{subject}}',
 '<div style="font-family: Arial, sans-serif;"><h2>Admin-Benachrichtigung</h2><p>{{message}}</p></div>',
 ARRAY['subject', 'message'])

ON CONFLICT (template_key) DO NOTHING;

COMMIT;

-- 3. Show results
SELECT COUNT(*) as total_templates FROM email_templates;
SELECT template_key, name FROM email_templates ORDER BY id;
