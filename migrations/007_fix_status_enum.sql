-- 007: Add missing post_status enum values used by the application

ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'rejected';
