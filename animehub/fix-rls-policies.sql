-- Fix RLS Policies for Episode Scraping
-- Run this in your Supabase SQL Editor

-- Drop existing restrictive policies for episodes
DROP POLICY IF EXISTS "Only authenticated users can insert episodes" ON episodes;
DROP POLICY IF EXISTS "Only authenticated users can update episodes" ON episodes;
DROP POLICY IF EXISTS "Only authenticated users can delete episodes" ON episodes;

-- Create more permissive policies for episode scraping
-- Allow anyone to insert episodes (for scraping)
CREATE POLICY "Anyone can insert episodes" ON episodes
  FOR INSERT WITH CHECK (true);

-- Allow anyone to update episodes (for scraping)
CREATE POLICY "Anyone can update episodes" ON episodes
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anyone to delete episodes (for cleanup)
CREATE POLICY "Anyone can delete episodes" ON episodes
  FOR DELETE USING (true);

-- Also fix anime policies for scraping
DROP POLICY IF EXISTS "Only authenticated users can insert anime" ON anime;
DROP POLICY IF EXISTS "Only authenticated users can update anime" ON anime;
DROP POLICY IF EXISTS "Only authenticated users can delete anime" ON anime;

-- Create permissive policies for anime scraping
CREATE POLICY "Anyone can insert anime" ON anime
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update anime" ON anime
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete anime" ON anime
  FOR DELETE USING (true);

-- Verify policies are working
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('episodes', 'anime')
ORDER BY tablename, policyname;





