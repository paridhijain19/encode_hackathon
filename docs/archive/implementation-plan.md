# Implementation Plan — Amble Hackathon

> **Goal**: Prioritized task list to connect frontend with backend agent.

---

## Phase 1: Core Connection (2 hours)

### 1.1 Create API Client
**File**: `src/services/api.js`

```javascript
const API_URL = 'http://localhost:8000'

export const api = {
  async chat(message, userId = 'default_user') {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, user_id: userId })
    })
    return res.json()
  },
  
  async getState(userId = 'default_user') {
    const res = await fetch(`${API_URL}/api/state?user_id=${userId}`)
    return res.json()
  }
}
```

### 1.2 Create Voice Hook
**File**: `src/hooks/useVoiceInput.js`

- Use Web Speech API for STT
- Handle browser compatibility
- Return: `{ isListening, transcript, startListening, stopListening, error }`

### 1.3 Create TTS Hook
**File**: `src/hooks/useTextToSpeech.js`

- Use SpeechSynthesis API
- Slightly slower rate (0.9) for elderly
- Return: `{ speak, isSpeaking, stop }`

---

## Phase 2: Agent Chat (1.5 hours)

### 2.1 Create AgentContext
**File**: `src/context/AgentContext.jsx`

- Store chat messages
- Handle sendMessage()
- Track open/closed state
- Provide refreshState() for page updates

### 2.2 Create AgentChat Component
**File**: `src/components/AgentChat/AgentChat.jsx`

- Slide-up overlay panel
- Message bubbles (user on right, agent on left)
- Text input + voice button
- Auto-scroll to latest message
- Close button

### 2.3 Wire to ParentPortal
**File**: `src/pages/ParentPortal.jsx`

- Wrap with AgentProvider
- Replace dummy Speak button with real VoiceButton
- Show AgentChat when active

---

## Phase 3: Make It Talk (1 hour)

### 3.1 Voice Input → Agent → Voice Output

```
[Speak Button Click]
    ↓
useVoiceInput.startListening()
    ↓
onTranscript → agentContext.sendMessage(transcript)
    ↓
Response received → useTextToSpeech.speak(response)
```

### 3.2 Visual Feedback

- Pulsing animation when listening
- "Thinking..." indicator when processing
- Message appears with slide-in animation

---

## Phase 4: Backend Endpoint (30 min)

### 4.1 Add `/api/state` Endpoint
**File**: `agent/server.py`

```python
@app.get("/api/state")
async def get_state(user_id: str = "default_user"):
    """Return current data for frontend pages."""
    from agent.tools import _load_data
    data = _load_data()
    return {
        "expenses": data.get("expenses", []),
        "activities": data.get("activities", []),
        "appointments": data.get("appointments", []),
        "moods": data.get("moods", []),
        "user_profile": data.get("user_profile", {})
    }
```

---

## Phase 5: Dynamic Data (1 hour)

### 5.1 Poll for Updates

After each agent message, call `refreshState()` to update pages.

### 5.2 Update BudgetView

Replace hardcoded categories with data from state.

### 5.3 Update HomeView

- Wellness % from actual activity count
- Today's plan from appointments/activities

---

## File Changes Summary

| Action | File |
|--------|------|
| CREATE | `src/services/api.js` |
| CREATE | `src/hooks/useVoiceInput.js` |
| CREATE | `src/hooks/useTextToSpeech.js` |
| CREATE | `src/context/AgentContext.jsx` |
| CREATE | `src/components/AgentChat/AgentChat.jsx` |
| CREATE | `src/components/AgentChat/AgentChat.css` |
| MODIFY | `src/pages/ParentPortal.jsx` |
| MODIFY | `src/App.jsx` (wrap with provider) |
| MODIFY | `agent/server.py` (add /api/state) |

---

## Demo Milestones

| Milestone | What Works |
|-----------|------------|
| M1 | Click Speak → Voice captured → Transcript shown |
| M2 | Transcript sent to agent → Response displayed in chat |
| M3 | Agent response spoken aloud via TTS |
| M4 | "I spent $50 on groceries" → Budget page updates |
| M5 | Page refresh → Data persists |
