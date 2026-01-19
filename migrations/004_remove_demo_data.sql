-- Remove Demo Data Migration
-- Run this before deploying to production

-- ⚠️ WARNING: This will delete all demo data!
-- Make sure you've backed up any data you want to keep.

BEGIN;

-- 1. Remove demo posts
DELETE FROM posts 
WHERE guide_id IN (
  SELECT id FROM guides WHERE slug IN ('sarah', 'david')
);

-- 2. Remove demo access keys
DELETE FROM access_keys 
WHERE key LIKE 'ak_demo%' 
   OR key LIKE 'ak_sarah%' 
   OR key LIKE 'ak_david%';

-- 3. Remove demo guides
DELETE FROM guides 
WHERE slug IN ('sarah', 'david');

-- 4. Reset app settings to production defaults
UPDATE app_settings
SET 
  hashtags = ARRAY['#VisitIsrael', '#HolyLand'],
  verse_mode_enabled = true,
  max_images_per_post = 5,
  demo_banner_text = NULL  -- Remove demo banner
WHERE id = (SELECT id FROM app_settings LIMIT 1);

-- 5. Clean up any test rate limit logs (optional)
-- DELETE FROM rate_limit_logs WHERE timestamp < NOW() - INTERVAL '7 days';

-- 6. Clean up any test cost tracking (optional)
-- DELETE FROM cost_tracking WHERE timestamp < NOW() - INTERVAL '7 days';

-- Verify cleanup
DO $$ 
DECLARE
  guide_count INTEGER;
  post_count INTEGER;
  demo_key_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO guide_count FROM guides;
  SELECT COUNT(*) INTO post_count FROM posts;
  SELECT COUNT(*) INTO demo_key_count FROM access_keys WHERE key LIKE 'ak_%demo%';
  
  RAISE NOTICE 'Cleanup Summary:';
  RAISE NOTICE '  Guides remaining: %', guide_count;
  RAISE NOTICE '  Posts remaining: %', post_count;
  RAISE NOTICE '  Demo keys remaining: %', demo_key_count;
  
  IF demo_key_count > 0 THEN
    RAISE WARNING 'Demo keys still present! Check access_keys table.';
  END IF;
  
  RAISE NOTICE 'Demo data cleanup completed successfully!';
END $$;

COMMIT;

-- Next steps:
-- 1. Run scripts/generate-access-keys.ts to create production keys
-- 2. Add your first real guide:
--    INSERT INTO guides (slug, display_name) VALUES ('your-guide-slug', 'Guide Name');
-- 3. Update ACCESS_LINKS.md with new production URLs
