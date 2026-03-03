-- 005: Add GPS geolocation support to posts and guide itineraries

-- Add GPS coordinate columns to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;

-- Index for geo queries
CREATE INDEX IF NOT EXISTS idx_posts_location_coords ON posts(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- Guide itineraries table for tour route planning
CREATE TABLE IF NOT EXISTS guide_itineraries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  stops JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One itinerary per guide
CREATE UNIQUE INDEX IF NOT EXISTS idx_guide_itineraries_guide_id ON guide_itineraries(guide_id);

-- RLS (matches existing open pattern)
ALTER TABLE guide_itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for guide_itineraries" ON guide_itineraries FOR ALL USING (true) WITH CHECK (true);

COMMENT ON COLUMN posts.location_lat IS 'GPS latitude where the post was created';
COMMENT ON COLUMN posts.location_lng IS 'GPS longitude where the post was created';
COMMENT ON TABLE guide_itineraries IS 'Tour guide itineraries - stops is a JSONB array of {location_id, location_name, day, order_in_day, notes}';
