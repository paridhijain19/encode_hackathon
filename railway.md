# Railway Configuration for Amble App
# This file helps Railway understand how to build and deploy your app

# You'll need to create TWO separate services in Railway:
# 1. Backend Service (Python FastAPI)
# 2. Frontend Service (Static Site)

# ===================================
# SERVICE 1: BACKEND
# ===================================
# Root Directory: /
# Build Command: pip install -r requirements.txt
# Start Command: uvicorn agent.server:app --host 0.0.0.0 --port $PORT
# Environment Variables: (Add all from .env.example)

# ===================================
# SERVICE 2: FRONTEND
# ===================================
# Root Directory: /
# Build Command: npm install && npm run build && npm install -g serve
# Start Command: serve -s dist -l $PORT
# Environment Variables:
#   VITE_API_URL=https://your-backend-service.railway.app

# Note: This is a reference file. Railway doesn't require a config file,
# but these are the settings you should use in the Railway dashboard.
