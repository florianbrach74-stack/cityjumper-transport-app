-- Create pricing settings table for admin configuration
CREATE TABLE IF NOT EXISTS pricing_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value DECIMAL(10, 4) NOT NULL,
  setting_unit VARCHAR(20),
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

-- Insert default pricing settings
INSERT INTO pricing_settings (setting_key, setting_value, setting_unit, description) VALUES
  ('distance_price_under_100km', 0.50, '€/km', 'Preis pro Kilometer für Strecken unter 100km'),
  ('distance_price_over_100km', 0.70, '€/km', 'Preis pro Kilometer für Strecken über 100km'),
  ('hourly_rate', 22.50, '€/h', 'Stundensatz für Fahrzeit (Mindestlohn-basiert)'),
  ('start_fee', 6.00, '€', 'Einmalige Startgebühr pro Auftrag'),
  ('extra_stop_fee', 6.00, '€', 'Gebühr pro zusätzlichem Stop (Abholung oder Zustellung)'),
  ('platform_commission', 15.00, '%', 'Plattform-Provision (Auftragnehmer erhält 100% - dieser Wert)'),
  ('recommended_markup', 20.00, '%', 'Empfohlener Aufschlag auf Mindestpreis für Kunden'),
  ('waiting_time_free_minutes', 30, 'min', 'Kostenlose Wartezeit (erste X Minuten)'),
  ('waiting_time_block_minutes', 5, 'min', 'Wartezeit wird in X-Minuten-Blöcken abgerechnet'),
  ('waiting_time_block_price', 3.00, '€', 'Preis pro Wartezeit-Block')
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_settings_key ON pricing_settings(setting_key);

-- Add comment
COMMENT ON TABLE pricing_settings IS 'Admin-konfigurierbare Preiskalkulationsparameter';
