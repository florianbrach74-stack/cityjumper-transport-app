-- Add invoice tracking to orders

-- 1. Add new statuses to orders
ALTER TABLE transport_orders 
ADD COLUMN IF NOT EXISTS invoiced_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid' 
CHECK (payment_status IN ('unpaid', 'paid', 'overdue'));

-- 2. Create invoices table to store sent invoices
CREATE TABLE IF NOT EXISTS sent_invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES users(id),
  invoice_date DATE NOT NULL,
  due_date DATE,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  pdf_url TEXT,
  notes TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create invoice_order_items to link orders to invoices
CREATE TABLE IF NOT EXISTS invoice_order_items (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL REFERENCES sent_invoices(invoice_number) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES transport_orders(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(invoice_number, order_id)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_invoiced_at ON transport_orders(invoiced_at);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON transport_orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON transport_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_sent_invoices_customer ON sent_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sent_invoices_status ON sent_invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_sent_invoices_date ON sent_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_order_items(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_order ON invoice_order_items(order_id);

-- 5. Add comment
COMMENT ON TABLE sent_invoices IS 'Stores all sent invoices with their details';
COMMENT ON TABLE invoice_order_items IS 'Links orders to invoices (many-to-many relationship)';
