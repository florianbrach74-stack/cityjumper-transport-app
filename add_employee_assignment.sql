-- Employee Assignment System
-- Allows contractors to assign orders to specific employees

-- 1. Add employee assignment settings to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_assignment_mode VARCHAR(50) DEFAULT 'all_access' 
CHECK (employee_assignment_mode IN ('all_access', 'manual_assignment'));

-- 2. Add assigned employee to transport_orders table
ALTER TABLE transport_orders
ADD COLUMN IF NOT EXISTS assigned_employee_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_assigned_employee ON transport_orders(assigned_employee_id);

-- 4. Add comments for documentation
COMMENT ON COLUMN users.employee_assignment_mode IS 'all_access: All employees see all orders, manual_assignment: Orders must be assigned to specific employees';
COMMENT ON COLUMN transport_orders.assigned_employee_id IS 'Employee assigned to this order (if contractor uses manual assignment mode)';
