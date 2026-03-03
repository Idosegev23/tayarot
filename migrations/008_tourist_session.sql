-- 008: Add tourist_session_id for tracking anonymous tourist sessions
-- Allows tourists to see their own posts without authentication

ALTER TABLE posts ADD COLUMN IF NOT EXISTS tourist_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_posts_tourist_session ON posts(tourist_session_id);

COMMENT ON COLUMN posts.tourist_session_id IS 'Anonymous session UUID stored in tourist browser localStorage';
