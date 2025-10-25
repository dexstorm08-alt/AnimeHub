-- Create content_reports table for admin functionality
-- This table stores reports about anime content

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL, -- References anime.id or episode.id
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('anime', 'episode')),
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('inappropriate_content', 'copyright', 'spam', 'other')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  reported_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_reports_content_id ON content_reports(content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_content_type ON content_reports(content_type);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reported_by ON content_reports(reported_by);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can create reports
CREATE POLICY "Users can create content reports" ON content_reports
  FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view their own reports" ON content_reports
  FOR SELECT USING (auth.uid() = reported_by);

-- Admins can view all reports
CREATE POLICY "Admins can view all content reports" ON content_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can update report status
CREATE POLICY "Admins can update content reports" ON content_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Admins can delete reports
CREATE POLICY "Admins can delete content reports" ON content_reports
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Insert some sample reports for testing
INSERT INTO content_reports (content_id, content_type, report_type, title, description, reported_by, status, priority) VALUES
  ('00000000-0000-0000-0000-000000000001', 'anime', 'inappropriate_content', 'Inappropriate Content', 'This anime contains inappropriate content for younger viewers.', '00000000-0000-0000-0000-000000000001', 'pending', 'high'),
  ('00000000-0000-0000-0000-000000000002', 'anime', 'copyright', 'Copyright Violation', 'This anime may be using copyrighted material without permission.', '00000000-0000-0000-0000-000000000001', 'investigating', 'medium'),
  ('00000000-0000-0000-0000-000000000003', 'anime', 'spam', 'Spam Content', 'This anime appears to be spam or low-quality content.', '00000000-0000-0000-0000-000000000001', 'resolved', 'low')
ON CONFLICT (id) DO NOTHING;

