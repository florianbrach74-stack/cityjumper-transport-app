-- Create invoice counter table for sequential invoice numbers
CREATE TABLE IF NOT EXISTS invoice_counter (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year)
);

-- Create function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Insert or update counter for current year
  INSERT INTO invoice_counter (year, counter)
  VALUES (current_year, 1)
  ON CONFLICT (year)
  DO UPDATE SET 
    counter = invoice_counter.counter + 1,
    updated_at = CURRENT_TIMESTAMP
  RETURNING counter INTO next_counter;
  
  -- Format: YYYY-NNNN (e.g., 2025-0001)
  invoice_number := current_year || '-' || LPAD(next_counter::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Initialize counter for current year if not exists
INSERT INTO invoice_counter (year, counter)
VALUES (EXTRACT(YEAR FROM CURRENT_DATE), 0)
ON CONFLICT (year) DO NOTHING;
