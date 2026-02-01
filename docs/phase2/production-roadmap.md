# Phase 2 — Production Roadmap

> **Goal**: Transform hackathon prototype into deployment-ready product.

---

## Current State Summary

| Component | Status | Storage |
|-----------|--------|---------|
| Agent Core | ✅ 15+ tools | — |
| Backend API | ✅ FastAPI + Mem0 | Mem0 (cloud) + `data.json` (local) |
| Frontend (Parent) | ✅ Connected | — |
| Frontend (Family) | 🟡 Static placeholders | — |
| Onboarding | ❌ None | — |
| Database | ❌ Local JSON only | `agent/data.json` |
| Communication | ❌ No chat/call system | — |
| Proactive Agent | ❌ Reactive only | — |
| Family Alerts | 🟡 Logging only | `data.json` |

---

## Point 1: Database Migration (Supabase)

### Current Problem
- All data in `agent/data.json` (single file, no multi-user)
- No backup, no sync, local only
- Mem0 handles semantic memory but not structured data

### Proposed Solution

| Layer | Technology | Purpose |
|-------|------------|---------|
| Structured Data | **Supabase Postgres** | Expenses, activities, appointments, profiles |
| Semantic Memory | **Mem0** (keep) | Long-term context, conversation recall |
| Real-time Sync | **Supabase Realtime** | Push updates to frontend |

### Supabase MCP Server Option

> Supabase offers an official MCP server that lets AI agents directly query/update the database.

**Pros:**
- Agent can run SQL directly via MCP tools
- No custom backend endpoints needed
- Built-in Row Level Security (RLS)

**Cons:**
- Added complexity (MCP protocol setup)
- Debugging harder (agent writes SQL)
- Security: agent has DB access

**Recommendation**: Use **standard Supabase SDK** for now — MCP is not needed for MVP. Agent continues using Python tools → tools write to Supabase instead of JSON.

### Database Schema (Proposed)

```sql
-- Users table (elderly)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  age INTEGER,
  location TEXT,
  interests TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Family members linked to user
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  relation TEXT, -- 'son', 'daughter', 'spouse'
  email TEXT,
  phone TEXT,
  invite_accepted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Expenses
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL NOT NULL,
  category TEXT,
  description TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  activity_name TEXT,
  activity_type TEXT,
  duration_minutes INTEGER,
  notes TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Moods
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  mood TEXT,
  energy_level INTEGER,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title TEXT,
  appointment_type TEXT,
  date_time TIMESTAMPTZ,
  location TEXT,
  doctor_name TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Family alerts
CREATE TABLE family_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  message TEXT,
  urgency TEXT, -- 'low', 'medium', 'high', 'critical'
  category TEXT,
  read_by UUID[], -- family member IDs who read it
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Migration Path

1. Create Supabase project
2. Run schema SQL
3. Replace `_load_data()` / `_save_data()` in `tools.py` with Supabase client
4. Keep Mem0 for semantic memory (no change)

---

## Point 2: Onboarding & Communication System

### Onboarding Flow (New User)

```
1. Landing Page → "Get Started"
       ↓
2. /onboarding/welcome
   - Name, age, location
   - Interests (checkbox list)
       ↓
3. /onboarding/family
   - Add family members (name, email, relation)
   - Send invite links via email
       ↓
4. /onboarding/complete
   - Agent introduction
   - First voice interaction
       ↓
5. Redirect to /parent (main app)
```

### Family Invite System

| Step | Action | Implementation |
|------|--------|----------------|
| User adds family | Form input | Save to `family_members` table |
| Send invite | Email with link | Supabase + Resend/Sendgrid |
| Family clicks link | Auth flow | `?token=xyz` → verify → create account |
| Family logs in | Access dashboard | `/family` portal |

### Communication Handlers

Agent is NOT the only communication channel. We need a **Communication Service** layer:

```
                    ┌──────────────────────┐
                    │  Communication Hub   │
                    │                      │
   Agent ───────────┤                      ├──────► Email (Invite/Alert)
                    │                      │
   Frontend ────────┤                      ├──────► Chat (Text messages)
                    │                      │
   Backend ─────────┤                      ├──────► Call/Video (SDK)
                    │                      │
                    └──────────────────────┘
```

### Chat & Call SDK Recommendation

| Requirement | Option 1: CometChat | Option 2: Dyte | Option 3: Zegocloud |
|-------------|---------------------|----------------|---------------------|
| Text Chat | ✅ | ✅ | ✅ |
| Voice Call | ✅ | ✅ | ✅ |
| Video Call | ✅ | ✅ | ✅ (4K) |
| React SDK | ✅ | ✅ | ✅ |
| Free tier | Yes (25 MAU) | Yes (10k min/mo) | Yes (limited) |
| HIPAA | ✅ | ✅ | ⚠️ |
| Complexity | Medium | Low | Medium |

**Recommendation**: Start with **CometChat** — comprehensive features, good React SDK, healthcare compliant.

### Email Integration

For invite emails and alert notifications:
- **Resend** (simple, developer-friendly)
- **Supabase Edge Functions** + SMTP (built-in)

---

## Point 3: Proactive Agent Behavior

### Current Problem
Agent is purely reactive — waits for user to speak.

### Proposed Proactive Features

| Trigger | Agent Action |
|---------|--------------|
| Morning (8 AM) | "Good morning! How are you feeling today?" |
| No activity in 4 hours | Gentle check-in |
| Missed medication time | "Did you take your 9 AM medication?" |
| Pattern anomaly detected | "I noticed you've been less active. Everything okay?" |
| Appointment tomorrow | "Just a reminder: Dr. Sharma tomorrow at 10 AM" |

### Implementation Options

**Option A: Backend Scheduler (Cron)**
```python
# Using APScheduler in FastAPI
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@scheduler.scheduled_job('cron', hour=8, minute=0)
async def morning_greeting():
    for user in active_users:
        generate_proactive_message(user, "morning_checkin")
        push_notification(user, message)
```

**Option B: Supabase Edge Functions + Triggers**
```sql
-- Database trigger on inactivity
CREATE OR REPLACE FUNCTION check_inactivity()
RETURNS TRIGGER AS $$
BEGIN
  -- If no activity in 4 hours, fire alert
  PERFORM send_proactive_message(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Recommendation**: Use **APScheduler** for now (simpler), migrate to Supabase functions later.

### Push Notification Delivery

- **Web Push** (browser notifications)
- **Email** (for critical alerts)
- **In-app** (banner when user opens app)

---

## Point 4: Family Portal Functionality

### Current State
- FamilyDashboard.jsx exists (358 lines)
- All 6 views are static placeholders
- No authentication or data connection

### Views to Implement

| Route | Data Source | Features |
|-------|-------------|----------|
| `/family` | Overview | Real-time stats from Supabase |
| `/family/activity` | Activities table | Timeline of parent's activities |
| `/family/budget` | Expenses table | Spending charts, category breakdown |
| `/family/health` | Moods + Appointments | Mood trends, upcoming appointments |
| `/family/alerts` | Family_alerts table | Smart insights from agent |
| `/family/network` | Family_members table | Family circle, invite more members |

### Family Authentication

| Flow | Implementation |
|------|----------------|
| Email link invite | Supabase Auth magic link |
| Password login | Supabase Auth email/password |
| Session management | Supabase client-side auth |
| Role-based access | RLS policies in Postgres |

### Real-time Updates

```javascript
// Subscribe to parent's activities
const { data, error } = await supabase
  .channel('activities')
  .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'activities' },
      (payload) => setActivities(prev => [...prev, payload.new])
  )
  .subscribe()
```

---

## Point 5: Pattern Detection & Family Alerts

### Current State
- `analyze_wellness_patterns()` exists in tools.py
- `send_family_alert()` logs to data.json
- No delivery to family members

### Alert Delivery Pipeline

```
1. Pattern Detection (Agent)
       ↓
2. Alert Generation
   - Urgency classification
   - Natural language message
       ↓
3. Store in Supabase (family_alerts table)
       ↓
4. Push to Family Portal (Realtime subscription)
       ↓
5. Optional: Email notification (if high urgency)
```

### Alert Types

| Category | Example | Urgency | Delivery |
|----------|---------|---------|----------|
| Positive | "Mom walked 45 minutes today!" | Low | In-app only |
| Activity | "Less active than usual today" | Medium | In-app + email |
| Mood | "Feeling lonely past 3 days" | Medium | In-app + email |
| Health | "Missed medication 2 days in a row" | High | In-app + email + push |
| Safety | "No interaction in 24 hours" | Critical | All channels |

### Backend Changes

```python
# In tools.py - replace current send_family_alert
async def send_family_alert(message, urgency, category, user_id):
    # 1. Save to Supabase
    await supabase.table("family_alerts").insert({
        "user_id": user_id,
        "message": message,
        "urgency": urgency,
        "category": category
    }).execute()
    
    # 2. If high urgency, send email
    if urgency in ["high", "critical"]:
        family = await get_family_members(user_id)
        for member in family:
            await send_alert_email(member.email, message)
    
    # 3. Trigger push notification
    await push_to_family_portal(user_id, message)
```

---

## Implementation Priority

### Phase 2A — Foundation (Week 1)

| Task | Effort | Dependency |
|------|--------|------------|
| Supabase project setup | 1h | — |
| Database schema | 2h | Supabase |
| Migrate tools.py to Supabase | 4h | Schema |
| User authentication (Supabase Auth) | 3h | Supabase |
| Environment config | 1h | — |

### Phase 2B — Onboarding (Week 1-2)

| Task | Effort | Dependency |
|------|--------|------------|
| Onboarding UI (3 screens) | 4h | Auth |
| Family invite system | 3h | Email |
| Email service (Resend) | 2h | — |
| Invite acceptance flow | 3h | Auth + Email |

### Phase 2C — Communication (Week 2)

| Task | Effort | Dependency |
|------|--------|------------|
| CometChat setup | 2h | — |
| Chat UI component | 3h | CometChat |
| Video call integration | 3h | CometChat |
| Wire to Family Portal | 2h | UI |

### Phase 2D — Proactive Agent (Week 2-3)

| Task | Effort | Dependency |
|------|--------|------------|
| APScheduler setup | 2h | — |
| Morning greeting | 1h | Scheduler |
| Inactivity check | 2h | Scheduler + DB |
| Web push notifications | 3h | — |

### Phase 2E — Family Portal (Week 3)

| Task | Effort | Dependency |
|------|--------|------------|
| Family auth flow | 3h | Supabase Auth |
| Dashboard data connection | 4h | Supabase |
| Real-time subscriptions | 2h | Supabase |
| Alert delivery pipeline | 4h | All above |

---

## Estimated Total Effort

| Phase | Hours |
|-------|-------|
| 2A Foundation | ~11h |
| 2B Onboarding | ~12h |
| 2C Communication | ~10h |
| 2D Proactive | ~8h |
| 2E Family Portal | ~13h |
| **Total** | **~54h** |

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase migration breaks tools | High | Test each tool individually |
| CometChat pricing for scale | Medium | Start free tier, evaluate at 25 MAU |
| Proactive agent spam | Medium | Rate limits, user preferences |
| Family invite emails spam-filtered | Low | Use verified domain, SPF/DKIM |
| Real-time sync delays | Low | Polling fallback |

---

## Next Steps

1. **Review this document**
2. **Decide on SDK choices** (CometChat vs alternatives)
3. **Create Supabase project** (I can guide you)
4. **Begin Phase 2A**

---

*Last Updated: January 31, 2025*
