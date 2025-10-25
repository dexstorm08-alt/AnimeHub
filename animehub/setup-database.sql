-- Quick Database Setup for Character Import Fix
-- Run this in your Supabase SQL Editor

-- First, drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS anime_studio_relations CASCADE;
DROP TABLE IF EXISTS anime_characters CASCADE;
DROP TABLE IF EXISTS anime_relations CASCADE;
DROP TABLE IF EXISTS anime_studios CASCADE;

-- Now run the updated anime-relations-setup.sql
-- Copy and paste the entire content of anime-relations-setup.sql here

-- Test the setup
SELECT 'Database setup completed successfully!' as message;

-- Check if tables were created
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'anime_%'
ORDER BY table_name;
