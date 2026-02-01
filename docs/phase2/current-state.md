# Phase 2 — Current State Analysis

> **Purpose**: Document exactly what exists before making changes.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │  Landing Page   │  │  Parent Portal  │  │  Family Dashboard   │ │
│  │  (marketing)    │  │  (elderly user) │  │  (family member)    │ │
│  └─────────────────┘  └────────┬────────┘  └─────────────────────┘ │
│                               │ ✅ Connected    ❌ Static           │
└────────────────────────────────┼───────────────────────────────────┘
                                │
                     HTTP POST /chat, GET /api/state
                                │
┌────────────────────────────────┼───────────────────────────────────┐
│                         BACKEND (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      server.py (464 lines)                    │  │
│  │  - /chat → Agent interaction                                  │  │
│  │  - /api/state → Return all data for frontend                  │  │
│  │  - Mem0 integration (semantic memory)                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                  Agent System (ADK + Gemini)                  │  │
│  │  Root Agent → Mood Agent → Activity Agent                     │  │
│  │      ↓                                                        │  │
│  │  tools.py (919 lines, 15+ tools)                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                │                                    │
└────────────────────────────────┼───────────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
      ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
      │ data.json │       │   Mem0    │       │   Opik    │
      │ (local)   │       │  (cloud)  │       │ (tracing) │
      └───────────┘       └───────────┘       └───────────┘
```

---

## Backend Files

| File | Lines | Purpose |
|------|-------|---------|
| `agent/server.py` | 464 | FastAPI server, Mem0 integration |
| `agent/agent.py` | ~200 | Root + sub-agents (ADK) |
| `agent/tools.py` | 919 | All 15+ tool functions |
| `agent/prompts.py` | 198 | Agent instruction prompts |
| `agent/models.py` | ~50 | Pydantic schemas |
| `agent/opik_agent.py` | ~100 | Local CLI runner |
| `agent/data.json` | ~100 | Local data storage |

---

## Tool Inventory (from tools.py)

### Expense Tools
| Tool | Function | Storage |
|------|----------|---------|
| `track_expense()` | Log expense with amount, category | data.json |
| `get_expense_summary()` | Get spending by category | data.json |

### Mood Tools
| Tool | Function | Storage |
|------|----------|---------|
| `track_mood()` | Log mood, energy level | data.json |
| `get_mood_history()` | Trends over N days | data.json |

### Activity Tools
| Tool | Function | Storage |
|------|----------|---------|
| `record_activity()` | Log activity with duration | data.json |
| `get_activity_history()` | Summary by type | data.json |

### Appointment Tools
| Tool | Function | Storage |
|------|----------|---------|
| `schedule_appointment()` | Create appointment | data.json |
| `get_upcoming_appointments()` | Next N days | data.json |
| `cancel_appointment()` | Mark as cancelled | data.json |

### Wellness Tools
| Tool | Function | Storage |
|------|----------|---------|
| `analyze_wellness_patterns()` | Cross-domain analysis | data.json |
| `send_family_alert()` | Log alert (no delivery) | data.json |
| `get_family_alerts_history()` | Past alerts | data.json |

### Profile Tools
| Tool | Function | Storage |
|------|----------|---------|
| `update_user_profile()` | Save name, age, etc. | data.json |
| `get_user_profile()` | Retrieve profile | data.json |

### Memory Tools
| Tool | Function | Storage |
|------|----------|---------|
| `remember_fact()` | Store explicit fact | data.json |
| `recall_memories()` | Retrieve facts | data.json |

### External Tools
| Tool | Function | Storage |
|------|----------|---------|
| `google_search()` | Web search for events | External API |

---

## Frontend Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/pages/ParentPortal.jsx` | 426 | Elderly user interface |
| `src/pages/ParentPortal.css` | 300+ | Styles |
| `src/pages/FamilyDashboard.jsx` | 358 | Family member interface |
| `src/pages/FamilyDashboard.css` | 300+ | Styles |
| `src/pages/LandingPage.jsx` | 350+ | Marketing page |
| `src/pages/LandingPage.css` | 400+ | Styles |
| `src/context/AgentContext.jsx` | ~100 | Agent state management |
| `src/hooks/useVoiceInput.js` | ~50 | Web Speech STT |
| `src/hooks/useTextToSpeech.js` | ~30 | Web Speech TTS |
| `src/services/api.js` | ~50 | Backend HTTP client |
| `src/components/AgentChat/` | ~200 | Chat overlay |

---

## Parent Portal Views (Connected ✅)

| Route | Component | Data Source |
|-------|-----------|-------------|
| `/parent` | HomeView | `/api/state` |
| `/parent/budget` | BudgetView | `/api/state` |
| `/parent/health` | HealthView | `/api/state` |
| `/parent/activities` | ActivitiesView | `/api/state` |
| `/parent/family` | FamilyView | `/api/state` |

---

## Family Dashboard Views (Static ❌)

| Route | Component | Status |
|-------|-----------|--------|
| `/family` | DashboardHome | Hardcoded data |
| `/family/activity` | ActivityFeed | Placeholder |
| `/family/budget` | BudgetInsights | Placeholder |
| `/family/health` | HealthDashboard | Placeholder |
| `/family/alerts` | AlertsView | Placeholder |
| `/family/network` | FamilyNetwork | Placeholder |

---

## Data Structure (data.json)

```json
{
  "expenses": [
    { "timestamp": "...", "amount": 500, "category": "groceries", "description": "..." }
  ],
  "moods": [
    { "timestamp": "...", "mood": "happy", "energy_level": 7, "details": "..." }
  ],
  "activities": [
    { "timestamp": "...", "activity_name": "Walk", "activity_type": "walking", "duration_minutes": 45 }
  ],
  "appointments": [
    { "id": 1, "title": "Dr. Sharma", "appointment_type": "doctor", "date_time": "...", "status": "scheduled" }
  ],
  "family_alerts": [
    { "timestamp": "...", "message": "...", "urgency": "low", "category": "wellness" }
  ],
  "user_profile": {
    "name": "Lakshmi",
    "age": 68,
    "location": "Pune",
    "interests": ["reading", "gardening"]
  },
  "memories": [
    { "timestamp": "...", "fact": "Grandson Arjun is 8 years old and loves cricket" }
  ]
}
```

---

## Environment Variables (.env)

| Variable | Purpose | Required |
|----------|---------|----------|
| `GOOGLE_API_KEY` | Gemini LLM | ✅ |
| `MEM0_API_KEY` | Mem0 semantic memory | ✅ |
| `OPIK_API_KEY` | Tracing/observability | Optional |
| `OPIK_WORKSPACE` | Opik workspace name | Optional |

---

## What's Missing for Production

### Authentication
- [ ] User accounts (elderly)
- [ ] Family member accounts
- [ ] Session management
- [ ] Invite system

### Database
- [ ] Supabase Postgres (replace data.json)
- [ ] Multi-user support
- [ ] Row Level Security

### Communication
- [ ] Chat SDK (CometChat/Dyte)
- [ ] Video call integration
- [ ] Email service (Resend)
- [ ] Push notifications

### Proactive Agent
- [ ] Scheduled tasks (APScheduler)
- [ ] Morning greetings
- [ ] Inactivity detection
- [ ] Appointment reminders

### Family Portal
- [ ] Data connection to backend
- [ ] Real-time updates
- [ ] Alert delivery pipeline

---

## Test Results Summary (from user)

### Backend: 13/13 ✅
- API state endpoint
- Expense, activity, mood tracking
- Appointments, daily summary
- Family alerts, wellness analysis
- Remember facts, profile updates
- Web search, memory recall

### Frontend-Backend: 12/12 ✅
- Data structure validation
- All 5 parent views connected
- AgentChat, VoiceButton
- CORS, HTML/JS serving
- End-to-end flow

---

*Last Updated: January 31, 2025*
