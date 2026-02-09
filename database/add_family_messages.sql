-- =============================================
-- ADD FAMILY_MESSAGES TABLE
-- =============================================
-- Run this in Supabase SQL Editor to add family messaging support
-- =============================================

-- Family Messages table - stores messages between elder and family members
CREATE TABLE IF NOT EXISTS family_messages (
    id BIGSERIAL PRIMARY KEY,
    elder_user_id TEXT NOT NULL,
    family_member_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_family_messages_elder ON family_messages(elder_user_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_family ON family_messages(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_sender ON family_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_family_messages_created_at ON family_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_messages_elder_family ON family_messages(elder_user_id, family_member_id);

-- Permissions for anon access in development
GRANT ALL ON family_messages TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify table was created
-- SELECT * FROM information_schema.tables WHERE table_name = 'family_messages';
