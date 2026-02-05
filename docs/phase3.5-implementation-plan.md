# Phase 3.5 Implementation Plan — Agent Architecture Expansion

> **Goal**: Transform Amble from a CRUD chatbot into a production-ready proactive AI companion.

---

## 📊 Current State Analysis

### ✅ Existing (but not wired)
| Component | Status | Notes |
|-----------|--------|-------|
| **Scheduler** `agent/scheduler.py` | ✅ | 426 lines, all tasks defined |
| **Settings** `Settings.jsx` | ✅ | 740 lines, full UI |
| **Route** `/app/settings` | ✅ | Already in App.jsx |

### ❌ Missing/Broken
| Issue | Priority | Notes |
|-------|----------|-------|
| **Onboarding Voice** | P0 | No mic in ProfileStep |
| **Proactive Notifications UI** | P0 | Scheduler runs but no frontend |
| **Messages Page** | P0 | Route `/app/messages` not defined |
| **Agent Value** | P1 | Just CRUD, no insights/analysis |

---

## 📋 Implementation Tasks

### **1. Onboarding Voice Input** (P0)

**File**: `src/pages/Onboarding.jsx`

Add voice input to `ProfileStep` for name and location:

```jsx
// In ProfileStep
import { useVoiceInput } from '../hooks/useVoiceInput'

function ProfileStep({ formData, updateFormData, onNext, onBack }) {
    const voice = useVoiceInput()
    
    // Voice button next to name input
    <div className="voice-input-group">
        <input value={formData.name} ... />
        <button onClick={voice.startListening}>
            <Mic />
        </button>
    </div>
    
    // Auto-fill when transcript ready
    useEffect(() => {
        if (voice.transcript) {
            updateFormData('name', voice.transcript)
        }
    }, [voice.transcript])
}
```

---

### **2. Proactive Agent + Notification UI** (P0)

#### 2.1 Create Notifications Component

**File**: `src/components/NotificationBanner.jsx` (NEW)

```jsx
function NotificationBanner({ notifications, onDismiss }) {
    // Floating notification banner for proactive messages
    // Types: greeting, reminder, alert, check-in
}
```

**Notification Types**:
- 🌅 Morning greeting
- 💊 Medication reminder
- 📅 Appointment reminder
- 💬 Check-in prompt

#### 2.2 Add Polling/WebSocket for Notifications

**File**: `src/hooks/useNotifications.js` (NEW)

```javascript
export function useNotifications(userId) {
    // Poll /api/notifications every 30s
    // Or use Server-Sent Events for real-time
    return { notifications, dismiss, unreadCount }
}
```

#### 2.3 Backend Endpoint

**File**: `agent/server.py` (ADD)

```python
@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str):
    # Return pending proactive messages
    pass

@app.post("/api/notifications/{id}/dismiss")
async def dismiss_notification(id: str):
    pass
```

#### 2.4 Store Proactive Messages

**File**: `database/schema.sql` (ADD table)

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,  -- greeting, reminder, check_in, alert
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

### **3. Messages Page** (P0)

**File**: `src/pages/Messages.jsx` (NEW)

Chat history viewer:
- List all past conversations
- Search/filter by date
- Re-read old messages

**Route**: Add to `App.jsx`:
```jsx
<Route path="/app/messages" element={<Messages />} />
```

**API**: Use existing `/api/family/chat/{user_id}` endpoint

---

### **4. Settings Integration** (P1)

Settings page exists but needs API connection fixes:

#### 4.1 Verify API Endpoints

Check `agent/server.py` for:
- `GET /api/settings/{user_id}`
- `POST /api/settings/{user_id}`

#### 4.2 Add Missing Endpoints

```python
@app.get("/api/settings/{user_id}")
async def get_user_settings(user_id: str):
    return db_get_settings(user_id)

@app.post("/api/settings/{user_id}")
async def save_user_settings(user_id: str, settings: dict):
    return db_save_settings(user_id, settings)
```

---

### **5. Agent Architecture Expansion** (P1)

Transform from CRUD-bot to value-adding companion:

#### 5.1 Proactive Analysis Tools

Add to `agent/tools.py`:

```python
@tool
def analyze_spending_patterns(user_id: str) -> str:
    """Analyze spending and provide insights."""
    expenses = db_get_expenses(user_id, limit=30)
    # Calculate trends, anomalies, suggestions
    return f"You've spent ₹{total} this month, mostly on {top_category}."

@tool
def check_wellness_trend(user_id: str) -> str:
    """Check wellness indicators and flag concerns."""
    moods = db_get_moods(user_id, limit=14)
    activities = db_get_activities(user_id, limit=14)
    # Detect declining mood, missed medications, etc.
    return insights

@tool
def suggest_daily_activity(user_id: str) -> str:
    """Suggest activities based on interests and weather."""
    profile = db_get_profile(user_id)
    # Match interests to suggestions
    return suggestion
```

#### 5.2 Enhanced System Prompt

```python
SYSTEM_PROMPT = """
You are Amble, a caring AI companion for elderly individuals.

PERSONALITY:
- Warm, patient, and encouraging
- Remember personal details and use them
- Celebrate small victories
- Notice patterns and offer gentle insights

PROACTIVE BEHAVIORS:
- If user seems down, ask about their day
- If expense seems unusual, gently confirm
- If no activity logged, suggest something

TOOLS AVAILABLE:
- Track expenses, activities, moods
- Set reminders and appointments
- Analyze patterns and provide insights
- Send messages to family
"""
```

---

## 📁 File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/Onboarding.jsx` | MODIFY | Add voice to ProfileStep |
| `src/pages/Messages.jsx` | NEW | Chat history viewer |
| `src/components/NotificationBanner.jsx` | NEW | Proactive notification UI |
| `src/hooks/useNotifications.js` | NEW | Notification polling hook |
| `src/App.jsx` | MODIFY | Add /app/messages route |
| `agent/server.py` | MODIFY | Add notification endpoints |
| `agent/tools.py` | MODIFY | Add analysis tools |
| `database/schema.sql` | MODIFY | Add notifications table |

---

## ⏱️ Effort Estimate

| Task | Hours |
|------|-------|
| 1. Onboarding Voice | 1h |
| 2. Notification UI + Backend | 4h |
| 3. Messages Page | 2h |
| 4. Settings API | 1h |
| 5. Agent Tools | 3h |
| **Total** | **~11h** |

---

## 🎯 Priority Order

1. **Messages Page** — Quick win, reuses existing API
2. **Onboarding Voice** — Small change, high UX value
3. **Notification UI** — Core proactive feature
4. **Settings API** — Complete existing feature
5. **Agent Tools** — Long-term value
