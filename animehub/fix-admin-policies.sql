-- Fix Admin Policies - Remove Infinite Recursion
-- Run this in your Supabase SQL Editor to fix the admin policies

-- 1. Drop all problematic admin policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all anime" ON anime;
DROP POLICY IF EXISTS "Admins can manage all episodes" ON episodes;
DROP POLICY IF EXISTS "Admins can view all user progress" ON user_progress;
DROP POLICY IF EXISTS "Admins can view all favorites" ON user_favorites;
DROP POLICY IF EXISTS "Admins can view all watchlists" ON user_watchlist;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON reviews;

-- 2. Create a function to check if user is admin (avoids infinite recursion)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND (role = 'admin' OR is_admin = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create new admin policies using the function
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can manage all anime" ON anime
  FOR ALL USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can manage all episodes" ON episodes
  FOR ALL USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can view all user progress" ON user_progress
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can view all favorites" ON user_favorites
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can view all watchlists" ON user_watchlist
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

-- 4. Verify the fix
SELECT 
    'Admin policies fixed!' as status,
    COUNT(*) as total_policies
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'anime', 'episodes', 'user_progress', 'user_favorites', 'user_watchlist', 'reviews')
AND policyname LIKE '%Admin%';

-- 5. Test the admin function
SELECT 
    'Admin function test' as test,
    is_admin_user('550e8400-e29b-41d4-a716-446655440000') as admin_user_exists;
