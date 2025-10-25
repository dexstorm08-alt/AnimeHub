-- Add Admin Fields to Existing Tables
-- Run this in your Supabase SQL Editor to add admin functionality

-- 1. Add admin columns to existing users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Update existing admin user (if exists)
UPDATE users 
SET role = 'admin', is_admin = TRUE 
WHERE email = 'admin@animehub.com' OR username = 'admin';

-- 3. Create admin-specific RLS policies
CREATE POLICY IF NOT EXISTS "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can update all users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage all anime" ON anime
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage all episodes" ON episodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can view all user progress" ON user_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can view all favorites" ON user_favorites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can view all watchlists" ON user_watchlist
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

CREATE POLICY IF NOT EXISTS "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
    )
  );

-- 4. Create a default admin user (only if no admin exists)
INSERT INTO users (
    id,
    email,
    username,
    subscription_type,
    role,
    is_admin
) 
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    'dexstorm1@gmail.com',
    'admin',
    'vip',
    'admin',
    TRUE
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE role = 'admin' OR is_admin = true
);

-- 5. Verify the setup
SELECT 
    'Admin setup completed!' as status,
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' OR is_admin = true THEN 1 END) as admin_users
FROM users;

-- Show admin users
SELECT 
    id,
    email,
    username,
    role,
    is_admin,
    created_at
FROM users 
WHERE is_admin = TRUE OR role = 'admin';
