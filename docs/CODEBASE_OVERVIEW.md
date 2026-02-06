# 📚 Amble Codebase Overview

**Complete guide to understanding the Amble codebase structure, data organization, and how to get started.**

---

## 🎯 Project Overview

**Amble** is an AI-powered companion for elderly individuals (50+) that helps with:
- Daily wellness tracking (mood, activities, expenses)
- Health reminders and appointment scheduling
- Family connection and smart alerts
- Activity discovery and social engagement
- Long-term memory of conversations and preferences

**Tech Stack:**
- **Frontend:** React 19 + Vite + React Router
- **Backend:** Python + FastAPI + Google ADK (Agent Development Kit)
- **AI:** Google Gemini 2.0/2.5 Flash models
- **Database:** Supabase (PostgreSQL) + Mem0 (semantic memory)
- **Observability:** Comet Opik (distributed tracing)

---

## 📁 Folder Structure & Data Organization

### **Root Directory**

```
hackathon/
├── agent/              # Backend Python code (AI agent, API server)
├── src/                # Frontend React application
├── database/           # SQL schema files
├── docs/               # Documentation
├── tests/              # Python test files
├── public/             # Static assets (icons, service worker)
├── node_modules/       # Frontend dependencies
├── venv/               # Python virtual environment
├── package.json        # Frontend dependencies & scripts
├── requirements.txt    # Python dependencies
├── vite.config.js      # Vite build configuration
└── .env                # Environment variables (not in git)
```

---

## 🔍 Detailed Folder Breakdown

### **1. `/agent/` - Backend Python Code**

**Purpose:** Contains all backend logic - the AI agent, API server, database operations, and business logic.

**Key Files:**

| File | Purpose | Data It Holds |
|------|---------|---------------|
| `server.py` | FastAPI server that exposes REST API endpoints | API routes, request/response handling |
| `agent.py` | Core agent definitions (root agent + sub-agents) | Agent orchestration, delegation logic |
| `tools.py` | All agent tools (functions the agent can call) | Business logic for tracking, scheduling, etc. |
| `prompts.py` | Agent instruction prompts | System prompts for each agent |
| `models.py` | Pydantic data models | Type definitions for API requests/responses |
| `db.py` | Database abstraction layer | Database connection logic |
| `supabase_store.py` | Supabase-specific database operations | CRUD operations for all data types |
| `auth.py` | Authentication logic | User authentication, session management |
| `communication.py` | Email/push notification sending | Communication service integration |
| `scheduler.py` | Background job scheduling | Scheduled tasks (reminders, alerts) |
| `activity_discovery.py` | Local event/activity search | Google Search integration for events |
| `opik_agent.py` | CLI runner for local testing | Command-line interface for testing |
| `opik_tracer.py` | Opik observability setup | Tracing configuration |
| `data.json` | Local JSON storage (dev mode) | Local data storage when not using Supabase |
| `profiles/default_persona.json` | Default user persona | Default user profile template |

**Data Flow:**
```
User Request → server.py → agent.py → tools.py → supabase_store.py → Supabase Database
```

**How to Modify:**
- **Add new agent capability:** Add tool function in `tools.py`, register in `agent.py`
- **Change agent behavior:** Modify prompts in `prompts.py`
- **Add API endpoint:** Add route in `server.py`
- **Change data structure:** Update `models.py` and `supabase_store.py`

---

### **2. `/src/` - Frontend React Application**

**Purpose:** User interface - all React components, pages, services, and hooks.

#### **`/src/pages/` - Main Application Pages**

| File | Route | Purpose | Data It Displays |
|------|-------|---------|------------------|
| `LandingPage.jsx` | `/` | Landing/marketing page | Static content |
| `Onboarding.jsx` | `/onboarding` | User onboarding flow | User profile data (name, location, age) |
| `Chat.jsx` | `/app` | Main chat interface | Chat messages, agent responses |
| `Messages.jsx` | `/app/messages` | Chat history viewer | Past conversations, searchable |
| `QuickAdd.jsx` | `/app/quick-add` | Quick expense/activity entry | Form inputs for quick tracking |
| `Settings.jsx` | `/app/settings` | User settings | Profile data, preferences |
| `FamilyDashboard.jsx` | `/family/*` | Family member dashboard | Elder's activity feed, alerts, insights |
| `ParentPortal.jsx` | `/parent/*` | Legacy parent portal (redirects) | - |

#### **`/src/components/` - Reusable UI Components**

| Component | Purpose | Used By |
|------------|---------|---------|
| `AgentChat.jsx` | Chat interface with message bubbles | Chat page |
| `VoiceButton.jsx` | Voice input button with mic icon | Chat, Onboarding |
| `VideoCall.jsx` | Video/audio call interface | Family Dashboard |
| `PhotoSharing.jsx` | Photo upload and sharing | Family features |
| `Calendar.jsx` | Calendar widget for appointments | Settings, Dashboard |
| `NotificationBanner.jsx` | Alert/notification display | All pages |
| `SignIn.jsx` | Authentication form | Landing |
| `SmartHome.jsx` | Smart home integration UI | Settings |
| `LoadingSpinner.jsx` | Loading indicator | Various pages |
| `Modal.jsx` | Modal dialog wrapper | Various pages |
| `Toast.jsx` | Toast notification | Various pages |
| `ErrorBoundary.jsx` | Error handling wrapper | App root |

#### **`/src/services/` - API & External Service Integration**

| File | Purpose | Data It Handles |
|------|---------|-----------------|
| `api.js` | Backend API client (HTTP requests) | All API calls to FastAPI server |
| `auth.js` | Authentication service | User sessions, tokens |
| `cometchat.js` | CometChat integration | Video/audio calls, chat |
| `googleCalendar.js` | Google Calendar integration | Calendar events |
| `realtime.js` | Real-time updates (Supabase) | Live data subscriptions |

#### **`/src/hooks/` - Custom React Hooks**

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAgent.js` | Agent chat interaction | `{ sendMessage, loading, error }` |
| `useAgentPolling.js` | Polling for agent responses | Polling state |
| `useNotifications.js` | Notification polling | Active notifications |
| `useVoiceInput.js` | Voice recognition | `{ startListening, stopListening, transcript }` |
| `useTextToSpeech.js` | Text-to-speech synthesis | `{ speak, isSpeaking }` |

#### **`/src/context/` - React Context Providers**

| File | Purpose | Provides |
|------|---------|----------|
| `AuthContext.jsx` | Authentication state | `{ user, login, logout, isAuthenticated }` |

#### **`/src/utils/` - Utility Functions**

| File | Purpose |
|------|---------|
| `haptics.js` | Haptic feedback (vibration) |
| `sounds.js` | Sound effects |

**Key Files:**
- `App.jsx` - Main app component with routing
- `main.jsx` - React app entry point
- `index.css` - Global styles and design system

**How to Modify:**
- **Add new page:** Create component in `/src/pages/`, add route in `App.jsx`
- **Add new component:** Create in `/src/components/`, export from `index.js`
- **Add API call:** Add function in `/src/services/api.js`
- **Add custom hook:** Create in `/src/hooks/`, export from `index.js`

---

### **3. `/database/` - Database Schema Files**

**Purpose:** SQL schema definitions for Supabase database.

| File | Purpose | Contains |
|------|---------|----------|
| `schema_final.sql` | **Main schema** (use this) | Complete table definitions with indexes |
| `schema.sql` | Legacy schema | Older version |
| `add_family_messages.sql` | Additional tables | Family messaging tables |

**Key Tables:**
- `sessions` - User session mappings
- `chat_history` - All conversation messages
- `user_profiles` - User preferences and data
- `expenses` - Expense tracking records
- `activities` - Activity logs
- `moods` - Mood tracking data
- `appointments` - Scheduled appointments
- `alerts` - Family alerts and notifications
- `family_invites` - Family member invitation tokens

**How to Modify:**
- **Add new table:** Add CREATE TABLE statement to `schema_final.sql`
- **Modify existing table:** Update schema, run migration in Supabase SQL Editor
- **Add indexes:** Add CREATE INDEX statements for performance

---

### **4. `/docs/` - Documentation**

**Purpose:** Project documentation, architecture guides, setup instructions.

| Folder/File | Purpose |
|-------------|---------|
| `PROJECT_OVERVIEW.md` | High-level project vision and design philosophy |
| `SETUP_GUIDE.md` | Step-by-step setup instructions for all services |
| `README.md` | Documentation index |
| `architecture/agent.md` | Detailed agent architecture documentation |
| `architecture/memory.md` | Mem0 memory system documentation |
| `phase2/` | Phase 2 planning documents |
| `phase3.5-*.md` | Phase 3.5 implementation details |
| `archive/` | Historical documents from hackathon phase |

---

### **5. `/tests/` - Test Files**

**Purpose:** Python test suite for backend functionality.

| File | Tests |
|------|-------|
| `test_api_chat.py` | Chat API endpoints |
| `test_api_core.py` | Core API functionality |
| `test_api_family.py` | Family features |
| `test_api_onboarding.py` | Onboarding flow |
| `test_communication.py` | Email/notification sending |
| `test_activity_discovery.py` | Activity search |
| `test_supabase_store.py` | Database operations |
| `test_e2e_flows.py` | End-to-end user flows |
| `test_frontend_features.py` | Frontend functionality |
| `conftest.py` | Pytest configuration |
| `run_tests.py` | Test runner script |

**How to Run:**
```bash
cd tests
python run_tests.py
```

---

### **6. `/public/` - Static Assets**

**Purpose:** Static files served directly (not processed by Vite).

| File/Folder | Purpose |
|-------------|---------|
| `sw.js` | Service worker for PWA (offline support) |
| `offline.html` | Offline fallback page |
| `manifest.json` | PWA manifest |
| `icons/` | App icons |
| `vite.svg` | Vite logo |

---

## 🔄 Data Flow Architecture

### **Request Flow (User → Backend → Database)**

```
1. User types message in Chat.jsx
   ↓
2. useAgent hook calls api.js → sendMessage()
   ↓
3. HTTP POST to http://localhost:8000/chat
   ↓
4. server.py receives request, calls agent.py
   ↓
5. agent.py (root_agent) processes message
   ↓
6. Agent calls tools from tools.py
   ↓
7. tools.py calls supabase_store.py
   ↓
8. supabase_store.py writes to Supabase database
   ↓
9. Response flows back: Supabase → tools → agent → server → api.js → React component
```

### **Memory System Flow**

```
1. After each conversation turn
   ↓
2. server.py calls Mem0 to store conversation
   ↓
3. Before next turn, Mem0 semantic search retrieves relevant memories
   ↓
4. Memories injected into agent context
   ↓
5. Agent responds with awareness of past conversations
```

---

## 🚀 Getting Started

### **1. Initial Setup**

```bash
# Clone repository (if not already done)
cd hackathon

# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r requirements.txt

# Create .env file in agent/ folder
cd agent
# Copy .env.example or create new .env with required keys
```

### **2. Required Environment Variables**

Create `agent/.env` file with:

```env
# Core AI
GOOGLE_API_KEY=your_google_api_key
GEMINI_API_KEY=your_google_api_key

# Database (choose one)
DB_BACKEND=supabase  # or "local" for development
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_key

# Optional services
MEM0_API_KEY=your_mem0_key  # For long-term memory
RESEND_API_KEY=re_xxx  # For emails
COMETCHAT_APP_ID=xxx  # For video calls
VAPID_PRIVATE_KEY=xxx  # For push notifications
```

### **3. Database Setup**

1. Create Supabase project at https://supabase.com
2. Run `database/schema_final.sql` in Supabase SQL Editor
3. Update `.env` with Supabase credentials

### **4. Start Development Servers**

**Terminal 1 - Backend:**
```bash
cd agent
python server.py
# Server runs on http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
# App runs on http://localhost:5173
```

### **5. Access the Application**

- **Landing Page:** http://localhost:5173/
- **Onboarding:** http://localhost:5173/onboarding
- **Main App:** http://localhost:5173/app
- **Family Dashboard:** http://localhost:5173/family

---

## 🛠️ Common Development Tasks

### **Adding a New Feature**

1. **Backend:**
   - Add tool function in `agent/tools.py`
   - Register tool in `agent/agent.py`
   - Add API endpoint in `agent/server.py` (if needed)
   - Update database schema in `database/schema_final.sql` (if needed)

2. **Frontend:**
   - Create page component in `src/pages/`
   - Add route in `src/App.jsx`
   - Add API call in `src/services/api.js`
   - Create UI components in `src/components/` (if reusable)

### **Modifying Agent Behavior**

1. Edit prompts in `agent/prompts.py`
2. Modify tool logic in `agent/tools.py`
3. Adjust agent orchestration in `agent/agent.py`

### **Changing Database Schema**

1. Update `database/schema_final.sql`
2. Run migration in Supabase SQL Editor
3. Update `agent/supabase_store.py` if table structure changed
4. Update `agent/models.py` if data models changed

### **Adding a New Page**

1. Create `src/pages/YourPage.jsx`
2. Create `src/pages/YourPage.css` (if needed)
3. Add route in `src/App.jsx`:
   ```jsx
   <Route path="/your-page" element={<YourPage />} />
   ```

### **Adding a New API Endpoint**

1. Add route in `agent/server.py`:
   ```python
   @app.post("/your-endpoint")
   async def your_endpoint(request: YourRequest):
       # Your logic
       return {"result": "success"}
   ```
2. Add request/response models in `agent/models.py`
3. Add API call function in `src/services/api.js`

---

## 📊 Key Data Structures

### **User Profile**
```json
{
  "user_id": "parent_user",
  "name": "John Doe",
  "location": "Mumbai",
  "age": 65,
  "interests": ["reading", "gardening"],
  "health_conditions": ["diabetes"],
  "emergency_contact_name": "Jane Doe",
  "emergency_contact_phone": "+1234567890"
}
```

### **Expense Record**
```json
{
  "user_id": "parent_user",
  "amount": 500.00,
  "category": "groceries",
  "description": "Weekly groceries",
  "date": "2026-02-06"
}
```

### **Activity Record**
```json
{
  "user_id": "parent_user",
  "activity_type": "walk",
  "description": "Morning walk in park",
  "duration_minutes": 30,
  "timestamp": "2026-02-06T08:00:00Z"
}
```

### **Mood Record**
```json
{
  "user_id": "parent_user",
  "rating": "happy",
  "notes": "Feeling good today",
  "timestamp": "2026-02-06T10:00:00Z"
}
```

---

## 🔍 Important Files to Understand

### **Backend Entry Points**
- `agent/server.py` - Start here to understand API structure
- `agent/agent.py` - Core agent logic and orchestration
- `agent/tools.py` - All business logic functions

### **Frontend Entry Points**
- `src/App.jsx` - Routing and app structure
- `src/main.jsx` - React app initialization
- `src/pages/Chat.jsx` - Main user interface

### **Configuration**
- `package.json` - Frontend dependencies and scripts
- `requirements.txt` - Python dependencies
- `vite.config.js` - Build configuration
- `agent/.env` - Environment variables (create this)

---

## 🧪 Testing

### **Run All Tests**
```bash
cd tests
python run_tests.py
```

### **Run Specific Test File**
```bash
pytest tests/test_api_chat.py -v
```

### **Frontend Testing**
Currently no automated frontend tests. Manual testing via browser.

---

## 📝 Code Style & Conventions

### **Python (Backend)**
- Use type hints
- Follow PEP 8
- Use async/await for I/O operations
- Document functions with docstrings

### **JavaScript/React (Frontend)**
- Use functional components with hooks
- Use ES6+ syntax
- Follow React best practices
- Use CSS modules or component-scoped CSS

---

## 🐛 Debugging Tips

### **Backend Issues**
1. Check `agent/.env` file exists and has correct values
2. Check Supabase connection in `agent/supabase_store.py`
3. Check server logs in terminal
4. Use Opik dashboard for agent tracing

### **Frontend Issues**
1. Check browser console for errors
2. Check Network tab for API call failures
3. Verify `src/services/api.js` has correct API_BASE URL
4. Check React DevTools for component state

### **Database Issues**
1. Verify Supabase credentials in `.env`
2. Check table exists in Supabase dashboard
3. Run `schema_final.sql` if tables missing
4. Check Supabase logs for query errors

---

## 🎓 Learning Path

**To understand the codebase:**

1. **Start with:** `docs/PROJECT_OVERVIEW.md` - Understand the vision
2. **Then read:** `docs/SETUP_GUIDE.md` - Understand setup
3. **Explore:** `agent/server.py` - See API structure
4. **Study:** `agent/agent.py` - Understand agent logic
5. **Review:** `src/App.jsx` - See frontend structure
6. **Examine:** `src/pages/Chat.jsx` - See main UI
7. **Deep dive:** `docs/architecture/agent.md` - Technical details

---

## 📚 Additional Resources

- **Project Overview:** `docs/PROJECT_OVERVIEW.md`
- **Setup Guide:** `docs/SETUP_GUIDE.md`
- **Agent Architecture:** `docs/architecture/agent.md`
- **Memory System:** `docs/architecture/memory.md`
- **Phase 3.5 Details:** `docs/phase3.5-walkthrough.md`

---

## ❓ Quick Reference

| What | Where |
|------|-------|
| API endpoints | `agent/server.py` |
| Agent logic | `agent/agent.py` |
| Business logic | `agent/tools.py` |
| Database operations | `agent/supabase_store.py` |
| Frontend routes | `src/App.jsx` |
| API client | `src/services/api.js` |
| Database schema | `database/schema_final.sql` |
| Environment vars | `agent/.env` (create this) |

---

**Last Updated:** February 2026  
**Maintainer:** Amble Development Team
