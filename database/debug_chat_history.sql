-- =============================================
-- Phase 4 Chat & Family Fixes
-- =============================================
-- Run this in Supabase SQL Editor to verify and fix issues
-- =============================================

-- Step 1: Check chat_history table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_history' 
ORDER BY ordinal_position;

-- Step 2: See all distinct user_ids in chat_history (to debug filtering)
SELECT DISTINCT user_id, COUNT(*) as message_count
FROM chat_history 
GROUP BY user_id
ORDER BY message_count DESC;

-- Step 3: Ensure user_id index exists for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id_created 
ON chat_history(user_id, created_at DESC);

-- Step 4: Check user_profiles for family links
SELECT 
    user_id,
    name,
    preferences->>'role' as role,
    preferences->>'linked_elder_id' as linked_elder_id,
    preferences->>'avatar' as avatar
FROM user_profiles
ORDER BY preferences->>'role', name;

-- Step 5: Sample chat history query (replace 'parent_user' with actual user_id)
SELECT 
    id,
    user_id,
    user_message,
    agent_response,
    created_at
FROM chat_history
WHERE user_id = 'parent_user'
ORDER BY created_at DESC
LIMIT 10;

-- =============================================
-- If chat_history is showing ALL users' messages,
-- check if the user_id filter is correct.
-- Run this to see what user_ids are stored:
-- =============================================

-- This shows if messages are correctly filtered
SELECT 
    user_id,
    LEFT(user_message, 50) as message_preview,
    created_at
FROM chat_history
ORDER BY created_at DESC
LIMIT 20;
