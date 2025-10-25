-- Fix RLS Policies for Anime Import System
-- Run this in your Supabase SQL Editor to fix import issues

-- 1. Ensure anime table has proper policies for imports
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Only authenticated users can insert anime" ON anime;
DROP POLICY IF EXISTS "Only authenticated users can update anime" ON anime;
DROP POLICY IF EXISTS "Only authenticated users can delete anime" ON anime;

-- 2. Create more permissive policies for authenticated users
-- This allows authenticated users to perform all operations on anime
CREATE POLICY "Authenticated users can manage anime" ON anime
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 3. Ensure episodes table has proper policies
DROP POLICY IF EXISTS "Only authenticated users can insert episodes" ON episodes;
DROP POLICY IF EXISTS "Only authenticated users can update episodes" ON episodes;
DROP POLICY IF EXISTS "Only authenticated users can delete episodes" ON episodes;

CREATE POLICY "Authenticated users can manage episodes" ON episodes
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 4. Create a function to check if user is admin (for admin operations)
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

-- 5. Add admin-specific policies for scheduled imports
CREATE POLICY "Admins can manage scheduled imports" ON scheduled_imports
  FOR ALL USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

CREATE POLICY "Admins can view import logs" ON import_logs
  FOR ALL USING (
    auth.uid() IS NOT NULL AND is_admin_user(auth.uid())
  );

-- 6. Ensure the scheduled imports tables exist and have proper policies
-- (These will be created by the scheduled-import-setup.sql if not already present)

-- 7. Test the policies by checking if they work
-- You can run this query to test:
-- SELECT COUNT(*) FROM anime WHERE title ILIKE '%test%';
-- This should work for authenticated users

-- 8. Add a note about the fix
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated for anime import system. Authenticated users can now manage anime and episodes.';
END $$;
