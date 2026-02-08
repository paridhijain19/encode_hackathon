# Quick Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] All code pushed to GitHub repository
- [ ] `.env` file created with all required environment variables
- [ ] Supabase project created and database schema deployed
- [ ] All API keys collected (Google AI, Resend, CometChat, etc.)
- [ ] Tested app locally (frontend on :5173, backend on :8000)

---

## 🚀 Option 1: Deploy to Render (Recommended)

### Step 1: Deploy Backend

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   ```
   Name: amble-backend
   Runtime: Python 3
   Branch: main (or your branch)
   Root Directory: (leave blank)
   Build Command: pip install -r requirements.txt
   Start Command: uvicorn agent.server:app --host 0.0.0.0 --port $PORT
   ```
5. Add Environment Variables (click "Advanced"):
   - Click "Add from .env"
   - Paste contents of your `.env` file
   - OR add manually (20+ variables from `.env.example`)
6. Click "Create Web Service"
7. Wait for deployment (~5 minutes)
8. **Copy your backend URL**: `https://amble-backend-xxx.onrender.com`

### Step 2: Deploy Frontend

1. In Render dashboard, click "New +" → "Static Site"
2. Connect same GitHub repository
3. Configure:
   ```
   Name: amble-frontend
   Branch: main
   Root Directory: (leave blank)
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```
4. Add Environment Variables:
   ```
   VITE_API_URL=https://amble-backend-xxx.onrender.com
   VITE_ELEVENLABS_AGENT_ID=your_elevenlabs_id
   VITE_ANAM_API_KEY=your_anam_key
   ```
5. Click "Create Static Site"
6. Wait for deployment (~3 minutes)
7. **Your app is live!** Visit the provided URL

### Step 3: Update Backend CORS

1. Open `agent/server.py` in your code editor
2. Find the `CORSMiddleware` section
3. Add your frontend URL to `allow_origins`:
   ```python
   allow_origins=[
       "http://localhost:5173",
       "https://amble-frontend-xxx.onrender.com",  # Your Render frontend URL
   ],
   ```
4. Commit and push changes
5. Render will auto-deploy the update

✅ **Done! Your app is deployed.**

---

## 🚀 Option 2: Deploy to Railway

### Step 1: Create Project

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect both Python and Node.js

### Step 2: Configure Services

Railway will create one service by default. You need TWO:

1. **Modify default service (Backend):**
   - Settings → Build → Start Command: `uvicorn agent.server:app --host 0.0.0.0 --port $PORT`
   - Variables → Add all from `.env` file
   - Generate Domain

2. **Add Frontend Service:**
   - Click "+ New" → "Add Service" → "GitHub Repo" (same repo)
   - Settings → Build:
     - Build Command: `npm install && npm run build && npm install -g serve`
     - Start Command: `serve -s dist -l $PORT`
   - Variables → Add:
     - `VITE_API_URL` = (backend URL from step 1)
     - `VITE_ELEVENLABS_AGENT_ID` = your ID
     - `VITE_ANAM_API_KEY` = your key
   - Generate Domain

✅ **Done!**

---

## 🚀 Option 3: Deploy to Vercel (Frontend) + Render (Backend)

### Step 1: Deploy Backend to Render
Follow "Option 1: Deploy Backend" steps above.

### Step 2: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   ```
   Framework Preset: Vite
   Build Command: npm run build (auto-detected)
   Output Directory: dist (auto-detected)
   Install Command: npm install (auto-detected)
   ```
5. Add Environment Variables:
   ```
   VITE_API_URL=https://amble-backend-xxx.onrender.com
   VITE_ELEVENLABS_AGENT_ID=your_id
   VITE_ANAM_API_KEY=your_key
   ```
6. Click "Deploy"
7. Wait 2-3 minutes

✅ **Done!**

---

## 🚀 Option 4: Deploy to Fly.io (Single Container)

### Prerequisites
```bash
# Install Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login
```

### Deploy

```bash
# From project root
fly launch

# Follow prompts:
# - Choose app name
# - Choose region
# - Don't deploy yet (we need to set env vars)

# Set environment variables
fly secrets set GOOGLE_API_KEY=xxx GEMINI_API_KEY=xxx SUPABASE_URL=xxx ...
# (set all variables from .env)

# Deploy
fly deploy

# Open in browser
fly open
```

✅ **Done!**

---

## 🧪 Testing Your Deployment

After deployment, test these features:

1. **Basic Access:**
   - [ ] Homepage loads
   - [ ] Can navigate to /parent
   - [ ] Can navigate to /family

2. **Backend Connection:**
   - [ ] Open browser DevTools (F12)
   - [ ] Go to Console tab
   - [ ] Check for any red errors
   - [ ] Try chat feature - should connect to backend

3. **Database Connection:**
   - [ ] Sign in works
   - [ ] Data persists after refresh
   - [ ] User profile loads

4. **External Services:**
   - [ ] ElevenLabs avatar loads (if configured)
   - [ ] Chat history saves
   - [ ] Email notifications work (if configured)

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to fetch" or CORS errors

**Fix:** Update CORS in `agent/server.py`:
```python
allow_origins=[
    "http://localhost:5173",
    "https://your-actual-frontend-url.com",  # Add this
],
```

### Issue: Backend crashes with "Module not found"

**Fix:** Check `requirements.txt` includes all dependencies:
```bash
pip freeze > requirements.txt
```

### Issue: Environment variables not working

**Fix for Vite:**
- Variable must start with `VITE_`
- Must be set at BUILD time (before `npm run build`)
- Rebuild after changing env vars

### Issue: Database connection fails

**Fix:**
- Verify Supabase URL and keys in backend env vars
- Check Supabase project is active (not paused)
- Test connection from Supabase dashboard

### Issue: Build takes too long or fails

**Fix:**
- Free tier has limited resources
- Try reducing dependencies
- For Python: add `--no-cache-dir` to pip install
- For Node: delete `node_modules` and reinstall

---

## 📊 Monitoring Your Deployment

### Render
- Dashboard → Service → Logs (real-time)
- Dashboard → Service → Metrics (CPU/RAM)

### Railway
- Project → Service → Deployments → Logs
- Project → Service → Metrics

### Vercel
- Project → Deployments → [Latest] → Logs
- Project → Analytics

### Fly.io
```bash
fly logs
fly status
fly dashboard
```

---

## 💰 Cost Estimates

| Platform | Free Tier | After Free Tier |
|----------|-----------|----------------|
| Render | ✅ 750 hrs/mo | $7/mo per service |
| Railway | ✅ $5 credit | ~$10-20/mo |
| Vercel | ✅ Unlimited | $20/mo Pro |
| Fly.io | ✅ 3 VMs | ~$5-15/mo |

**Recommendation:** Start with Render free tier for both services.

---

## 🔄 Setting Up Auto-Deploy

All platforms support auto-deploy from GitHub:

1. **Render:** Automatic (enabled by default)
2. **Railway:** Automatic (enabled by default)
3. **Vercel:** Automatic (enabled by default)
4. **Fly.io:** Set up GitHub Actions (see fly.io docs)

When you push to your main branch, your app will auto-deploy! 🎉

---

## 📞 Getting Help

If stuck, provide this info to your helper:

```
Project: Amble (Elder care app)
Stack: React + Vite frontend, Python FastAPI backend
Database: Supabase (external)
Platform: [Render/Railway/Vercel/Fly.io]
Issue: [describe issue]
Error message: [paste error from logs]
Backend URL: https://xxx
Frontend URL: https://xxx
```

---

**Need more help? Check DEPLOYMENT_GUIDE.md for detailed explanations!**
