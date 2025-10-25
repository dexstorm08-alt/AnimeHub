-- Add user preferences table for genre preferences and other user settings
-- Run this in your Supabase SQL Editor

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres TEXT[] DEFAULT '{}',
  preferred_language VARCHAR(10) DEFAULT 'en',
  auto_play_next BOOLEAN DEFAULT true,
  quality_preference VARCHAR(10) DEFAULT 'auto',
  theme_preference VARCHAR(10) DEFAULT 'light',
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "recommendations": true}',
  privacy_settings JSONB DEFAULT '{"profile_public": true, "watch_history_public": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically create preferences for new users
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create preferences when user signs up
CREATE TRIGGER create_user_preferences_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Add some sample genre data for testing
INSERT INTO user_preferences (user_id, favorite_genres)
SELECT 
  id,
  ARRAY['Action', 'Adventure', 'Fantasy']::TEXT[]
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_preferences)
LIMIT 1;

-- Verify the table was created
SELECT * FROM user_preferences LIMIT 5;
