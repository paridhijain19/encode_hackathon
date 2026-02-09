-- Supabase Tables for Amble (Complete Schema)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 
-- IMPORTANT: Choose ONE of the two schemas below based on your needs:
-- - Schema A: Uses UUID with foreign key relationships (production-ready)
-- - Schema B: Uses TEXT user_id (simpler, currently implemented in code)
--
-- The app is currently configured to use Schema B (TEXT user_id)
-- If you want to use Schema A (UUID), you'll need to update supabase_store.py

-- =============================================
-- SCHEMA A: UUID-based with Foreign Keys
-- =============================================
-- This schema uses proper relational design with UUID foreign keys
-- Provides better referential integrity but requires more complex queries

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'elder', -- 'elder' or 'family'
    elder_user_id UUID REFERENCES users(id),
    relation TEXT, -- 'son', 'daughter', etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    age INTEGER,
    location TEXT,
    interests TEXT[], -- array of interests
    health_conditions TEXT[],
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2),
    category TEXT,
    description TEXT,
    date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    activity_type TEXT,
    description TEXT,
    duration_minutes INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moods table
CREATE TABLE moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    rating TEXT, -- 'happy', 'sad', 'anxious', etc.
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title TEXT,
    description TEXT,
    date DATE,
    time TIME,
    location TEXT,
    reminded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT, -- 'success', 'warning', 'info', 'danger'
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Family invites table
CREATE TABLE family_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_user_id UUID REFERENCES users(id),
    family_email TEXT NOT NULL,
    family_name TEXT,
    relation TEXT,
    token TEXT UNIQUE NOT NULL,
    accepted BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date DESC);
CREATE INDEX idx_activities_user_time ON activities(user_id, timestamp DESC);
CREATE INDEX idx_moods_user_time ON moods(user_id, timestamp DESC);
CREATE INDEX idx_appointments_user_date ON appointments(user_id, date);
CREATE INDEX idx_alerts_user_read ON alerts(user_id, read);
CREATE INDEX idx_invites_token ON family_invites(token);

-- =============================================
-- SCHEMA B: TEXT-based (Currently Implemented)
-- =============================================
-- This schema uses TEXT for user_id (e.g., 'parent_user', 'family_sarah')
-- Simpler to implement but no foreign key constraints
-- THIS IS WHAT THE CODE CURRENTLY USES

-- Sessions table - stores user session mappings
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Chat history table - stores all conversations
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    agent_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    location TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =============================================
-- TRACKING TABLES
-- =============================================

-- =============================================
-- SCHEMA B: TEXT-based (Currently Implemented)
-- =============================================
-- This schema uses TEXT for user_id (e.g., 'parent_user', 'family_sarah')
-- Simpler to implement but no foreign key constraints
-- THIS IS WHAT THE CODE CURRENTLY USES

-- Sessions table - stores user session mappings
CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- Chat history table - stores all conversations
CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    agent_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- User profiles table - stores user preferences and data
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    name TEXT,
    location TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- =============================================
-- TRACKING TABLES (Schema B)
-- =============================================

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    category TEXT,
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    activity_type TEXT,
    description TEXT,
    duration_minutes INTEGER,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);

-- Moods table
CREATE TABLE IF NOT EXISTS moods (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    rating TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_moods_user_id ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_moods_timestamp ON moods(timestamp DESC);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
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
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

-- Alerts table (family notifications)
CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);

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
-- NOTES
-- =============================================
-- 1. Schema A (UUID-based): Better for production with proper referential integrity
-- 2. Schema B (TEXT-based): Currently implemented - simpler but less strict
-- 3. All user_id fields in Schema B are TEXT (not UUID) to support simple identifiers
--    like 'parent_user', 'family_sarah', etc.
-- 4. RLS (Row Level Security) is disabled for development
-- 5. To enable RLS in production, uncomment the ALTER TABLE lines below:

-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
