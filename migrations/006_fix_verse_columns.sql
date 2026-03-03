-- 006: Fix verse columns - code uses biblical_verse/verse_reference but DB has verse_text

-- Add correct columns
ALTER TABLE posts ADD COLUMN IF NOT EXISTS biblical_verse TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS verse_reference TEXT;

-- Migrate any existing data from old column
UPDATE posts SET biblical_verse = verse_text WHERE verse_text IS NOT NULL AND biblical_verse IS NULL;

-- Drop old column
ALTER TABLE posts DROP COLUMN IF EXISTS verse_text;

COMMENT ON COLUMN posts.biblical_verse IS 'Biblical verse text displayed on styled posts';
COMMENT ON COLUMN posts.verse_reference IS 'Biblical verse reference (e.g. Psalm 23:1)';
