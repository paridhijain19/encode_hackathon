-- =============================================
-- AMBLE - Cleanup Old Test Data
-- =============================================
-- Removes old test/development records before loading demo data
-- Run this BEFORE seed_demo_data.sql
-- =============================================

-- Remove old test user profiles
DELETE FROM user_profiles WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

-- Remove users with default/test names that might be duplicates
DELETE FROM user_profiles WHERE name IN (
    'new_parent',
    'max u'
);

-- Clean up any related data for these test users
DELETE FROM chat_history WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

DELETE FROM sessions WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

DELETE FROM expenses WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

DELETE FROM activities WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

DELETE FROM moods WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

DELETE FROM appointments WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

DELETE FROM alerts WHERE user_id IN (
    'parent_user',
    'pytest_profile_user',
    'pytest_update_profile',
    'parent_new_parent'
);

-- =============================================
-- Remove duplicate user profiles (keep only latest)
-- =============================================
-- This deletes older records when multiple have the same name
DELETE FROM user_profiles
WHERE id NOT IN (
    SELECT MAX(id) 
    FROM user_profiles 
    GROUP BY name
);

-- Verification: Check if cleanup was successful
-- SELECT COUNT(*) as remaining_test_users FROM user_profiles 
-- WHERE user_id IN ('parent_user', 'pytest_profile_user', 'pytest_update_profile', 'parent_new_parent');
-- Expected result: 0

-- Check for any remaining duplicates by name
-- SELECT name, COUNT(*) as count FROM user_profiles GROUP BY name HAVING COUNT(*) > 1;
