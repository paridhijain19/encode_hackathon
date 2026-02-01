# 🚀 Amble Production Setup Guide

This guide walks you through setting up all external services for Amble in production.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Variables Overview](#environment-variables-overview)
3. [Step-by-Step Setup](#step-by-step-setup)
   - [Supabase (Database & Auth)](#1-supabase-database--auth)
   - [Resend (Email)](#2-resend-email)
   - [CometChat (Chat & Video)](#3-cometchat-chat--video)
   - [VAPID Keys (Push Notifications)](#4-vapid-keys-push-notifications)
   - [Mem0 (Long-term Memory)](#5-mem0-long-term-memory-optional)
   - [Google AI (Gemini)](#6-google-ai-gemini)
4. [Running the Application](#running-the-application)

---

## Prerequisites

- Python 3.10+ installed
- Node.js 18+ installed
- Git installed
- A Gmail account (for service signups)

---

## Environment Variables Overview

Create a `.env` file in the `agent/` directory:

```bash
# Core AI
GOOGLE_API_KEY=xxx
GEMINI_API_KEY=xxx

# Database & Auth
DB_BACKEND=supabase
AUTH_BACKEND=supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=Amble <onboarding@yourdomain.com>

# Push Notifications
VAPID_PRIVATE_KEY=xxx
VAPID_PUBLIC_KEY=xxx
VAPID_CONTACT_EMAIL=admin@yourdomain.com

# Chat & Video Calls
COMETCHAT_APP_ID=xxx
COMETCHAT_AUTH_KEY=xxx
COMETCHAT_REGION=us

# Long-term Memory (Optional)
MEM0_API_KEY=xxx

# Environment
ENV=production
```

---

## Step-by-Step Setup

### 1. Supabase (Database & Auth)

**What it does:** Cloud PostgreSQL database + authentication service

**Steps:**

1. **Go to Supabase:** https://supabase.com
2. **Sign up** with your Google account
3. **Create a new project:**
   - Click "New Project"
   - Project Name: `amble-production`
   - Database Password: Generate a strong password (save it!)
   - Region: Choose closest to your users (e.g., `us-west-1`)
   - Click "Create new project" (takes ~2 minutes)

4. **Get your credentials:**
   - Once project is created, go to **Project Settings** (gear icon)
   - Click **API** in the sidebar
   - Copy these values:
     ```
     SUPABASE_URL = "Project URL"
     SUPABASE_ANON_KEY = "anon public" key
     ```

5. **Create database tables:**
   - Go to **SQL Editor** in the left sidebar
   - Click "New query"
   - Paste this SQL and click "Run":

```sql
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
```

6. **Enable Row Level Security (RLS):**
   - Go to **Authentication** → **Policies**
   - For now, disable RLS or create basic policies
   - Example policy for expenses:
   ```sql
   CREATE POLICY "Users can view their own expenses"
   ON expenses FOR SELECT
   USING (auth.uid() = user_id);
   ```

7. **Update .env:**
   ```env
   DB_BACKEND=supabase
   AUTH_BACKEND=supabase
   SUPABASE_URL=https://yourproject.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

---

### 2. Resend (Email)

**What it does:** Sends transactional emails (invites, daily summaries)

**Steps:**

1. **Go to Resend:** https://resend.com
2. **Sign up** with your email
3. **Verify your email** (check inbox)
4. **Add a domain** (or use their test domain):
   - For testing: Use `onboarding@resend.dev` (no setup needed)
   - For production:
     - Go to **Domains** → **Add Domain**
     - Enter your domain (e.g., `amble.app`)
     - Add the DNS records they provide to your domain registrar
     - Wait for verification (~10 minutes)

5. **Get API key:**
   - Go to **API Keys** in the dashboard
   - Click "Create API Key"
   - Name: `Amble Production`
   - Permission: `Sending access`
   - Copy the key (starts with `re_`)

6. **Update .env:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=Amble <onboarding@yourdomain.com>
   ```
   Or for testing:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   EMAIL_FROM=Amble <onboarding@resend.dev>
   ```

---

### 3. CometChat (Chat & Video)

**What it does:** Real-time chat and video/audio calls between family members

**Steps:**

1. **Go to CometChat:** https://www.cometchat.com
2. **Sign up** for free account
3. **Create an app:**
   - Click "Create App"
   - App Name: `Amble`
   - Plan: Choose Free tier (50 users)
   - Region: `us` (or closest to you)

4. **Get credentials:**
   - Go to **API Keys** tab
   - Copy:
     ```
     App ID = your app ID
     Auth Key = Full Access Auth Key
     Region = us (or your chosen region)
     ```

5. **Enable features:**
   - Go to **Roles & Permissions**
   - Enable:
     - ✅ One-on-One Chat
     - ✅ Voice Calling
     - ✅ Video Calling

6. **Update .env:**
   ```env
   COMETCHAT_APP_ID=your_app_id_here
   COMETCHAT_AUTH_KEY=your_auth_key_here
   COMETCHAT_REGION=us
   ```

---

### 4. VAPID Keys (Push Notifications)

**What it does:** Enables browser push notifications for alerts

**Steps:**

1. **Generate VAPID keys** using Python:
   ```bash
   cd agent
   python -c "from py_vapid import Vapid; v = Vapid(); v.generate_keys(); print('Private:', v.private_key.decode()); print('Public:', v.public_key.decode())"
   ```

   This outputs:
   ```
   Private: <long_base64_string>
   Public: <long_base64_string>
   ```

2. **Update .env:**
   ```env
   VAPID_PRIVATE_KEY=your_private_key_here
   VAPID_PUBLIC_KEY=your_public_key_here
   VAPID_CONTACT_EMAIL=admin@yourdomain.com
   ```

3. **Install py-vapid** if not already installed:
   ```bash
   pip install py-vapid
   ```

---

### 5. Mem0 (Long-term Memory) - OPTIONAL

**What it does:** Stores and retrieves conversational memories across sessions

**Steps:**

1. **Go to Mem0:** https://mem0.ai
2. **Sign up** with Google
3. **Get API key:**
   - Go to **API Keys** in dashboard
   - Click "Create API Key"
   - Copy the key

4. **Update .env:**
   ```env
   MEM0_API_KEY=your_mem0_key_here
   ```

**Note:** Mem0 is optional. Without it, the app works but won't remember conversations long-term.

---

### 6. Google AI (Gemini)

**What it does:** Powers the AI agent (already set up if you've been testing)

**Steps:**

1. **Go to Google AI Studio:** https://aistudio.google.com/apikey
2. **Sign in** with your Google account
3. **Create API key** if you haven't already
4. **Update .env:**
   ```env
   GOOGLE_API_KEY=your_google_api_key
   GEMINI_API_KEY=your_google_api_key
   ```

---

## Running the Application

### 1. Install Dependencies

**Backend:**
```bash
cd agent
pip install -r ../requirements.txt
```

**Frontend:**
```bash
cd ..
npm install
```

### 2. Set Environment Variables

**Option A: Create .env file in `agent/` folder:**
```bash
cd agent
notepad .env  # On Windows
# nano .env  # On Mac/Linux
```

Paste all your environment variables, then save.

**Option B: Set in PowerShell (temporary):**
```powershell
$env:GOOGLE_API_KEY="your_key"
$env:SUPABASE_URL="https://xxx.supabase.co"
# ... etc
```

### 3. Start the Backend

```bash
cd agent
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
Agent initialized successfully with Mem0 memory
```

### 4. Start the Frontend

In a **new terminal**:
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 5. Test the App

1. Open http://localhost:5173
2. Click "Get Started"
3. Go through onboarding flow
4. Test chat functionality
5. Add family members via invite

---

## 🔍 Troubleshooting

### Backend won't start
- **Check .env location:** Must be in `agent/` folder or set as system env vars
- **Check Python version:** `python --version` (must be 3.10+)
- **Missing dependencies:** `pip install -r requirements.txt`

### Database errors
- **Verify Supabase credentials:** Check URL and key in .env
- **Tables not created:** Re-run the SQL script from Step 1.5
- **Connection timeout:** Check your internet connection

### Email not sending
- **Invalid API key:** Verify Resend key starts with `re_`
- **Domain not verified:** Use `onboarding@resend.dev` for testing
- **Rate limit:** Free tier has daily limits

### Chat/Video not working
- **Check CometChat credentials:** Verify App ID and Auth Key
- **Browser permissions:** Allow camera/microphone access
- **CORS errors:** Make sure frontend is on http://localhost:5173

### Push notifications not working
- **VAPID keys invalid:** Regenerate using the Python command
- **HTTPS required:** Push notifications only work on HTTPS in production
- **Browser support:** Check browser compatibility

---

## 🎯 Quick Start for Development

If you just want to test locally **without external services**:

1. **Create minimal .env:**
   ```env
   GOOGLE_API_KEY=your_google_key
   DB_BACKEND=local
   AUTH_BACKEND=local
   ```

2. **Start backend:**
   ```bash
   cd agent
   python server.py
   ```

3. **Start frontend:**
   ```bash
   npm run dev
   ```

This uses local JSON storage instead of Supabase, and disables email/chat/push features.

---

## 📊 What Works Without External Services

| Feature | Local Mode | Production Mode |
|---------|-----------|-----------------|
| AI Chat | ✅ (needs Google API) | ✅ |
| Voice Input/Output | ✅ | ✅ |
| Expense/Activity Tracking | ✅ (JSON file) | ✅ (Supabase) |
| Onboarding | ✅ | ✅ |
| Family Invites | ❌ (no email) | ✅ |
| Family Dashboard | ✅ (limited) | ✅ |
| Video Calls | ❌ | ✅ (CometChat) |
| Push Notifications | ❌ | ✅ (VAPID) |
| Long-term Memory | ❌ | ✅ (Mem0) |

---

## 🚀 Deployment to Production

When deploying to a server:

1. **Set environment variables** in your hosting platform
2. **Update CORS settings** in `server.py` to allow your production domain
3. **Use HTTPS** for push notifications and secure communication
4. **Set `ENV=production`** in environment variables
5. **Configure domain** for Resend emails

---

## 💡 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Resend Docs:** https://resend.com/docs
- **CometChat Docs:** https://www.cometchat.com/docs
- **VAPID Guide:** https://web.dev/push-notifications-web-push-protocol/

---

**That's it! You're ready to run Amble in production.** 🎉
