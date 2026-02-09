# Amble Database Setup

This directory contains SQL scripts for setting up the Amble database in Supabase.

## 📋 Setup Order

Run these scripts **in order** in your Supabase SQL Editor:

### 1. **schema_final.sql**
Creates all database tables (users, activities, moods, expenses, etc.)
```sql
-- Creates: sessions, chat_history, user_profiles, expenses, 
--          activities, moods, appointments, alerts
-- Sets up: indexes and permissions for anon access
```

### 2. **migration_phase4_family_linking.sql**
Adds family linking support
```sql
-- Adds: linked_elder_id and role columns
-- Creates: get_family_for_elder() function
-- Migrates: existing JSONB preferences to columns
```

### 3. **cleanup_old_data.sql**
Removes old test/development data
```sql
-- Deletes: parent_user, pytest_profile_user, etc.
-- Cleans: all related records across all tables
```

### 4. **seed_demo_data.sql**
Populates database with realistic demo personas
```sql
-- Creates: 4 elders (2 Indian, 2 British)
-- Adds: 10 activities, 7 moods, 10 expenses, 5 appointments each
-- Includes: Realistic chat conversations and alerts
```

## 👥 Demo Personas

After running the scripts, you'll have these users:

### Indian Elders
| user_id | Name | Age | Location | Character |
|---------|------|-----|----------|-----------|
| `padma_sharma` | Padma Sharma | 68 | Mumbai | Spiritual grandmother, yoga enthusiast |
| `rajesh_kumar` | Rajesh Kumar | 72 | Delhi | Retired professional, cricket fan |

### British Elders
| user_id | Name | Age | Location | Character |
|---------|------|-----|----------|-----------|
| `margaret_thompson` | Margaret Thompson | 75 | London | Churchgoing gardener, baker |
| `george_williams` | George Williams | 70 | Manchester | Football supporter, woodworker |

### Family Members
| user_id | Name | Linked To | Role |
|---------|------|-----------|------|
| `anita_sharma` | Anita Sharma | padma_sharma | Daughter |
| `sarah_thompson` | Sarah Thompson | margaret_thompson | Daughter |

## 🔍 Verification Queries

After running all scripts, verify the setup:

```sql
-- Check user profiles
SELECT user_id, name, location, role FROM user_profiles;

-- Check activity counts
SELECT user_id, COUNT(*) as activity_count 
FROM activities 
GROUP BY user_id;

-- Check mood counts
SELECT user_id, COUNT(*) as mood_count 
FROM moods 
GROUP BY user_id;

-- Check expense totals
SELECT user_id, SUM(amount) as total_spent 
FROM expenses 
GROUP BY user_id;

-- Check appointments
SELECT user_id, COUNT(*) as appointment_count 
FROM appointments 
GROUP BY user_id;
```

## 🧪 Testing with Demo Data

### Elder Dashboard
Sign in as an elder to see the personal dashboard:
- Use `padma_sharma`, `rajesh_kumar`, `margaret_thompson`, or `george_williams`

### Family Dashboard
Sign in as a family member to monitor an elder:
- Use `anita_sharma` (monitoring Padma)
- Use `sarah_thompson` (monitoring Margaret)

## 📝 Notes

- **Currency**: Indian personas use INR (₹), British personas use GBP (£)
- **Culture**: Each persona has culturally authentic activities and interests
- **Dates**: Activities use relative dates (NOW() - INTERVAL) for realistic timing
- **Relationships**: Family members are properly linked via `linked_elder_id`

## 🔄 Re-running Setup

To reset the database completely:

```sql
-- Drop all tables (WARNING: Deletes all data!)
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS moods CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Then re-run scripts 1-4 in order
```
