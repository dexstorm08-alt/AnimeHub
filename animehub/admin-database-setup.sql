-- Admin Panel Database Setup
-- This script creates the necessary tables for admin functionality

-- Content Reports Table
CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL CHECK (type IN ('inappropriate_content', 'copyright', 'spam', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user UUID REFERENCES users(id) ON DELETE SET NULL,
  anime_id UUID REFERENCES anime(id) ON DELETE SET NULL,
  episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Admin Settings Table
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name VARCHAR(255) NOT NULL DEFAULT 'AnimeHub',
  site_description TEXT DEFAULT 'Your ultimate anime streaming platform',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  allow_registration BOOLEAN DEFAULT TRUE,
  max_file_size INTEGER DEFAULT 5242880, -- 5MB in bytes
  allowed_file_types TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  email_notifications BOOLEAN DEFAULT TRUE,
  analytics_enabled BOOLEAN DEFAULT TRUE,
  cache_enabled BOOLEAN DEFAULT TRUE,
  cache_duration INTEGER DEFAULT 3600, -- 1 hour in seconds
  social_login_enabled BOOLEAN DEFAULT TRUE,
  premium_features_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events Table (for tracking user activity)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'page_view', 'anime_watch', 'search', etc.
  event_data JSONB,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Activity Log Table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'watch', 'favorite', etc.
  activity_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Health Monitoring Table
CREATE TABLE IF NOT EXISTS system_health_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL,
  metric_unit VARCHAR(20),
  status VARCHAR(20) DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'error')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_type ON content_reports(type);
CREATE INDEX IF NOT EXISTS idx_content_reports_created_at ON content_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by ON content_reports(reported_by);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_health_metric ON system_health_log(metric_name);
CREATE INDEX IF NOT EXISTS idx_system_health_created_at ON system_health_log(created_at DESC);

-- RLS Policies for Content Reports
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "Users can create reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Admins can view all reports
CREATE POLICY "Admins can view all reports" ON content_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Admins can update report status
CREATE POLICY "Admins can update reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- RLS Policies for Admin Settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access settings
CREATE POLICY "Only admins can access settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- RLS Policies for Analytics Events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own analytics events
CREATE POLICY "Users can insert own analytics" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all analytics
CREATE POLICY "Admins can view analytics" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- RLS Policies for User Activity Log
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity" ON user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own activity
CREATE POLICY "Users can view own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all activity
CREATE POLICY "Admins can view all activity" ON user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- RLS Policies for System Health Log
ALTER TABLE system_health_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access system health
CREATE POLICY "Only admins can access system health" ON system_health_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.is_admin = true OR users.role = 'admin')
    )
  );

-- Insert default admin settings
INSERT INTO admin_settings (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_content_reports_updated_at 
  BEFORE UPDATE ON content_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at 
  BEFORE UPDATE ON admin_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample content reports for testing
INSERT INTO content_reports (type, title, description, reported_by, priority, status) VALUES
('inappropriate_content', 'Inappropriate Content in Episode', 'User reported inappropriate content in anime episode', (SELECT id FROM users WHERE is_admin = true LIMIT 1), 'high', 'pending'),
('copyright', 'Copyright Violation Report', 'Potential copyright violation in uploaded content', (SELECT id FROM users WHERE is_admin = true LIMIT 1), 'medium', 'investigating'),
('spam', 'Spam User Report', 'User reported for spam behavior', (SELECT id FROM users WHERE is_admin = true LIMIT 1), 'low', 'resolved')
ON CONFLICT DO NOTHING;

-- Create a view for admin dashboard stats
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM anime) as total_anime,
  (SELECT COUNT(*) FROM episodes) as total_episodes,
  (SELECT COUNT(*) FROM reviews) as total_reviews,
  (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days') as recent_users,
  (SELECT COUNT(*) FROM user_progress WHERE last_watched >= NOW() - INTERVAL '24 hours') as active_users,
  (SELECT COUNT(*) FROM users WHERE subscription_type != 'free') as premium_users,
  (SELECT COALESCE(SUM(progress_seconds), 0) FROM user_progress) as total_watch_time_seconds;

-- Grant necessary permissions
GRANT SELECT ON admin_dashboard_stats TO authenticated;
GRANT ALL ON content_reports TO authenticated;
GRANT ALL ON admin_settings TO authenticated;
GRANT ALL ON analytics_events TO authenticated;
GRANT ALL ON user_activity_log TO authenticated;
GRANT ALL ON system_health_log TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE content_reports IS 'Stores user reports about content violations, copyright issues, spam, etc.';
COMMENT ON TABLE admin_settings IS 'Stores global admin settings for the application';
COMMENT ON TABLE analytics_events IS 'Tracks user analytics events for reporting and insights';
COMMENT ON TABLE user_activity_log IS 'Logs user activities for audit and analytics purposes';
COMMENT ON TABLE system_health_log IS 'Monitors system health metrics and performance';
COMMENT ON VIEW admin_dashboard_stats IS 'Aggregated statistics for the admin dashboard';
