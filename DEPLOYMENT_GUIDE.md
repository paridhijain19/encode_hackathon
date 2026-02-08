# 🚀 Amble Deployment Guide

## Project Architecture Overview

Your project has a **fullstack monolithic architecture**:

```
encode_hackathon/
├── src/                    # React Frontend (Vite)
├── agent/                  # Python Backend (FastAPI + Uvicorn)
│   └── server.py          # Main API server
├── package.json           # Frontend dependencies
├── requirements.txt       # Backend dependencies
└── vite.config.js        # Frontend build config
```

### Technology Stack
- **Frontend**: React 19 + Vite 7 + React Router
- **Backend**: Python FastAPI + Uvicorn + Google ADK + Mem0
- **Database**: Supabase (PostgreSQL)
- **External Services**: ElevenLabs, Anam AI, Resend, CometChat, Opik

### Current Setup (Development)
- Frontend runs on `http://localhost:5173` (Vite dev server)
- Backend runs on `http://localhost:8000` (Uvicorn)
- Frontend calls backend via hardcoded URL: `http://localhost:8000`

---

## 🎯 Deployment Options

### Option 1: **Render** (Recommended - Easiest for Fullstack)

**Why Render?**
- ✅ Native support for both Python backends and static sites
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ Built-in environment variables management
- ✅ Can deploy both frontend and backend from same repo

**Setup Requirements:**

1. **Create Two Services:**
   ```
   Service 1: Web Service (Backend)
   - Name: amble-backend
   - Runtime: Python 3
   - Build Command: pip install -r requirements.txt
   - Start Command: uvicorn agent.server:app --host 0.0.0.0 --port $PORT
   - Plan: Free (512MB RAM)
   
   Service 2: Static Site (Frontend)
   - Name: amble-frontend
   - Build Command: npm install && npm run build
   - Publish Directory: dist
   - Plan: Free
   ```

2. **Environment Variables for Backend:**
   ```bash
   GOOGLE_API_KEY=xxx
   GEMINI_API_KEY=xxx
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=xxx
   RESEND_API_KEY=xxx
   EMAIL_FROM=Amble <onboarding@yourdomain.com>
   VAPID_PRIVATE_KEY=xxx
   VAPID_PUBLIC_KEY=xxx
   VAPID_CONTACT_EMAIL=xxx
   COMETCHAT_APP_ID=xxx
   COMETCHAT_AUTH_KEY=xxx
   COMETCHAT_REGION=us
   MEM0_API_KEY=xxx
   VITE_ELEVENLABS_AGENT_ID=xxx
   ELEVENLABS_API_KEY=xxx
   VITE_ANAM_API_KEY=xxx
   ENV=production
   DB_BACKEND=supabase
   AUTH_BACKEND=supabase
   PYTHON_VERSION=3.11
   ```

3. **Environment Variables for Frontend:**
   ```bash
   VITE_API_URL=https://amble-backend.onrender.com
   VITE_ELEVENLABS_AGENT_ID=xxx
   VITE_ANAM_API_KEY=xxx
   ```

4. **Code Changes Needed:**
   - Update `src/services/api.js` to use environment variable
   - Update `src/pages/Settings.jsx` to use environment variable

**Estimated Cost:** FREE for both services

---

### Option 2: **Railway** (Great Developer Experience)

**Why Railway?**
- ✅ Excellent for monorepo/fullstack apps
- ✅ Simple deployment from GitHub
- ✅ Good free trial ($5 credit)
- ✅ Automatic HTTPS
- ✅ Great logging and monitoring

**Setup Requirements:**

1. **Create New Project from GitHub repo**

2. **Add Two Services:**
   ```
   Service 1: Backend
   - Root Directory: /
   - Build Command: pip install -r requirements.txt
   - Start Command: uvicorn agent.server:app --host 0.0.0.0 --port $PORT
   
   Service 2: Frontend
   - Root Directory: /
   - Build Command: npm install && npm run build && npm install -g serve
   - Start Command: serve -s dist -l $PORT
   ```

3. **Environment Variables:** Same as Render option

**Estimated Cost:** ~$5-10/month after free trial

---

### Option 3: **Vercel + Separate Backend** (Your Question)

**Why Vercel is Difficult for Your Setup:**
- ❌ Vercel is optimized for **serverless functions**, not long-running Python processes
- ❌ Your FastAPI backend uses Google ADK, Mem0, APScheduler - not suitable for serverless
- ❌ Would require major architectural changes to backend
- ✅ BUT: Frontend deployment on Vercel is excellent

**Two-Platform Approach:**

1. **Frontend on Vercel:**
   ```bash
   # vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite"
   }
   ```
   
   **Environment Variables:**
   ```
   VITE_API_URL=https://your-backend-url.com
   VITE_ELEVENLABS_AGENT_ID=xxx
   VITE_ANAM_API_KEY=xxx
   ```

2. **Backend on Render/Railway/Fly.io:**
   - Deploy Python backend separately
   - Get the backend URL and add to Vercel env vars

**Estimated Cost:** FREE (Vercel) + FREE/Paid (Backend host)

---

### Option 4: **Fly.io** (Best for Global Performance)

**Why Fly.io?**
- ✅ Deploy containerized apps globally
- ✅ Great free tier (3 shared-cpu VMs)
- ✅ Low latency with edge deployment
- ✅ Full control over environment

**Setup Requirements:**

1. **Create Dockerfile** (see below)
2. **Create fly.toml** (see below)
3. **Deploy:** `fly deploy`

**Estimated Cost:** FREE for small apps

---

### Option 5: **Google Cloud Run** (Serverless Containers)

**Why Google Cloud Run?**
- ✅ Since you're using Google ADK/Gemini already
- ✅ Pay-per-use pricing
- ✅ Auto-scaling
- ✅ Free tier: 2M requests/month

**Setup:** Requires Docker containerization

**Estimated Cost:** FREE tier available, then pay-per-use

---

## 📝 Required Code Changes (ALL OPTIONS)

### 1. Make API URL Configurable

**File: `src/services/api.js`**

Find line 8:
```javascript
const API_BASE = 'http://localhost:8000'
```

Replace with:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

**File: `src/pages/Settings.jsx`**

Find line 22:
```javascript
const API_BASE = 'http://localhost:8000'
```

Replace with:
```javascript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

### 2. Update CORS Settings (Backend)

**File: `agent/server.py`**

Add production frontend URL to CORS origins (search for `CORSMiddleware`):
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-frontend-url.vercel.app",  # Add your production URL
        "https://your-frontend-url.onrender.com"  # Or Render URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 3. Create Environment Files

**File: `.env.production` (Backend)**
```bash
# Copy from .env.example and fill in production values
ENV=production
DB_BACKEND=supabase
AUTH_BACKEND=supabase
# ... rest of your env vars
```

### 4. Update Vite Config (Optional - for environment variables)

**File: `vite.config.js`**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
  }
})
```

---

## 🐳 Docker Configuration (For Fly.io/Cloud Run)

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install Node.js for building frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy all project files
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies and build frontend
RUN npm install && npm run build

# Expose port
ENV PORT=8080
EXPOSE 8080

# Start backend server and serve frontend static files
CMD ["uvicorn", "agent.server:app", "--host", "0.0.0.0", "--port", "8080"]
```

**Note:** This Dockerfile assumes you'll modify `server.py` to also serve static files from `dist/`

### fly.toml (For Fly.io)
```toml
app = "amble-app"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

---

## 📊 Deployment Comparison

| Platform | Difficulty | Cost (Est.) | Build Time | Best For |
|----------|-----------|-------------|------------|----------|
| **Render** | ⭐⭐ Easy | FREE - $7/mo | ~5 mins | First deployment |
| **Railway** | ⭐⭐ Easy | $5-10/mo | ~3 mins | Developer experience |
| **Vercel + Backend** | ⭐⭐⭐ Medium | FREE + Backend | ~5 mins | Best frontend performance |
| **Fly.io** | ⭐⭐⭐⭐ Advanced | FREE tier | ~10 mins | Global performance |
| **Google Cloud Run** | ⭐⭐⭐⭐ Advanced | Pay-per-use | ~10 mins | Google ecosystem |

---

## 🎬 Recommended Quick Start: Render

1. **Push code to GitHub** (if not already)

2. **Go to Render Dashboard** (https://dashboard.render.com)

3. **Create Backend Service:**
   - Click "New +" → "Web Service"
   - Connect GitHub repo
   - Name: `amble-backend`
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn agent.server:app --host 0.0.0.0 --port $PORT`
   - Add all environment variables from `.env.example`
   - Click "Create Web Service"

4. **Create Frontend Service:**
   - Click "New +" → "Static Site"
   - Connect same GitHub repo
   - Name: `amble-frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add environment variable: `VITE_API_URL` = (your backend URL from step 3)
   - Click "Create Static Site"

5. **Test Your Deployment:**
   - Visit your frontend URL
   - Check browser console for any errors
   - Test chat functionality

---

## 🔧 Troubleshooting

### Backend won't start
- Check Python version (must be 3.10+)
- Verify all required environment variables are set
- Check logs for missing dependencies

### Frontend can't reach backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in `agent/server.py`
- Ensure backend is running and healthy

### Database connection fails
- Verify Supabase URL and keys are correct
- Check if Supabase project is active
- Test connection from backend logs

### Build fails
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Python cache: `find . -type d -name __pycache__ -exec rm -r {} +`
- Check for syntax errors in recent changes

---

## 📞 What to Ask Your Deployment Helper

When asking someone for deployment help, provide:

1. **Project specs:**
   - "Fullstack app: React Vite frontend + Python FastAPI backend"
   - "Backend uses Google Gemini AI, Mem0, APScheduler (long-running processes)"
   - "External database: Supabase (already hosted)"
   - "Monolithic repo structure with both frontend and backend code"

2. **Current state:**
   - "Development: Frontend on localhost:5173, Backend on localhost:8000"
   - "Frontend makes API calls to backend via hardcoded localhost URL"
   - "Total environment variables: ~20 (AI keys, database, email, etc.)"

3. **Requirements:**
   - "Need: Both services deployed and connected"
   - "Backend needs: Persistent runtime (not serverless), Python 3.11+"
   - "Frontend needs: Static site hosting with environment variables"
   - "Budget: Looking for free tier or <$10/month"

4. **Questions to ask:**
   - "Which platform handles fullstack Python + React best?"
   - "Should I deploy as one container or separate services?"
   - "How do I manage 20+ environment variables securely?"
   - "What's the easiest way to connect frontend to backend URL?"
   - "Do I need CI/CD or can I deploy manually first?"

---

## 🎯 My Recommendation

**For your first deployment, use Render:**

1. **Pros:**
   - Easiest setup for your architecture
   - Free tier for both frontend and backend
   - Good documentation
   - Auto-deploys from GitHub
   - Handles environment variables well

2. **Deployment flow:**
   - 30 mins setup time
   - 2 separate services (easier to debug)
   - Clear separation of concerns
   - Easy to switch to Railway/Fly later if needed

3. **Next steps if you outgrow Render:**
   - Move to Railway (~$10/mo, better performance)
   - Or containerize with Docker → Deploy to Fly.io (global CDN)

---

## 📚 Additional Resources

- [Render Docs - Python](https://render.com/docs/deploy-fastapi)
- [Render Docs - Static Sites](https://render.com/docs/deploy-vite)
- [Railway Docs](https://docs.railway.app/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Good luck with your deployment! 🚀**
