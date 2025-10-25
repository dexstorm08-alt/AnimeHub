-- Create Admin User Script
-- Run this in your Supabase SQL Editor to create your first admin user

-- 1. Create admin user in auth.users table (you'll need to do this through Supabase Auth UI or API)
-- For now, we'll create the user profile assuming the auth user exists

-- 2. Insert admin user profile (replace with your actual user ID from auth.users)
-- You can get your user ID from the Supabase Auth UI or by checking auth.users table

-- Example: If your email is 'your-email@example.com', first create the auth user through Supabase Auth UI
-- Then replace the UUID below with the actual user ID

INSERT INTO users (
    id,
    email,
    username,
    subscription_type,
    role,
    is_admin
) VALUES (
    'YOUR_USER_ID_HERE', -- Replace with your actual user ID from auth.users
    'your-email@example.com', -- Replace with your email
    'admin', -- Replace with your desired username
    'vip',
    'admin',
    TRUE
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    is_admin = TRUE,
    subscription_type = 'vip',
    updated_at = NOW();

-- 3. Verify the admin user was created
SELECT 
    id,
    email,
    username,
    role,
    is_admin,
    subscription_type,
    created_at
FROM users 
WHERE is_admin = TRUE OR role = 'admin';

-- 4. Test admin function
SELECT 
    'Admin function test' as test,
    is_admin_user('YOUR_USER_ID_HERE') as admin_check; -- Replace with your user ID
