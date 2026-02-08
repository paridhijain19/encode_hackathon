# 📋 Deployment Summary for Amble Project

## Project Overview

**Type:** Fullstack Web Application (Monolithic)  
**Purpose:** Elder care and family connection platform with AI agent

---

## Architecture

```
Frontend (Client-Side)          Backend (Server-Side)           External Services
┌─────────────────┐             ┌──────────────────┐           ┌─────────────────┐
│  React 19       │             │  Python 3.11     │           │  Supabase       │
│  Vite 7         │────────────▶│  FastAPI         │──────────▶│  (Database)     │
│  React Router   │   API calls │  Uvicorn         │           │                 │
│  Lucide Icons   │             │  Google ADK      │           │  Google AI      │
│                 │             │  Mem0 Memory     │           │  (Gemini)       │
│  Port: 5173     │             │  APScheduler     │           │                 │
│  (dev)          │             │  Port: 8000      │           │  Mem0           │
│                 │             │  (dev)           │           │  ElevenLabs     │
│  Dist folder    │             │                  │           │  Anam AI        │
│  after build    │             │                  │           │  Resend         │
└─────────────────┘             └──────────────────┘           └─────────────────┘
```

---

## Key Technical Details

### Frontend
- **Framework:** React 19 with Vite
- **Build Output:** Static files in `dist/` folder
- **Environment Variables:** Must be prefixed with `VITE_` (e.g., `VITE_API_URL`)
- **Build Command:** `npm install && npm run build`
- **Runtime:** Static hosting (Vercel, Render Static Site, Netlify, etc.)

### Backend
- **Framework:** FastAPI (Python async web framework)
- **Server:** Uvicorn (ASGI server)
- **Requirements:** Long-running process (NOT serverless)
- **Dependencies:** 13+ Python packages (see requirements.txt)
- **Start Command:** `uvicorn agent.server:app --host 0.0.0.0 --port $PORT`
- **Runtime Needs:** 
  - Python 3.10+ 
  - Persistent process (APScheduler for cron jobs)
  - WebSocket support
  - Environment variables (~20 keys)

### Database
- **Type:** PostgreSQL (via Supabase)
- **Hosting:** Already hosted externally
- **Connection:** Backend connects via `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- **No migration needed** - just environment variables

---

## Why Vercel Alone Won't Work

❌ **Vercel limitations for this project:**
1. **Serverless Functions Only:** Vercel runs code as serverless functions (max 60s execution)
2. **No Long-Running Processes:** Your backend uses APScheduler (cron-like scheduler)
3. **No WebSocket Persistence:** Conversational agent needs persistent connections
4. **Python Support Limited:** Vercel Python is for simple APIs, not complex ML/AI apps
5. **Google ADK Won't Work:** Requires persistent runner process

✅ **Vercel CAN host:** Just the frontend (static React build)

---

## Recommended Deployment Strategy

### 🥇 **Best Option: Render (2 Services)**

**Why Render?**
- Free tier for both frontend and backend
- Native Python support (not serverless)
- Automatic HTTPS + Custom domains
- Auto-deploys from GitHub
- Simple environment variable management

**Setup:**
1. **Backend Service:** Web Service (Python)
   - Runtime: Python 3.11
   - Command: `uvicorn agent.server:app --host 0.0.0.0 --port $PORT`
   - 20+ environment variables
   - Free tier: 512MB RAM, always-on

2. **Frontend Service:** Static Site
   - Build: `npm install && npm run build`
   - Output: `dist/`
   - 3 environment variables (`VITE_API_URL`, etc.)
   - Free tier: unlimited bandwidth

**Time to deploy:** ~30 minutes  
**Cost:** FREE (both services)  
**Difficulty:** ⭐⭐ Easy

---

### 🥈 **Alternative: Railway**

**Better than Render for:**
- Faster deployments
- Better logging/monitoring
- Nicer developer experience

**Worse than Render for:**
- No free tier (only $5 trial credit)
- Costs ~$10/month after trial

**Setup:** Similar to Render (2 services)

---

### 🥉 **Alternative: Vercel + Render**

**Frontend on Vercel, Backend on Render**

**Why:**
- Best frontend performance (Vercel's CDN)
- Separate concerns

**Setup:**
1. Deploy backend to Render (free)
2. Deploy frontend to Vercel (free)
3. Connect via `VITE_API_URL` environment variable

---

### 🔧 **Advanced: Docker Deployment**

**Platforms:** Fly.io, Google Cloud Run, AWS ECS

**Why:**
- Full control over environment
- Can combine frontend + backend in one container
- Global CDN (Fly.io)
- Serverless containers (Cloud Run)

**Requires:**
- Docker knowledge
- Infrastructure setup
- More complex CI/CD

---

## Environment Variables Needed

### Backend (20+ variables)
```bash
# AI & ML
GOOGLE_API_KEY
GEMINI_API_KEY
MEM0_API_KEY
ELEVENLABS_API_KEY

# Database
SUPABASE_URL
SUPABASE_ANON_KEY
DB_BACKEND=supabase
AUTH_BACKEND=supabase

# Communication
RESEND_API_KEY
EMAIL_FROM
COMETCHAT_APP_ID
COMETCHAT_AUTH_KEY
COMETCHAT_REGION

# Push Notifications
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
VAPID_CONTACT_EMAIL

# Other
ENV=production
PYTHON_VERSION=3.11
```

### Frontend (3 variables)
```bash
VITE_API_URL=https://your-backend.onrender.com
VITE_ELEVENLABS_AGENT_ID=your_id
VITE_ANAM_API_KEY=your_key
```

**CRITICAL:** Frontend variables MUST be set at BUILD time (before `npm run build`)

---

## Pre-Deployment Checklist

- [ ] Code pushed to GitHub (public or private repo)
- [ ] `.env` file created with all real values (locally, not in git)
- [ ] Supabase project active and tested
- [ ] All API keys obtained and tested locally
- [ ] App tested locally:
  - [ ] Frontend on localhost:5173 works
  - [ ] Backend on localhost:8000 works
  - [ ] Chat feature works
  - [ ] Database connection works
- [ ] `.gitignore` includes `.env` (already done)
- [ ] Deployment platform account created (Render/Railway/etc.)

---

## Code Changes Already Made

✅ **Updated for deployment:**
1. [`src/services/api.js`](src/services/api.js#L8) - Now uses `VITE_API_URL` env var
2. [`src/pages/Settings.jsx`](src/pages/Settings.jsx#L22) - Now uses `VITE_API_URL` env var

⚠️ **Still need to do manually:**
1. Update CORS in `agent/server.py` after getting frontend URL
2. Set environment variables in deployment platform
3. Test production deployment

---

## Quick Deploy Instructions (Render)

1. **Sign up:** https://dashboard.render.com/register
2. **Backend:**
   - New → Web Service → Connect GitHub → Select repo
   - Name: `amble-backend`
   - Runtime: Python 3
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn agent.server:app --host 0.0.0.0 --port $PORT`
   - Add 20+ environment variables
   - Click Create

3. **Frontend:**
   - New → Static Site → Connect GitHub → Select repo
   - Name: `amble-frontend`
   - Build: `npm install && npm run build`
   - Publish: `dist`
   - Add 3 environment variables (including backend URL from step 2)
   - Click Create

4. **Update CORS:** Add frontend URL to `agent/server.py` CORS settings

**Done! 🎉**

---

## What to Tell Your Deployment Helper

> "I have a fullstack web app with React frontend and Python FastAPI backend in the same repository (monolithic structure). The backend is NOT serverless - it uses Google's Gemini AI with long-running processes and scheduled tasks (APScheduler). Database is already hosted on Supabase. I need to deploy both frontend and backend, preferably on free tier. I have ~20 environment variables for backend and 3 for frontend. Which platform should I use and how do I connect them?"

**Ask them:**
1. "Should I use Render (2 free services) or Railway (paid)?"
2. "How do I set environment variables that contain special characters?"
3. "How do I connect frontend to backend URL after deployment?"
4. "Can I set up auto-deploy from GitHub main branch?"

---

## Support Files Created

| File | Purpose |
|------|---------|
| `DEPLOYMENT_GUIDE.md` | **Detailed guide** with all options explained |
| `DEPLOYMENT_CHECKLIST.md` | **Step-by-step** instructions for each platform |
| `DEPLOYMENT_SUMMARY.md` | **This file** - Quick reference for asking help |
| `.env.production.template` | Template for production environment variables |
| `vercel.json` | Configuration for Vercel (frontend only) |
| `Dockerfile` | For Docker-based deployments |
| `fly.toml` | For Fly.io deployment |
| `railway.md` | Reference for Railway setup |

---

## Costs Comparison

| Platform | Free Tier | Monthly Cost | Best For |
|----------|-----------|--------------|----------|
| **Render** | ✅ Yes (both) | $0-14 | First deployment |
| **Railway** | ❌ No ($5 credit) | $10-20 | Better UX |
| **Vercel + Render** | ✅ Yes | $0-7 | Best frontend perf |
| **Fly.io** | ✅ Yes | $0-15 | Global CDN |

---

## Next Steps

1. Read `DEPLOYMENT_CHECKLIST.md` for step-by-step instructions
2. Choose a platform (recommend Render for first time)
3. Gather all environment variable values
4. Follow checklist for your chosen platform
5. Update CORS after deployment
6. Test your deployed app

---

**Good luck! 🚀**

If you get stuck, share this summary with your helper - it has all the technical details they need to guide you.
