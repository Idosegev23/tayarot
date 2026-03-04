-- 009: Add guide authentication and groups system
-- This migration:
--   1. Extends guides table with auth fields
--   2. Creates groups table with status enum
--   3. Creates group_itinerary_days table
--   4. Creates group_itinerary_stops table
--   5. Adds group_id to posts table

-- ============================================
-- 1. EXTEND GUIDES TABLE
-- ============================================

ALTER TABLE guides ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_guides_auth_user_id
  ON guides(auth_user_id) WHERE auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_guides_email
  ON guides(email) WHERE email IS NOT NULL;

-- ============================================
-- 2. CREATE GROUP STATUS ENUM
-- ============================================

DO $$ BEGIN
  CREATE TYPE group_status AS ENUM ('active', 'completed', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. CREATE GROUPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status group_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_groups_guide_slug UNIQUE (guide_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_groups_guide_id ON groups(guide_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups(status);

-- ============================================
-- 4. CREATE GROUP_ITINERARY_DAYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS group_itinerary_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_itinerary_day UNIQUE (group_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_group_itinerary_days_group_id
  ON group_itinerary_days(group_id);

-- ============================================
-- 5. CREATE GROUP_ITINERARY_STOPS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS group_itinerary_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_id UUID NOT NULL REFERENCES group_itinerary_days(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  time TEXT,
  location_name TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  description TEXT,
  fun_facts TEXT,
  duration_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_stop_order UNIQUE (day_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_group_itinerary_stops_day_id
  ON group_itinerary_stops(day_id);

-- ============================================
-- 6. ADD GROUP_ID TO POSTS TABLE
-- ============================================

ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id)
  WHERE group_id IS NOT NULL;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_itinerary_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for groups" ON groups
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for group_itinerary_days" ON group_itinerary_days
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for group_itinerary_stops" ON group_itinerary_stops
  FOR ALL USING (true) WITH CHECK (true);
