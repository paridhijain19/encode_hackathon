-- =============================================
-- Phase 4 Migration: Family Linking Support
-- =============================================
-- Run this in Supabase SQL Editor
-- 
-- This migration adds support for linking family members to elders.
-- The current implementation stores linked_elder_id in the preferences JSONB,
-- but this migration adds an explicit column + index for better query performance.
-- =============================================

-- Step 1: Add linked_elder_id column to user_profiles
-- This allows direct foreign key lookups instead of JSONB queries
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS linked_elder_id TEXT REFERENCES user_profiles(user_id);

-- Step 2: Add role column for explicit role filtering
-- Roles: 'parent' (elder), 'family', 'caregiver'
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'parent' CHECK (role IN ('parent', 'family', 'caregiver', 'elder'));

-- Step 3: Create indexes for efficient family lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_linked_elder ON user_profiles(linked_elder_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Step 4: Migrate existing data from preferences JSONB to columns
-- This extracts linked_elder_id and role from preferences if they exist
UPDATE user_profiles 
SET 
    linked_elder_id = COALESCE(linked_elder_id, preferences->>'linked_elder_id'),
    role = COALESCE(role, preferences->>'role', 'parent')
WHERE preferences IS NOT NULL;

-- Step 5: Helper function to get family members for an elder
CREATE OR REPLACE FUNCTION get_family_for_elder(elder_id TEXT)
RETURNS TABLE (
    user_id TEXT,
    name TEXT,
    role TEXT,
    relation TEXT,
    avatar TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.name,
        COALESCE(up.role, up.preferences->>'role') as role,
        up.preferences->>'relation' as relation,
        up.preferences->>'avatar' as avatar
    FROM user_profiles up
    WHERE up.linked_elder_id = elder_id
       OR up.preferences->>'linked_elder_id' = elder_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICATION QUERY (run after to confirm)
-- =============================================
-- SELECT user_id, name, role, linked_elder_id, preferences->>'linked_elder_id' as prefs_linked
-- FROM user_profiles;

-- =============================================
-- Grant permissions für anonymous access
-- =============================================
GRANT EXECUTE ON FUNCTION get_family_for_elder(TEXT) TO anon;
