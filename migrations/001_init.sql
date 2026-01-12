-- Agent Mary Demo - Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE post_style AS ENUM ('regular', 'holy_land');
CREATE TYPE post_status AS ENUM ('draft', 'approved', 'published');
CREATE TYPE access_role AS ENUM ('guide', 'tourism', 'admin');

-- Guides table
CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  tourist_name TEXT,
  location_label TEXT NOT NULL,
  experience_text TEXT NOT NULL,
  style post_style DEFAULT 'regular',
  images TEXT[] DEFAULT '{}',
  status post_status DEFAULT 'draft',
  verse_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access keys table
CREATE TABLE access_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  role access_role NOT NULL,
  guide_id UUID REFERENCES guides(id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT guide_role_check CHECK (
    (role = 'guide' AND guide_id IS NOT NULL) OR 
    (role IN ('tourism', 'admin') AND guide_id IS NULL)
  )
);

-- App settings table (single row)
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hashtags TEXT[] DEFAULT ARRAY['#VisitIsrael', '#HolyLand'],
  verse_mode_enabled BOOLEAN DEFAULT true,
  max_images_per_post INTEGER DEFAULT 5,
  demo_banner_text TEXT DEFAULT 'This is a demonstration system'
);

-- Insert default settings row
INSERT INTO app_settings (id) VALUES (uuid_generate_v4());

-- Indexes for performance
CREATE INDEX idx_posts_guide_id ON posts(guide_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_access_keys_key ON access_keys(key);
CREATE INDEX idx_access_keys_role ON access_keys(role);
CREATE INDEX idx_access_keys_guide_id ON access_keys(guide_id);

-- RLS Policies (disabled for demo - all access through anon key)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations for demo (using anon key)
CREATE POLICY "Enable all for guides" ON guides FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for access_keys" ON access_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for app_settings" ON app_settings FOR ALL USING (true) WITH CHECK (true);

-- Storage setup instructions (to be executed in Supabase dashboard):
-- 1. Navigate to Storage in Supabase dashboard
-- 2. Create a new bucket named "agent-mary"
-- 3. Set the bucket to "Public"
-- 4. Set the following policies:
--    - Allow INSERT for all users
--    - Allow SELECT for all users
--    - Allow DELETE for all users (for demo purposes)

-- Comments
COMMENT ON TABLE guides IS 'Tour guides with their profile information';
COMMENT ON TABLE posts IS 'Tourist-generated content posts with photos and reviews';
COMMENT ON TABLE access_keys IS 'Secret access keys for dashboards (no auth system)';
COMMENT ON TABLE app_settings IS 'Global application settings (single row)';
