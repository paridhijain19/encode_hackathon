# Phase 2 — Architecture Decisions

> **Purpose**: Document key technology and design choices.

---

## Decision 1: Database

### Options Evaluated

| Option | Pros | Cons |
|--------|------|------|
| **Supabase** | Postgres, Auth, Realtime, Free tier | Learning curve |
| Firebase | Real-time, easy | NoSQL (not ideal for relational data) |
| PlanetScale | MySQL, serverless | No Auth built-in |
| Local SQLite | Simple | No multi-user, no cloud |

### Decision: **Supabase**

**Rationale:**
- Postgres = proper relational DB for expenses, activities, appointments
- Built-in Auth (magic links perfect for elderly)
- Realtime subscriptions for family portal
- Row Level Security for multi-user
- Free tier sufficient for hackathon/early users
- MCP server available if we want agent-direct-DB later

---

## Decision 2: Supabase MCP Server

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Use MCP Server** | Agent writes SQL directly, no custom endpoints | Complex setup, harder debugging, security concerns |
| **Standard SDK** | Simple, agent uses Python tools, clear separation | Need to update each tool manually |

### Decision: **Standard SDK (No MCP)**

**Rationale:**
- Keep agent's data access through tools (auditable)
- Easier to debug tool behavior
- No need to learn MCP protocol now
- Can add MCP later if needed

---

## Decision 3: Chat/Call SDK

### Options Evaluated

| Option | Text | Voice | Video | React | Free Tier | Notes |
|--------|------|-------|-------|-------|-----------|-------|
| **CometChat** | ✅ | ✅ | ✅ | ✅ | 25 MAU | Best overall |
| Dyte | ✅ | ✅ | ✅ | ✅ | 10k min | Simpler API |
| Zegocloud | ✅ | ✅ | ✅ | ✅ | Limited | 4K video |
| Twilio | ✅ | ✅ | ✅ | ✅ | Pay-as-go | More expensive |
| Agora | ⚠️ | ✅ | ✅ | Beta | Limited | Mobile focus |

### Decision: **CometChat**

**Rationale:**
- All-in-one (chat + voice + video)
- Good React SDK with UI components
- HIPAA/SOC2 compliant (important for elderly care)
- 25 MAU free tier covers hackathon
- Clear documentation

### Fallback: **Dyte**

If CometChat is too complex or pricing changes, Dyte is a simpler alternative.

---

## Decision 4: Email Service

### Options

| Option | Pros | Cons |
|--------|------|------|
| **Resend** | Simple API, developer-friendly | New service |
| SendGrid | Enterprise standard | Complex setup |
| Supabase Edge + SMTP | Built-in | Limited templates |
| AWS SES | Cheap at scale | Setup overhead |

### Decision: **Resend**

**Rationale:**
- Simple API for sending invite emails
- Good developer experience
- Free tier (100 emails/day) sufficient
- Can use with Supabase Edge Functions

---

## Decision 5: Proactive Agent Implementation

### Options

| Option | Pros | Cons |
|--------|------|------|
| **APScheduler** | Python-native, runs in FastAPI | Needs server always running |
| Supabase Cron | Serverless, database triggers | Less flexible |
| Celery + Redis | Production-grade | Overkill for MVP |
| External (cron.org) | No infrastructure | Third-party dependency |

### Decision: **APScheduler**

**Rationale:**
- Already in Python ecosystem
- Can run in same FastAPI process
- Simple for MVP
- Can migrate to Celery/Supabase later

---

## Decision 6: Notification Delivery

### Options

| Channel | Use Case | Implementation |
|---------|----------|----------------|
| **In-app** | All alerts | Toast/banner component |
| **Web Push** | Important alerts when app closed | Service worker + VAPID |
| **Email** | Critical alerts, invites | Resend |
| SMS | Critical alerts (optional) | Twilio (future) |

### Decision: **In-app + Web Push + Email**

**Rationale:**
- In-app: Primary for all notifications
- Web Push: For app-closed scenarios
- Email: Invite links + critical alerts
- Skip SMS for MVP (adds cost/complexity)

---

## Decision 7: Frontend State Management

### Options

| Option | Pros | Cons |
|--------|------|------|
| **React Context** | Already using, simple | Prop drilling possible |
| Redux | Powerful, DevTools | Boilerplate |
| Zustand | Lightweight | Another dependency |
| Jotai | Atomic state | Learning curve |

### Decision: **Keep React Context**

**Rationale:**
- Already have AgentContext working
- Add more contexts as needed (AuthContext, ChatContext)
- Avoid migration overhead
- Redux only if complexity demands it

---

## Decision 8: Hosting/Deployment

### Options

| Option | Frontend | Backend | Database | Notes |
|--------|----------|---------|----------|-------|
| **Vercel + Railway** | Vercel | Railway | Supabase | Best DX |
| Netlify + Fly.io | Netlify | Fly.io | Supabase | Good alternative |
| AWS (full) | S3/CF | Lambda/EC2 | RDS | Overkill |
| Self-hosted | VPS | VPS | VPS | Manual ops |

### Decision: **Vercel (frontend) + Railway (backend) + Supabase (DB)**

**Rationale:**
- Vercel: Best for React/Vite
- Railway: Easy Python deployment
- Supabase: Already chosen for DB
- All have free tiers
- Easy to scale up later

---

## Architecture Diagram (Post Phase 2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                         │
│  ┌─────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ Landing │  │ Onboarding  │  │   Parent    │  │    Family     │  │
│  │  Page   │  │   (new)     │  │   Portal    │  │   Dashboard   │  │
│  └─────────┘  └─────────────┘  └──────┬──────┘  └───────┬───────┘  │
│                                       │                  │          │
│  ┌────────────────────────────────────┴──────────────────┘          │
│  │                    CometChat SDK                                 │
│  │              (Text Chat + Voice + Video)                         │
│  └──────────────────────────────────────────────────────────────────│
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
                          HTTP + WebSocket
                                    │
┌───────────────────────────────────┴─────────────────────────────────┐
│                          BACKEND (Railway)                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    FastAPI + APScheduler                      │   │
│  │  - /auth/*     (Supabase Auth proxy)                          │   │
│  │  - /chat       (Agent interaction)                            │   │
│  │  - /api/state  (Data for pages)                               │   │
│  │  - Scheduler   (Proactive messages)                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Agent System (Gemini + ADK + Tools)              │   │
│  └──────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────┬─────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         │                          │                          │
   ┌─────▼─────┐              ┌─────▼─────┐              ┌─────▼─────┐
   │ Supabase  │              │   Mem0    │              │  Resend   │
   │ Postgres  │              │  Memory   │              │  Email    │
   │ + Auth    │              │  (cloud)  │              │           │
   │ + Realtime│              └───────────┘              └───────────┘
   └───────────┘
         │
    ┌────▼────┐
    │ CometChat│
    │  Backend │
    └──────────┘
```

---

## Open Questions

1. **CometChat pricing at scale** — What happens after 25 MAU? Evaluate cost.
2. **Web Push browser support** — Safari requires special handling. Test on elderly user devices.
3. **Appointment reminder timing** — How far in advance? User preference or default?
4. **Data retention policy** — How long to keep old moods/activities? Summarize or delete?

---

*Last Updated: January 31, 2025*
