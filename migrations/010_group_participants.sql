-- 010: Add group participants (tourist whitelist)
-- Guides add participant names to groups; tourists must match to enter the chat.

CREATE TABLE IF NOT EXISTS group_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_participant UNIQUE (group_id, first_name, last_name)
);

CREATE INDEX IF NOT EXISTS idx_group_participants_group_id
  ON group_participants(group_id);

ALTER TABLE group_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for group_participants" ON group_participants
  FOR ALL USING (true) WITH CHECK (true);
