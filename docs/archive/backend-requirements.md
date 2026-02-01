# Backend Requirements — Amble Hackathon

> **Purpose**: Changes needed in backend to support frontend design.

---

## 1. New Endpoint: `/api/state`

### Why Needed
Frontend pages need to fetch current data (expenses, activities, etc.) to display dynamically instead of hardcoded values.

### Implementation

```python
# agent/server.py

@app.get("/api/state")
async def get_state(user_id: str = "default_user"):
    """
    Return current data for frontend to render pages.
    Called after agent interactions to refresh UI.
    """
    from agent.tools import _load_data
    data = _load_data()
    
    return {
        "expenses": data.get("expenses", [])[-20:],  # Last 20
        "activities": data.get("activities", [])[-20:],
        "appointments": data.get("appointments", []),
        "moods": data.get("moods", [])[-10:],
        "user_profile": data.get("user_profile", {}),
        "last_updated": datetime.now().isoformat()
    }
```

---

## 2. Response Format Standardization

### Current `/chat` Response
```json
{
  "response": "Noted! $50 for groceries...",
  "session_id": "abc123",
  "user_id": "default_user",
  "memories_used": 2
}
```

### Enhanced `/chat` Response (Optional)
```json
{
  "response": "Noted! $50 for groceries...",
  "session_id": "abc123",
  "user_id": "default_user",
  "memories_used": 2,
  "actions_taken": ["track_expense"],  // NEW: What tools were called
  "data_changed": ["expenses"]         // NEW: What data was modified
}
```

This helps frontend know which parts of UI to refresh.

---

## 3. Voice Processing

### Recommendation: Keep Browser-Side

| Option | Pros | Cons |
|--------|------|------|
| **Browser STT/TTS** ✓ | Free, low latency, works offline | Browser support varies |
| Server STT/TTS | Consistent, more voices | API costs, added latency |

**Decision**: Use browser Web Speech API. No backend changes needed.

---

## 4. Optional: WebSocket/SSE

### Current: Polling
Frontend polls `/api/state` after each interaction.

### Future: Server-Sent Events
```python
@app.get("/stream")
async def stream_updates(user_id: str):
    async def event_generator():
        while True:
            data = _load_data()
            yield f"data: {json.dumps(data)}\n\n"
            await asyncio.sleep(5)
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Decision**: Skip for hackathon. Polling is sufficient.

---

## 5. Medication Tracking (Missing Tool)

### Gap
Frontend has meds list but backend has no medication tool.

### Solution Option A: Use Existing System
Tell agent via chat: "I took my Lisinopril"
Agent uses `record_activity(activity_type='medication', ...)` 

### Solution Option B: Add Meds Tool (Post-MVP)
```python
def track_medication(
    tool_context: ToolContext,
    medication_name: str,
    dosage: str,
    taken: bool = True
) -> dict:
    """Logs medication as taken or missed."""
    ...
```

**Decision**: Use Option A for hackathon. Works with existing tools.

---

## 6. Summary of Changes

| Priority | Change | Effort |
|----------|--------|--------|
| P0 | Add `/api/state` endpoint | 15 min |
| P1 | Add `actions_taken` to chat response | 30 min |
| P2 | Add medication tool | 1 hour |
| P3 | WebSocket for real-time | 2+ hours |

**For Hackathon**: Only P0 is required.
