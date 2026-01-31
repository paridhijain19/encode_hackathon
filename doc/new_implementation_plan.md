# Implementation Plan - Amble Hackathon Project

## 1. Backend & Memory (`agent/`)

### Goals
- Expose the agent via HTTP/WebSocket for the frontend.
- Integrate `mem0` for advanced memory capabilities.
- Ensure Opik tracing covers the API layer.

### Proposed Changes

#### [NEW] [server.py](file:///k:/projects/encode_hackathon/agent/server.py)
- FastAPI application.
- Endpoint `/chat` for text/voice interaction.
- Initialize `mem0` client here or in `agent.py`.

#### [MODIFY] [agent.py](file:///k:/projects/encode_hackathon/agent/agent.py)
- Import `mem0`.
- Update `remember_fact` and `recall_memories` to use `mem0.add()` and `mem0.search()`.

#### [MODIFY] [requirements.txt](file:///k:/projects/encode_hackathon/requirements.txt)
- Add `fastapi`, `uvicorn`, `mem0ai`.

## 2. Frontend (`src/`)

### Goals
- Connect the "Speak" / "Voice" interface to the backend.
- Replace static interactions with dynamic agent responses.

### Proposed Changes

#### [NEW] [api.js](file:///k:/projects/encode_hackathon/src/services/api.js)
- Service to handle API calls to `http://localhost:8000`.

#### [MODIFY] [ParentPortal.jsx](file:///k:/projects/encode_hackathon/src/pages/ParentPortal.jsx)
- Use `api.js` to send user input (text/voice transcript) to backend.
- Display agent response (TTS or text).

## 3. Verification Plan

### Automated Tests
- `pytest` for backend logic (if time permits).

### Manual Verification
1.  **Start Backend**: `uvicorn agent.server:app --reload`.
2.  **Start Frontend**: `npm run dev`.
3.  **Interaction**: Click "Speak" in Parent Portal -> Say "Remind me to take my meds at 5".
    -   Verify Agent responds.
    -   Verify `mem0` stores the reminder.
    -   Verify Opik dashboard shows the trace.
