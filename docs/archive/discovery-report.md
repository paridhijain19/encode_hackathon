# Discovery Report — Amble Hackathon

> **Purpose**: Document current state of frontend and backend before implementation.

---

## 1. Backend Analysis

### `/chat` Endpoint (`agent/server.py`)

```
POST /chat
Request:  { message: str, user_id: str, session_id?: str }
Response: { response: str, session_id: str, user_id: str, memories_used: int }
```

**Flow:**
1. Search Mem0 for relevant memories (top 5)
2. Prepend memories to agent context
3. Run agent with message
4. Save conversation to Mem0
5. Return response

**Notes:**
- REST only (no WebSocket/SSE)
- Polling required for real-time updates
- No STT/TTS — frontend must handle voice

### Available Tools (15+ in `agent/tools.py`)

| Category | Tools | Data Storage |
|----------|-------|--------------|
| Expense | `track_expense`, `get_expense_summary` | `data.json` |
| Mood | `track_mood`, `get_mood_history` | `data.json` |
| Activity | `record_activity`, `get_activity_history` | `data.json` |
| Appointments | `schedule_appointment`, `get_upcoming_appointments`, `cancel_appointment` | `data.json` |
| Wellness | `analyze_wellness_patterns`, `send_family_alert` | `data.json` |
| Memory | `remember_fact`, `recall_memories` | Mem0 + `data.json` |
| Profile | `update_user_profile`, `get_user_profile` | `data.json` |
| Search | `google_search` (via AgentTool) | External |

### Data Structure (`agent/data.json`)

```json
{
  "expenses": [{ timestamp, amount, category, description }],
  "moods": [{ timestamp, mood, energy_level, details }],
  "activities": [{ timestamp, activity_name, activity_type, duration_minutes }],
  "appointments": [{ id, title, date_time, location, status }],
  "family_alerts": [{ timestamp, message, urgency, category }],
  "user_profile": { name, location, age, interests, health_conditions }
}
```

### What's Missing for Frontend

| Need | Current State | Solution |
|------|---------------|----------|
| Get all data for a page | No endpoint | Add `/api/state` endpoint |
| Real-time sync | REST only | Polling or SSE |
| Voice processing | None | Use browser Web Speech API |

---

## 2. Frontend Analysis

### Current File Structure

```
src/
├── pages/
│   ├── ParentPortal.jsx (426 lines) + .css
│   ├── FamilyDashboard.jsx + .css
│   └── LandingPage.jsx + .css
├── hooks/          ← EMPTY
├── services/       ← EMPTY
├── index.css
├── App.jsx
└── main.jsx
```

### ParentPortal Views (from screenshots)

| Route | What's Shown | Data Source | Backend Connected? |
|-------|--------------|-------------|-------------------|
| `/parent` | Wellness %, quick actions, today's plan | Hardcoded | ❌ No |
| `/parent/budget` | Pie chart, category bars, $835/$1200 | Hardcoded | ❌ No |
| `/parent/health` | Meds list, quick check-in, doctor visits | Hardcoded | ❌ No |
| `/parent/activities` | Category filters, nearby activities | Hardcoded | ❌ No |
| `/parent/family` | Quick call, video call, voice note | Hardcoded | ❌ No |

### UI Components Present

- ✅ Bottom navigation (5 tabs)
- ✅ Voice FAB button (visible but non-functional)
- ✅ Section cards with headers
- ✅ Progress indicators (wellness %, budget circle)
- ✅ Checkbox items (meds, schedule)
- ✅ Category filter pills

### What's Working vs Broken

| Feature | Status | Issue |
|---------|--------|-------|
| Page navigation | ✅ Works | — |
| "Speak" button | ❌ Broken | Just toggles `isListening` state, no voice API |
| Data display | 🟡 Static | All hardcoded in JSX |
| Quick actions | ❌ Non-functional | Buttons don't do anything |
| Add expense | ❌ Non-functional | No form or API call |

---

## 3. Feature Comparison: Backend vs Frontend

| Feature | Backend Tool | Frontend UI | Gap |
|---------|--------------|-------------|-----|
| Track expense | `track_expense()` | "Add Expense" button | Button not connected |
| View expenses | `get_expense_summary()` | Budget page with chart | Static data |
| Log mood | `track_mood()` | None | No mood input UI |
| Record activity | `record_activity()` | Quick action buttons | Not connected |
| View meds | — | Health page meds list | Backend has no meds list |
| Schedule appointment | `schedule_appointment()` | Doctor visits card | Not connected |
| Voice input | — | Speak FAB | No Web Speech API |
| Send family alert | `send_family_alert()` | None | No alert UI |
| Get suggestions | `get_activity_suggestions()` | "Just for You" card | Static |

### Key Insights

1. **Backend has more features than frontend shows**
   - Mood tracking, wellness analysis, family alerts exist but have no UI

2. **Frontend has features backend doesn't support**
   - Medication list/tracking (hardcoded in Health view)
   - Today's schedule checklist

3. **No connection layer exists**
   - `src/services/` is empty — no API client
   - `src/hooks/` is empty — no voice hook

---

## 4. Voice Integration Analysis

### Current State
- "Speak" button toggles `isListening` state
- No Web Speech API integration
- No TTS for responses

### Recommended Approach
```
Frontend (Browser) ─────────────────────────▶ Backend
      │                                           │
      ├─ Web Speech API (STT)                     ├─ /chat endpoint
      ├─ Send transcript to /chat                 ├─ Agent processes
      ├─ Receive response                         ├─ Returns text
      └─ Web Speech API (TTS)                     └─ Mem0 stores
```

**Why browser-side voice:**
- Lower latency
- Works offline (STT)
- No additional API costs
- Browser APIs are mature

---

## 5. Smart UI Strategy

### Use Pre-built Libraries For:

| UI Element | Library | AI Provides |
|------------|---------|-------------|
| Budget pie chart | Chart.js | `{ category: amount }` |
| Schedule calendar | react-calendar | `[{ date, events }]` |
| Progress rings | Custom SVG (exists) | `{ current, total }` |
| Category bars | CSS (exists) | `{ name, spent, budget }` |

### AI Generates Directly:

| Content Type | Format | Rendered By |
|--------------|--------|-------------|
| Chat responses | Text | Simple `<div>` |
| Activity suggestions | `[{ title, time, icon }]` | Card component |
| Wellness insights | `{ message, type }` | Alert component |

---

## 6. Data Flow Design (Proposed)

### Agent → Pages (Auto-sync)

```
User says: "I spent $50 on groceries"
    │
    ├─ Agent calls track_expense()
    ├─ Data saved to data.json
    ├─ Response sent to frontend
    │
    └─ Frontend polls /api/state
        └─ Budget page updates automatically
```

### Pages → Agent (Manual edits)

```
User clicks "Took Meds" button
    │
    ├─ Frontend calls /chat with:
    │   message: "__SYSTEM_ACTION: mark_medication_taken Lisinopril"
    │
    └─ Agent interprets and updates state
```

---

## 7. Critical Gaps to Address

### P0 — Demo Critical

1. **Create `src/services/api.js`** — API client for `/chat`
2. **Create `src/hooks/useVoiceInput.js`** — Web Speech API hook
3. **Wire Speak button** — Capture voice → send to backend → TTS response
4. **Display agent responses** — Chat overlay or inline

### P1 — Nice to Have

5. **Add `/api/state` endpoint** — Return current data for pages
6. **Wire quick action buttons** — "Took Meds", "Walk Done", etc.
7. **Dynamic data in views** — Fetch from backend instead of hardcoded

### P2 — Polish

8. **Real-time updates** — Polling or SSE
9. **Loading states** — Skeleton cards while fetching
10. **Error handling** — Graceful fallbacks

---

## 8. Recommended Next Steps

1. **Create `/docs/frontend-design.md`** — Component architecture
2. **Create `/docs/implementation-plan.md`** — Prioritized task list
3. **Create `/docs/backend-requirements.md`** — What backend needs to change
4. **Create `/docs/demo-script.md`** — 2-minute demo flow
