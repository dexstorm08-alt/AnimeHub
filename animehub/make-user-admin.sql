-- Make current user an admin
-- Replace 'your-email@example.com' with your actual email

-- First, let's see what users exist
SELECT id, email, username, role, is_admin, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- Update the most recent user to be admin (replace with your email)
UPDATE users 
SET 
  role = 'admin',
  is_admin = true,
  updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Or if you want to make the most recent user admin:
-- UPDATE users 
-- SET 
--   role = 'admin',
--   is_admin = true,
--   updated_at = NOW()
-- WHERE id = (SELECT id FROM users ORDER BY created_at DESC LIMIT 1);

-- Verify the change
SELECT id, email, username, role, is_admin, created_at 
FROM users 
WHERE is_admin = true;
