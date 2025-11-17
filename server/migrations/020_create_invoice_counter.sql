-- Create invoice counter table for sequential invoice numbers
CREATE TABLE IF NOT EXISTS invoice_counter (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year)
);

-- Create function to PREVIEW next invoice number (without incrementing)
CREATE OR REPLACE FUNCTION preview_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get current counter without incrementing
  SELECT COALESCE(counter, 0) + 1 INTO next_counter
  FROM invoice_counter
  WHERE year = current_year;
  
  -- If no counter exists for this year, it will be 1
  IF next_counter IS NULL THEN
    next_counter := 1;
  END IF;
  
  -- Format: YYYY-NNNN (e.g., 2025-0001)
  invoice_number := current_year || '-' || LPAD(next_counter::TEXT, 4, '0');
  
  RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Create function to RESERVE next invoice number (actually increment)
CREATE OR REPLACE FUNCTION reserve_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  current_year INTEGER;
  next_counter INTEGER;
  invoice_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Insert or update counter for current year (THIS INCREMENTS!)
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

-- Create function to MANUALLY set counter (for external invoices)
CREATE OR REPLACE FUNCTION set_invoice_counter(invoice_year INTEGER, invoice_counter_value INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO invoice_counter (year, counter)
  VALUES (invoice_year, invoice_counter_value)
  ON CONFLICT (year)
  DO UPDATE SET 
    counter = GREATEST(invoice_counter.counter, invoice_counter_value),
    updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Initialize counter for current year if not exists
INSERT INTO invoice_counter (year, counter)
VALUES (EXTRACT(YEAR FROM CURRENT_DATE), 0)
ON CONFLICT (year) DO NOTHING;
