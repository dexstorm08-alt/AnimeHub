-- Add missing admin fields to users table
-- Run this in your Supabase SQL Editor

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin'));

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_watch_time INTEGER DEFAULT 0;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS anime_watched INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE users 
SET 
  role = COALESCE(role, 'user'),
  is_admin = COALESCE(is_admin, FALSE),
  last_login = COALESCE(last_login, created_at),
  total_watch_time = COALESCE(total_watch_time, 0),
  anime_watched = COALESCE(anime_watched, 0)
WHERE role IS NULL OR is_admin IS NULL OR last_login IS NULL OR total_watch_time IS NULL OR anime_watched IS NULL;

-- Make sure your admin user has admin privileges
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET 
  role = 'admin',
  is_admin = TRUE,
  last_login = NOW()
WHERE email = 'your-email@example.com';

-- Verify the changes
SELECT 
  id,
  email,
  username,
  role,
  is_admin,
  last_login,
  total_watch_time,
  anime_watched,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
