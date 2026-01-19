-- Setup Production Guide
-- Replace placeholders with actual values before running

-- 1. Create your first production guide
-- Replace 'your-guide-slug' with actual slug (lowercase, hyphens only)
-- Replace 'Guide Full Name' with the guide's actual name
INSERT INTO guides (slug, display_name)
VALUES ('your-guide-slug', 'Guide Full Name')
RETURNING id, slug, display_name;

-- 2. Create access key for the guide
-- Run scripts/generate-access-keys.ts to get a secure key
-- Then insert it here:
-- INSERT INTO access_keys (key, role, guide_id, active, label)
-- VALUES (
--   'ak_guide_GENERATED_KEY_HERE',
--   'guide',
--   (SELECT id FROM guides WHERE slug = 'your-guide-slug'),
--   true,
--   'Guide Name - Dashboard Access'
-- );

-- 3. Verify setup
SELECT 
  g.slug,
  g.display_name,
  ak.key,
  ak.role,
  ak.active
FROM guides g
LEFT JOIN access_keys ak ON g.id = ak.guide_id
WHERE g.slug = 'your-guide-slug';

-- 4. Test URLs (update YOUR_DOMAIN):
-- Tourist page: https://YOUR_DOMAIN/g/your-guide-slug
-- Guide dashboard: https://YOUR_DOMAIN/d/guide/your-guide-slug?k=ak_guide_GENERATED_KEY_HERE

-- Note: You can create multiple guides by repeating steps 1-2
