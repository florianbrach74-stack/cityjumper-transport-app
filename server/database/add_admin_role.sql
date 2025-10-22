-- Add admin role to users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'contractor', 'admin'));

-- Create admin user (password: admin123 - CHANGE THIS!)
-- Password hash for 'admin123'
INSERT INTO users (email, password, role, first_name, last_name, company_name)
VALUES (
  'admin@cityjumper.com',
  '$2a$10$rN8qZxH8vH7jKxH8vH7jKOqZxH8vH7jKxH8vH7jKxH8vH7jKxH8vO',
  'admin',
  'Admin',
  'CityJumper',
  'CityJumper Admin'
)
ON CONFLICT (email) DO NOTHING;
