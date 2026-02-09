-- =============================================
-- AMBLE - Final Database Schema (TEXT user_id)
-- =============================================
-- Run this in Supabase SQL Editor
-- 
-- IMPORTANT: This script will DROP existing tables and recreate them!
-- All user_id fields are TEXT (e.g., 'parent_user', 'family_sarah')
-- =============================================

-- Step 1: Drop existing tables (if any) to ensure clean slate
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS moods CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS family_invites CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =============================================
-- CORE TABLES
-- =============================================

-- Sessions table - stores user session mappings
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- Chat history table - stores all conversations
CREATE TABLE chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    agent_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at DESC);

-- User profiles table - stores user preferences and data
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    location TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- =============================================
-- TRACKING TABLES
-- =============================================

-- Expenses table
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- Activities table
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity_type TEXT,
    description TEXT,
    duration_minutes INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_timestamp ON activities(timestamp DESC);

-- Moods table
CREATE TABLE moods (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    rating TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_moods_user_id ON moods(user_id);
CREATE INDEX idx_moods_timestamp ON moods(timestamp DESC);

-- Appointments table
CREATE TABLE appointments (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    time TIME,
    location TEXT,
    reminded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_appointments_user_id ON appointments(user_id);
CREATE INDEX idx_appointments_date ON appointments(date);

-- Alerts table (family notifications)
CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_timestamp ON alerts(timestamp DESC);

-- =============================================
-- PERMISSIONS (for anon access in development)
-- =============================================

GRANT ALL ON sessions TO anon;
GRANT ALL ON chat_history TO anon;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON expenses TO anon;
GRANT ALL ON activities TO anon;
GRANT ALL ON moods TO anon;
GRANT ALL ON appointments TO anon;
GRANT ALL ON alerts TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =============================================
-- VERIFICATION QUERY (run after to confirm)
-- =============================================
-- SELECT table_name, column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' AND column_name = 'user_id';
-- 
-- Expected result: All user_id columns should show "text" as data_type
