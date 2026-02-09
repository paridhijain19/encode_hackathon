# API Key Fallback Setup Guide

Your backend now supports **multiple API keys with automatic fallback** when quotas are exhausted. This prevents service interruption when free-tier limits are reached.

## How It Works

1. **Multiple Keys**: Configure multiple Google/Anam API keys
2. **Smart Rotation**: Uses keys in rotation, switching automatically  
3. **Quota Detection**: Detects quota/rate limit errors automatically
4. **Cooldown Period**: Waits 1 hour before retrying exhausted keys
5. **Graceful Fallback**: Shows user-friendly messages when all keys exhausted

## Environment Variable Setup

### Google/Gemini Keys (for AI agent)

**Option 1: Single Key (existing setup)**
```env
GOOGLE_API_KEY=your_google_api_key_here
```

**Option 2: Multiple Keys (recommended)**
```env
GOOGLE_API_KEY_1=your_first_google_key
GOOGLE_API_KEY_2=your_second_google_key  
GOOGLE_API_KEY_3=your_third_google_key
# Add more as needed: GOOGLE_API_KEY_4, GOOGLE_API_KEY_5, etc.
```

### Anam Keys (for video avatar)

**Option 1: Single Key (existing setup)**
```env
ANAM_API_KEY=your_anam_api_key_here
```

**Option 2: Multiple Keys (recommended)**
```env
ANAM_API_KEY_1=your_first_anam_key
ANAM_API_KEY_2=your_second_anam_key
ANAM_API_KEY_3=your_third_anam_key
# Add more as needed: ANAM_API_KEY_4, ANAM_API_KEY_5, etc.
```

## Getting Multiple API Keys

### Google AI Studio
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create multiple Google accounts or projects
3. Generate separate API keys for each
4. Each key gets its own free tier quota

### Anam AI  
1. Go to [anam.ai](https://www.anam.ai)
2. Create multiple accounts (use different emails)
3. Get API key from each account dashboard
4. Each account gets its own free tier quota

## Monitoring API Key Usage

Check key status at: `https://your-backend-url.com/api/keys/status`

Response example:
```json
{
  "status": "ok",
  "api_keys": {
    "google": {
      "total": 3,
      "available": 2, 
      "cooling_down": 1,
      "exhausted": 0
    },
    "anam": {
      "total": 2,
      "available": 1,
      "cooling_down": 1, 
      "exhausted": 0
    }
  }
}
```

## Error Handling

When all keys are exhausted, users see:
- **Chat**: "I'm experiencing high demand right now. Please try again in a few minutes."
- **Video Avatar**: "All Anam API keys exhausted. Please try again later."

Keys automatically become available again after 1-hour cooldown.

## Deployment on Render

1. **Add all your keys** to Render environment variables:
   ```
   GOOGLE_API_KEY_1 = your_first_google_key
   GOOGLE_API_KEY_2 = your_second_google_key
   ANAM_API_KEY_1 = your_first_anam_key
   ANAM_API_KEY_2 = your_second_anam_key
   ```

2. **Deploy**: The system automatically detects and uses all available keys

3. **Monitor**: Check `/api/keys/status` endpoint to see key usage

## Best Practices

- **Start with 2-3 keys** per service
- **Monitor usage** regularly via status endpoint  
- **Add more keys** before hitting limits in production
- **Different email accounts** for each key to maximize quotas
- **Keep backup keys** ready for peak usage periods

## Troubleshooting

**"No API keys available" error:**
- Check environment variables are set correctly
- Verify key formats match examples above
- Wait 1 hour if all keys recently exhausted

**Keys not rotating:**
- Check server logs for error details
- Verify keys are valid (test individually)
- Ensure different keys, not duplicates

---

Your backend is now **production-ready** with automatic quota handling! 🚀