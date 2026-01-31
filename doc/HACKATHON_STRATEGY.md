# Encode Hackathon Strategy — Amble

**Document Purpose:** Actionable roadmap to win the Encode Hackathon.
**Last Updated:** January 31, 2026

---

## 1. Current State Assessment

### ✅ What Is Solid

| Area | Status |
|------|--------|
| **Agent Architecture** | Multi-agent delegation with specialized sub-agents (mood, activity, expense, wellness). Clean separation of concerns. |
| **Tool Layer** | 15+ functional tools for tracking, memory, alerts. All tools work locally. |
| **Opik Integration** | Tracing callbacks on all agents. Project `amble-companion` configured. |
| **Prompts** | Well-crafted, elderly-friendly tone. Voice-first design philosophy baked in. |
| **Product Vision** | Clear, well-documented in `doc/PROJECT_OVERVIEW.md`. Judges can understand quickly. |
| **Local Runner** | `opik_agent.py` works for CLI testing. |

### ⚠️ What Is Missing But Critical

| Gap | Impact |
|-----|--------|
| **No Backend API** | Frontend cannot talk to the agent. Demo is impossible. |
| **No Production Memory** | `data.json` is file-based, not persistent across deploys. `remember_fact`/`recall_memories` are basic. |
| **No Frontend-Agent Bridge** | UI is a shell with mock data. No real interaction. |
| **No Opik Experiments** | Traces exist, but no **evaluation runs** or **metrics dashboards** to show judges. |
| **No Deployment Pipeline** | Cannot demo reliably without a hosted backend. |

### 🟡 Optional / Stretch Goals

- Voice-to-text integration (Web Speech API)
- Real-time WebSocket streaming
- Family dashboard with live alerts
- Multi-user authentication

---

## 2. Execution Plan

### Phase 1 — Hackathon-Ready MVP (Do This First)

**Goal:** A working demo where a user can chat with Amble through the UI, and judges can see Opik observability.

| Step | Task | Time Est. |
|------|------|-----------|
| 1.1 | Create `agent/server.py` with FastAPI | 1 hr |
| 1.2 | Expose `/chat` endpoint that invokes `root_agent` | 1 hr |
| 1.3 | Add CORS for frontend | 15 min |
| 1.4 | Create `src/services/api.js` for fetch calls | 30 min |
| 1.5 | Wire `ParentPortal` voice button to send text to backend | 1 hr |
| 1.6 | Display agent response in a chat bubble | 1 hr |
| 1.7 | Deploy backend to Railway / Render (free tier) | 1 hr |
| 1.8 | Deploy frontend to Vercel | 30 min |
| 1.9 | Add 3-5 Opik evaluation metrics (see Section 5) | 2 hr |
| 1.10 | Record demo video showing end-to-end flow | 1 hr |

**Total:** ~10 hours of focused work.

---

### Phase 2 — Competitive Advantage

**Goal:** Stand out from other submissions with richer memory and visible evaluation.

| Step | Task | Why It Matters |
|------|------|----------------|
| 2.1 | Integrate `mem0` for semantic memory | Shows advanced memory architecture |
| 2.2 | Store user facts, retrieve with similarity search | Judges love "it remembers me" moments |
| 2.3 | Add Opik LLM-as-judge evaluations | Aligns with "Best Use of Opik" criteria |
| 2.4 | Create Opik experiment comparing prompt versions | Shows "evaluation-driven development" |
| 2.5 | Add family alert webhooks (Slack/Discord) | Real-world relevance |
| 2.6 | Voice input via Web Speech API | Agent-first interface becomes real |

---

### Phase 3 — Post-Hackathon / Stretch

- Multi-user auth with session isolation
- Video calling integration
- Embodied avatar (Rive/Lottie animations)
- Longitudinal behavioral analysis

---

## 3. Memory Strategy

### Recommendation: Use `mem0`

| Criteria | mem0 | Supermemory |
|----------|------|-------------|
| **Ease of Integration** | ✅ Simple Python SDK | More complex setup |
| **Semantic Search** | ✅ Built-in | Requires config |
| **Cloud-hosted** | ✅ Yes (managed service) | Self-hosted |
| **Cost** | Free tier available | OpenSource but needs infra |
| **Opik Compatibility** | ✅ Works well | Untested |

**Verdict:** Use `mem0` for hackathon. Faster to integrate, cloud-hosted, and works out of the box.

### Memory Structure

```
┌─────────────────────────────────────────────────────────┐
│                      Memory Layers                      │
├─────────────────────────────────────────────────────────┤
│ SHORT-TERM (Session)                                    │
│   - Current conversation context                       │
│   - Today's mood, activities                           │
│   - Stored in ADK session state                        │
├─────────────────────────────────────────────────────────┤
│ LONG-TERM (mem0)                                        │
│   - User profile facts ("I was a teacher")             │
│   - Family names, birthdays                            │
│   - Important preferences                              │
│   - Stored via mem0.add(), retrieved via mem0.search() │
├─────────────────────────────────────────────────────────┤
│ BEHAVIORAL PATTERNS (data.json / future DB)            │
│   - Mood trends over weeks                             │
│   - Activity frequency                                 │
│   - Alert history                                      │
│   - Used by analyze_wellness_patterns()                │
└─────────────────────────────────────────────────────────┘
```

### What to Store vs. Not Store

| Store | Do Not Store |
|-------|--------------|
| User-shared facts ("My daughter's name is Priya") | Raw conversation logs |
| Preferences ("I like walking in the morning") | Momentary emotions without context |
| Important dates (birthdays, anniversaries) | Debugging data |
| Health context (non-diagnostic) | Sensitive medical details |

### Evaluating Memory with Opik

- **Retrieval Accuracy:** Does `mem0.search()` return relevant facts?
- **Memory Utilization:** Is the agent using memories in responses?
- **Consistency:** Does the agent contradict previously stored facts?

Add Opik traces on `remember_fact` and `recall_memories` to track these.

---

## 4. Agent-First Interface Philosophy

### Core Principle

> The agent is the interface. UI is a window into the agent, not a controller of it.

### Design Implications

| Traditional App | Amble's Approach |
|-----------------|------------------|
| User navigates menus | Agent guides the flow |
| Forms for data entry | Conversation captures data |
| Dashboards for status | Agent summarizes verbally |
| Notifications demand action | Agent offers gentle suggestions |

### Implementation Guidelines

1. **Single Input Field:** Text or voice. No multi-step forms.
2. **Agent Speaks First:** On load, agent greets and sets context.
3. **Visuals Support, Not Lead:** Show a mood chart only when agent says "Here's your week."
4. **No Configuration Screens:** Agent asks preferences in conversation.
5. **Calm Aesthetics:** Muted colors, large fonts, no blinking elements.

### For the Demo

- Show a user saying "I went for a walk today."
- Agent responds warmly, logs the activity, and maybe suggests a follow-up.
- No buttons clicked. No forms filled. Pure conversation.

---

## 5. How to Win the Encode Hackathon

### Best Use of Opik — What Judges Want

| Criteria | What to Show |
|----------|--------------|
| **Functionality** | Traces visible in Opik dashboard. Every tool call logged. |
| **Evaluation** | At least 3 metrics: response quality, tool selection accuracy, memory retrieval relevance. |
| **Experiments** | Run 2 prompt versions, compare in Opik. Show which performs better. |
| **Data-Driven Insights** | "We noticed the agent over-alerted, so we tuned thresholds based on Opik data." |

### Specific Opik Actions

1. **Add LLM-as-Judge Evaluator**
   - After each response, a second LLM grades: "Was this empathetic? Was it helpful?"
   - Log scores to Opik.

2. **Track These Metrics**
   - `response_empathy_score` (1-5)
   - `tool_selection_accuracy` (did the agent use the right tool?)
   - `memory_retrieval_precision` (did it recall the right facts?)

3. **Run an A/B Experiment**
   - Prompt A: Current ROOT_AGENT_INSTRUCTION
   - Prompt B: Slightly more concise version
   - Run 20 test conversations, compare scores in Opik

4. **Dashboard Screenshot for Demo**
   - Show traces grouped by session
   - Show metric trends over time
   - Highlight one "before/after" improvement

---

### Category Strategy

**Best Fit:** Health, Fitness & Wellness

**Why Amble Wins:**

| Judging Criteria | Amble's Strength |
|------------------|------------------|
| Functionality | Multi-agent system that actually works |
| Real-world relevance | Aging population is a global concern |
| Use of LLMs/Agents | Deep agentic architecture, not just a wrapper |
| Evaluation | Opik integration is first-class |
| Goal Alignment | Explicitly designed for elderly wellness |
| Safety | Non-medical positioning, dignity-preserving design |

**Secondary Fit:** Social & Community Impact
- Amble connects elderly to family
- Detects isolation patterns
- Facilitates community event discovery

### Demo Story Arc

1. **Problem:** "Elderly living alone. Families can't always be there."
2. **Solution:** "Meet Amble. A gentle, intelligent companion."
3. **Demo:**
   - User says "I'm feeling a bit tired today."
   - Amble responds empathetically, tracks mood, notices a pattern.
   - Show Opik trace of the interaction.
4. **Differentiator:** "Not a reminder app. An agent that understands and adapts."
5. **Opik Value:** "We use Opik to measure empathy, tune prompts, and improve continuously."

---

## 6. Deployment Advice

### Minimum Viable Deployment

| Component | Stack | Why |
|-----------|-------|-----|
| **Backend** | FastAPI on Railway/Render | Free tier, easy deploy, Python-native |
| **Frontend** | Vercel | Zero-config for Vite/React |
| **Memory** | mem0 cloud | No self-hosting needed |
| **Database** | None (use mem0 + in-memory for MVP) | Avoid complexity |

### What NOT to Overbuild

- ❌ Multi-user auth (demo as single user)
- ❌ CI/CD pipelines (manual deploy is fine)
- ❌ Custom database (mem0 handles it)
- ❌ Real-time WebSocket (SSE or polling is enough)
- ❌ Mobile app (responsive web is sufficient)

### Safe Demo Checklist

- [ ] Backend deployed and reachable
- [ ] Frontend deployed and connected
- [ ] CORS configured correctly
- [ ] Opik API key in environment
- [ ] mem0 API key in environment
- [ ] Test conversation works end-to-end
- [ ] Demo script rehearsed
- [ ] Backup: local recording if live demo fails

---

## Summary: Priority Actions

| Priority | Action | Time |
|----------|--------|------|
| 🔴 P0 | Create FastAPI backend | 2 hr |
| 🔴 P0 | Connect frontend to backend | 2 hr |
| 🔴 P0 | Deploy both | 2 hr |
| 🟠 P1 | Add mem0 integration | 2 hr |
| 🟠 P1 | Add 3 Opik metrics | 2 hr |
| 🟡 P2 | Run Opik experiment | 1 hr |
| 🟡 P2 | Voice input (Web Speech API) | 2 hr |
| 🟢 P3 | Family alert webhooks | 2 hr |

**Total Critical Path:** ~6 hours to a working demo.
**Total to be Competitive:** ~12 hours with Opik evaluation.

---

**Go build. Go win.** 🏆
