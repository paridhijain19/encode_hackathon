# Amble Hackathon Task Checklist

## 🔴 P0 — Demo Critical

- [ ] **Backend API**
  - [ ] Create `agent/server.py` with FastAPI
  - [ ] Implement `/chat` endpoint invoking `root_agent`
  - [ ] Add CORS middleware
- [ ] **Frontend Integration**
  - [ ] Create `src/services/api.js`
  - [ ] Wire `ParentPortal` voice button to backend
  - [ ] Display agent response in chat UI
- [ ] **Deployment**
  - [ ] Deploy backend to Railway/Render
  - [ ] Deploy frontend to Vercel
  - [ ] Test end-to-end on deployed URLs

## 🟠 P1 — Competitive Advantage

- [ ] **Memory (mem0)**
  - [ ] Install `mem0ai`
  - [ ] Initialize mem0 client in `agent/agent.py`
  - [ ] Replace `remember_fact` with `mem0.add()`
  - [ ] Replace `recall_memories` with `mem0.search()`
- [ ] **Opik Evaluation**
  - [ ] Add `response_empathy_score` metric
  - [ ] Add `tool_selection_accuracy` metric
  - [ ] Add `memory_retrieval_precision` metric
  - [ ] Run A/B experiment: 2 prompt versions

## 🟡 P2 — Stretch

- [ ] Voice input via Web Speech API
- [ ] Family alert webhooks (Slack/Discord)
- [ ] Opik dashboard screenshot for demo

## 🟢 P3 — Post-Hackathon

- [ ] Multi-user authentication
- [ ] Real-time WebSocket streaming
- [ ] Embodied avatar (Rive/Lottie)
