-- CONVERSATIONS (DMs and groups unified)
CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type              TEXT NOT NULL CHECK (type IN ('dm','group')),
  name              TEXT,                          -- null for DMs
  description       TEXT,
  avatar_url        TEXT,
  created_by        UUID REFERENCES profiles(id),
  invite_link       TEXT UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  disappearing_mode TEXT DEFAULT 'off' CHECK (disappearing_mode IN ('off','1d','7d','90d')),
  last_message_id   UUID,                          -- denormalized for list sort
  last_activity_at  TIMESTAMPTZ DEFAULT now(),
  created_at        TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX conversations_activity_idx ON conversations(last_activity_at DESC);

-- CONVERSATION MEMBERS
CREATE TABLE conversation_members (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role            TEXT DEFAULT 'member' CHECK (role IN ('admin','member')),
  is_muted        BOOLEAN DEFAULT false,
  is_pinned       BOOLEAN DEFAULT false,
  is_archived     BOOLEAN DEFAULT false,
  unread_count    INT DEFAULT 0,
  last_read_at    TIMESTAMPTZ DEFAULT now(),
  joined_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

-- MESSAGES (all types)
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN (
                    'text','image','video','audio','voice',
                    'document','sticker','location','contact',
                    'poll','system','deleted')),
  content         TEXT,                            -- text content or caption
  metadata        JSONB DEFAULT '{}',              -- type-specific data
  reply_to_id     UUID REFERENCES messages(id),    -- quoted reply
  forwarded_from  UUID REFERENCES messages(id),    -- forward chain
  is_edited       BOOLEAN DEFAULT false,
  edited_at       TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,                     -- soft delete
  deleted_for     TEXT DEFAULT 'none' CHECK (deleted_for IN ('none','me','everyone')),
  expires_at      TIMESTAMPTZ,                     -- disappearing messages
  temp_id         TEXT,                            -- client optimistic ID
  created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX messages_conv_created_idx ON messages(conversation_id, created_at DESC);
CREATE INDEX messages_reply_idx ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX messages_expires_idx ON messages(expires_at) WHERE expires_at IS NOT NULL;
ALTER TABLE messages ADD COLUMN search_vector TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content,''))) STORED;
CREATE INDEX messages_search_gidx ON messages USING GIN(search_vector);

-- MESSAGE STATUS (delivery receipts)
CREATE TABLE message_status (
  message_id    UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('delivered','read')),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id)
);

-- REACTIONS
CREATE TABLE message_reactions (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);

-- STARRED MESSAGES (per user)
CREATE TABLE starred_messages (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  starred_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, message_id)
);

-- PINNED MESSAGES (per conversation)
CREATE TABLE pinned_messages (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by       UUID REFERENCES profiles(id),
  pinned_at       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, message_id)
);

-- STATUS / STORIES
CREATE TABLE statuses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT CHECK (type IN ('text','image','video')),
  content     TEXT,
  media_url   TEXT,
  bg_color    TEXT,
  expires_at  TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE status_views (
  status_id  UUID REFERENCES statuses(id) ON DELETE CASCADE,
  viewer_id  UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (status_id, viewer_id)
);

-- POLLS
CREATE TABLE polls (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID REFERENCES messages(id) ON DELETE CASCADE,
  question      TEXT NOT NULL,
  allow_multiple BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE poll_options (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  UUID REFERENCES polls(id) ON DELETE CASCADE,
  text     TEXT NOT NULL,
  position INT NOT NULL
);
CREATE TABLE poll_votes (
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  voted_at  TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (option_id, user_id)
);

-- ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE message_status;
ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_members;

-- RLS POLICIES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member read messages" ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_members cm
    WHERE cm.conversation_id = messages.conversation_id
    AND cm.user_id = auth.uid()
  ));
CREATE POLICY "member insert messages" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  ));
CREATE POLICY "own message update" ON messages FOR UPDATE
  USING (sender_id = auth.uid());
-- Apply equivalent policies to all other tables
