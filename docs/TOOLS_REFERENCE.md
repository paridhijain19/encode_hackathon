# 🛠️ Amble Agent Tools Reference

**Complete list of all tools available to the AI agent with detailed specifications**

---

## 📊 Overview

**Total Tools:** 24 tools registered with the root agent

**Categories:**
- User Profile (2 tools)
- Expense Tracking (3 tools)
- Mood Tracking (2 tools)
- Activity Tracking (2 tools)
- Appointment Management (3 tools)
- Wellness Analysis (2 tools)
- Activity Suggestions (3 tools)
- Long-term Memory (2 tools)
- Video Calls (3 tools)
- Web Search (1 tool - via AgentTool)

---

## 1. User Profile Tools

### `update_user_profile`

**Purpose:** Updates the user's persistent profile in Supabase

**Parameters:**
- `name` (str, required): User's name
- `location` (str, required): User's city/location
- `age` (int, optional): User's age
- `interests` (List[str], optional): List of interests (e.g., ["walking", "reading", "gardening"])
- `health_conditions` (List[str], optional): Health conditions (non-diagnostic)
- `emergency_contact_name` (str, optional): Emergency contact name
- `emergency_contact_phone` (str, optional): Emergency contact phone number

**Returns:**
```json
{
  "status": "success",
  "message": "Wonderful, {name}! I've updated your profile in my permanent memory."
}
```

**Example Usage:**
```
User: "My name is Ramesh, I'm 68, and I live in Mumbai"
AI calls: update_user_profile(name="Ramesh", location="Mumbai", age=68)
```

---

### `get_user_profile`

**Purpose:** Retrieves the current user profile from Supabase

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "profile": {
    "name": "Ramesh",
    "location": "Mumbai",
    "age": 68,
    "interests": ["walking", "reading"],
    "health_conditions": ["diabetes"],
    "emergency_contact_name": "Priya",
    "emergency_contact_phone": "+91-9876543210"
  }
}
```

**Example Usage:**
```
User: "What do you know about me?"
AI calls: get_user_profile()
```

---

## 2. Expense Tracking Tools

### `track_expense`

**Purpose:** Adds a new expense to user's history in Supabase

**Parameters:**
- `amount` (float, required): Expense amount
- `category` (str, required): Category (groceries, pharmacy, utilities, healthcare, transport, household, entertainment, other)
- `description` (str, required): Description of the expense

**Returns:**
```json
{
  "status": "success",
  "message": "Noted! ₹{amount} for {description}. Total today is ₹{today_total}."
}
```

**Example Usage:**
```
User: "I spent 500 rupees on groceries and medicine"
AI calls: track_expense(amount=500, category="groceries", description="groceries and medicine")
```

---

### `get_expense_summary`

**Purpose:** Gets a summary of expenses for a given period

**Parameters:**
- `period` (str, optional, default="today"): 'today', 'week', 'month', or 'all'

**Returns:**
```json
{
  "status": "success",
  "period": "week",
  "total": 3500.00,
  "by_category": {
    "groceries": 2000.00,
    "pharmacy": 800.00,
    "utilities": 700.00
  },
  "transaction_count": 12,
  "message": "Your week's expenses total ₹3500.00 across 12 transactions."
}
```

**Example Usage:**
```
User: "How much did I spend this week?"
AI calls: get_expense_summary(period="week")
```

---

### `analyze_spending_patterns`

**Purpose:** Analyzes user's spending patterns to detect insights and provide suggestions

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "total_this_month": 12000.00,
  "by_category": {
    "groceries": 5000.00,
    "pharmacy": 3000.00,
    "utilities": 2000.00,
    "entertainment": 2000.00
  },
  "insights": [
    {
      "type": "top_spending",
      "message": "This month, you've spent the most on groceries (₹5000)"
    },
    {
      "type": "average",
      "message": "You're averaging ₹400 per day this month"
    }
  ],
  "recommendations": [
    {
      "type": "spending_alert",
      "message": "Your groceries spending is higher than usual. Would you like to set a budget?"
    }
  ],
  "summary": "You've spent ₹12000 this month across 30 transactions."
}
```

**Example Usage:**
```
User: "Can you analyze my spending?"
AI calls: analyze_spending_patterns()
```

**Note:** This tool is defined but **NOT registered** in the root agent. It's available but not currently used.

---

## 3. Mood Tracking Tools

### `track_mood`

**Purpose:** Logs the user's current mood and emotional state to Supabase

**Parameters:**
- `mood` (str, required): Mood rating - 'happy', 'content', 'neutral', 'tired', 'sad', 'anxious', 'lonely', 'energetic', 'grateful'
- `energy_level` (int, optional, default=5): Energy level from 1 (very low) to 10 (very high)
- `details` (str, optional): Additional context about their day or feelings

**Returns:**
```json
{
  "status": "success",
  "message": "I'm here for you. Sadness is a natural feeling. Would you like to talk about it?",
  "mood_logged": "sad",
  "energy_level": 4
}
```

**Example Usage:**
```
User: "I'm feeling a bit lonely today"
AI calls: track_mood(mood="lonely", energy_level=4, details="feeling isolated")
```

**Mood Responses:**
- `happy`: "That's wonderful to hear! Your happiness brightens my day too."
- `content`: "A peaceful contentment is a lovely state to be in. Cherish it."
- `tired`: "Rest is important, my dear. Perhaps a gentle nap or some quiet time would do you good."
- `sad`: "I'm here for you. Sadness is a natural feeling. Would you like to talk about it?"
- `anxious`: "Take a deep breath with me. Remember, you're not alone. I'm right here."
- `lonely`: "I understand. Connection matters. Perhaps we could plan a call with someone you love?"

---

### `get_mood_history`

**Purpose:** Gets mood history for pattern analysis

**Parameters:**
- `days` (int, optional, default=7): Number of days to look back

**Returns:**
```json
{
  "status": "success",
  "period_days": 7,
  "mood_counts": {
    "happy": 3,
    "content": 2,
    "tired": 1,
    "sad": 1
  },
  "average_energy": 6.2,
  "trend": "positive",
  "total_entries": 7
}
```

**Trend Calculation:**
- `positive`: More positive moods (happy, content, energetic, grateful)
- `concerning`: More negative moods (sad, anxious, lonely, tired)
- `stable`: Balanced moods

**Example Usage:**
```
User: "How have I been feeling this week?"
AI calls: get_mood_history(days=7)
```

---

## 4. Activity Tracking Tools

### `record_activity`

**Purpose:** Records a daily activity performed by the user

**Parameters:**
- `activity_name` (str, required): Name of the activity (e.g., 'Morning walk in the park')
- `activity_type` (str, required): Type - 'walking', 'exercise', 'reading', 'gardening', 'cooking', 'social', 'hobby', 'meditation', 'shopping', 'religious', 'tv_entertainment', 'phone_call', 'other'
- `duration_minutes` (int, required): How long the activity lasted in minutes
- `notes` (str, optional): Additional notes about the activity

**Returns:**
```json
{
  "status": "success",
  "message": "Splendid! 30 minutes of Morning walk in the park is wonderful for your health. Keep it up!",
  "activity_logged": "Morning walk in the park",
  "duration": 30
}
```

**Response Types:**
- **Active types** (walking, exercise, gardening, shopping): "Splendid! {duration} minutes of {activity} is wonderful for your health."
- **Social types** (social, phone_call): "How lovely! Social connections are so important."
- **Mindful types** (meditation, reading, religious): "Beautiful! Taking time for {activity} nourishes the soul."

**Example Usage:**
```
User: "I went for a 30-minute walk this morning"
AI calls: record_activity(activity_name="Morning walk", activity_type="walking", duration_minutes=30)
```

---

### `get_activity_history`

**Purpose:** Gets activity history for pattern analysis

**Parameters:**
- `days` (int, optional, default=7): Number of days to look back

**Returns:**
```json
{
  "status": "success",
  "period_days": 7,
  "by_type": {
    "walking": {
      "count": 5,
      "total_minutes": 150
    },
    "reading": {
      "count": 3,
      "total_minutes": 90
    }
  },
  "total_activities": 8,
  "total_active_minutes": 240
}
```

**Example Usage:**
```
User: "What activities have I done this week?"
AI calls: get_activity_history(days=7)
```

---

## 5. Appointment Management Tools

### `schedule_appointment`

**Purpose:** Schedules a new appointment or reminder

**Parameters:**
- `title` (str, required): What the appointment is for (e.g., 'Annual checkup with Dr. Sharma')
- `appointment_type` (str, required): Type - 'doctor', 'dentist', 'specialist', 'lab_test', 'pharmacy_pickup', 'personal', 'social', 'other'
- `date_time` (str, required): Scheduled date and time (e.g., '2025-01-30 10:00')
- `location` (str, optional, default="To be confirmed"): Where the appointment is
- `doctor_name` (str, optional): Name of doctor/provider if applicable
- `notes` (str, optional): Any preparation notes or reminders

**Returns:**
```json
{
  "status": "success",
  "message": "I've scheduled your Annual checkup with Dr. Sharma for 2025-01-30 10:00 at Dr. Sharma's Clinic. I'll remind you when it's approaching.",
  "appointment_id": "parent_user_2025-01-30_10:00"
}
```

**Example Usage:**
```
User: "I have a doctor's appointment on January 30th at 10 AM with Dr. Sharma"
AI calls: schedule_appointment(
  title="Annual checkup with Dr. Sharma",
  appointment_type="doctor",
  date_time="2025-01-30 10:00",
  location="Dr. Sharma's Clinic",
  doctor_name="Dr. Sharma"
)
```

---

### `get_upcoming_appointments`

**Purpose:** Gets upcoming appointments for the specified period

**Parameters:**
- `days_ahead` (int, optional, default=7): How many days ahead to look

**Returns:**
```json
{
  "status": "success",
  "message": "You have 2 appointment(s) coming up.",
  "appointments": [
    {
      "id": 123,
      "title": "Annual checkup with Dr. Sharma",
      "date_time": "2025-01-30 10:00",
      "location": "Dr. Sharma's Clinic",
      "description": "Type: doctor; Doctor: Dr. Sharma"
    }
  ]
}
```

**Example Usage:**
```
User: "What appointments do I have coming up?"
AI calls: get_upcoming_appointments(days_ahead=7)
```

---

### `cancel_appointment`

**Purpose:** Cancels an existing appointment

**Parameters:**
- `appointment_id` (int, required): ID of the appointment to cancel
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "message": "I've cancelled your appointment: Annual checkup with Dr. Sharma."
}
```

**Example Usage:**
```
User: "Cancel my appointment on January 30th"
AI calls: cancel_appointment(appointment_id=123)
```

---

## 6. Wellness Analysis Tools

### `analyze_wellness_patterns`

**Purpose:** Analyzes user's patterns across activities, moods, and routines to detect insights and concerns

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "insights": [
    {
      "type": "positive",
      "message": "Wonderful! You've been active 5 times this week. Keep it up!"
    }
  ],
  "concerns": [
    {
      "type": "social_isolation",
      "message": "It seems you haven't had much social interaction this week. Would you like to call someone?",
      "suggested_action": "Consider calling a friend or family member",
      "urgency": "medium"
    }
  ],
  "summary": {
    "activities_this_week": 8,
    "moods_logged": 7,
    "active_days": 5
  }
}
```

**Pattern Detection Rules:**
- **Walking/Exercise**: Flags if less than 3 sessions per week
- **Social Activity**: Flags if no social interactions in 3+ days
- **Mood**: Flags if 3+ negative moods in a week
- **Energy**: Flags if average energy below 4/10
- **Routine**: Flags if inconsistent activity patterns (< 4 active days)

**Example Usage:**
```
User: "How am I doing overall?"
AI calls: analyze_wellness_patterns()
```

---

### `send_family_alert`

**Purpose:** Sends a meaningful update to designated family members

**Parameters:**
- `message` (str, required): The specific detail to share with family
- `urgency` (str, optional, default="low"): 'low', 'medium', 'high', or 'critical'
- `category` (str, optional, default="wellness"): 'wellness', 'activity', 'health', 'social', 'achievement'

**Returns:**
```json
{
  "status": "sent",
  "message": "I've shared this update with your family: '{message}'",
  "urgency": "medium"
}
```

**Example Usage:**
```
AI detects: User has been isolated for 3+ days
AI calls: send_family_alert(
  message="I've noticed Mom's energy has been lower this week and she's been staying in more.",
  urgency="medium",
  category="wellness"
)
```

**Note:** Currently logs to console. In production, this would trigger actual notifications (email, SMS, push).

---

## 7. Activity Suggestions Tools

### `get_activity_suggestions`

**Purpose:** Returns current context (Time, Location, Mood) so the Agent LLM can generate personalized, dynamic suggestions

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "current_time": "02:30 PM",
  "location": "Mumbai",
  "user_interests": ["walking", "reading", "gardening"],
  "last_known_mood": "content",
  "instruction": "Based on this context, suggest 3 warm, personalized activities for a senior user."
}
```

**Note:** This tool provides context to the AI, which then generates suggestions conversationally (not hardcoded).

**Example Usage:**
```
User: "What should I do today?"
AI calls: get_activity_suggestions()
AI then generates personalized suggestions based on the context
```

---

### `search_local_activities`

**Purpose:** Search for local activities and events near the user

**Parameters:**
- `activity_type` (str, optional, default="community"): Type of activity (fitness, social, hobby, religious, learning, community)
- `search_query` (str, optional): Optional specific search query

**Returns:**
```json
{
  "status": "success",
  "events": [
    {
      "name": "Senior Yoga Class",
      "location": "Community Center, Mumbai",
      "time": "Every Tuesday 9 AM",
      "description": "Gentle yoga for seniors",
      "suitability": "Senior-friendly"
    }
  ],
  "count": 5
}
```

**Example Usage:**
```
User: "Find me some local events"
AI calls: search_local_activities(activity_type="community")
```

**Note:** Uses `activity_discovery.py` which integrates with Google Search for local events.

---

### `get_mood_based_suggestions`

**Purpose:** Get activity suggestions based on current mood and energy level

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "suggestions": [
    "Take a gentle walk",
    "Listen to some music",
    "Call a loved one",
    "Do some light stretching",
    "Read a book or magazine"
  ],
  "message": "Here are some activities you might enjoy!"
}
```

**Example Usage:**
```
User: "I'm feeling tired, what should I do?"
AI calls: get_mood_based_suggestions()
```

---

### `get_daily_summary`

**Purpose:** Generates a summary of the user's day including activities, mood, and expenses

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "date": "2025-01-30",
  "mood_trend": "positive",
  "activities_count": 3,
  "total_active_minutes": 90,
  "expenses_total": 500.00,
  "expenses_count": 2,
  "summary": "Today you've been active for 90 minutes with 3 activities. Your mood has been positive."
}
```

**Mood Trend Values:**
- `positive`: More positive moods than negative
- `mixed`: Balanced or mixed moods
- `stable`: Neutral moods
- `not tracked`: No mood data

**Example Usage:**
```
User: "How was my day?"
AI calls: get_daily_summary()
```

---

## 8. Long-term Memory Tools (Mem0)

### `remember_fact`

**Purpose:** Remembers a factual detail about the user using Mem0 for semantic memory

**Parameters:**
- `fact` (str, required): The piece of information to remember
- `category` (str, optional, default="general"): 'preference', 'family', 'history', 'general'

**Returns:**
```json
{
  "status": "success",
  "message": "I've made a note of that: My grandson's name is Rahul"
}
```

**Example Usage:**
```
User: "My grandson's name is Rahul"
AI calls: remember_fact(fact="My grandson's name is Rahul", category="family")
```

**Use Cases:**
- Personal facts: "I worked as a teacher"
- Preferences: "I hate spicy food"
- Family details: "My daughter lives in Pune"
- History: "I used to play cricket"

**Note:** Uses Mem0 API for semantic search. Falls back gracefully if Mem0 is unavailable.

---

### `recall_memories`

**Purpose:** Recalls facts from Mem0 semantic memory

**Parameters:**
- `query` (str, optional): Optional search term
- `category` (str, optional): Optional category filter

**Returns:**
```json
{
  "status": "success",
  "memories": [
    {
      "fact": "[family] My grandson's name is Rahul",
      "relevance": 0.95
    }
  ],
  "count": 1
}
```

**Example Usage:**
```
User: "What do you remember about my family?"
AI calls: recall_memories(query="family", category="family")
```

**Note:** Uses semantic search, so it finds relevant memories even if exact words don't match.

---

## 9. Video Call Tools

### `initiate_video_call`

**Purpose:** Initiates a video call with a family member or friend

**Parameters:**
- `contact_name` (str, required): Name of the person to call (e.g., "my daughter", "Ravi", "family")
- `contact_type` (str, optional, default="family"): Type of contact - 'family', 'friend', 'caregiver'

**Returns:**
```json
{
  "status": "success",
  "message": "I'm setting up a video call with Priya for you!",
  "call_ready": true,
  "instructions": "The video call screen is now ready. Your family member will receive a notification to join.",
  "ui_action": "open_video_call",
  "contact": "Priya"
}
```

**Example Usage:**
```
User: "I want to call my daughter"
AI calls: initiate_video_call(contact_name="my daughter", contact_type="family")
```

**Note:** 
- Logs the call request as a social activity
- Creates an alert for family members
- Triggers UI action to open video call interface

---

### `end_video_call`

**Purpose:** Ends the current video call and logs the activity

**Parameters:**
- `duration_minutes` (int, optional, default=0): How long the call lasted

**Returns:**
```json
{
  "status": "success",
  "message": "The video call has ended. It's wonderful that you connected with your family!",
  "duration": 15
}
```

**Example Usage:**
```
User: "End the call"
AI calls: end_video_call(duration_minutes=15)
```

---

### `get_available_contacts`

**Purpose:** Gets the list of family members and friends available for video calls

**Parameters:**
- `tool_context` (ToolContext, required): ADK tool context

**Returns:**
```json
{
  "status": "success",
  "contacts": [
    {
      "name": "Priya",
      "relationship": "Emergency Contact",
      "available": true
    },
    {
      "name": "Family Group",
      "relationship": "All Family Members",
      "available": true
    }
  ],
  "message": "You can call Priya or start a family group call."
}
```

**Example Usage:**
```
User: "Who can I call?"
AI calls: get_available_contacts()
```

---

## 10. Web Search Tool

### `search_tool` (via AgentTool)

**Purpose:** Searches the web for local events, news, and factual information

**Note:** This is wrapped in a separate `search_agent` (LlmAgent) and exposed via `AgentTool` to avoid ADK function calling conflicts.

**How It Works:**
1. User asks: "Find local events in Mumbai"
2. Root agent calls `search_tool`
3. `search_tool` delegates to `search_agent` (separate LlmAgent)
4. `search_agent` uses Google Search to find information
5. Results are returned to root agent
6. Root agent synthesizes response

**Example Usage:**
```
User: "What's happening in Mumbai this weekend?"
AI calls: search_tool(query="events in Mumbai this weekend")
```

**Search Agent Capabilities:**
- Local events and activities suitable for seniors
- Health and wellness information
- News and current events
- Factual answers to questions

---

## 📋 Tools Summary Table

| Category | Tool Name | Purpose | Registered? |
|----------|-----------|---------|-------------|
| **Profile** | `update_user_profile` | Update user profile | ✅ Yes |
| **Profile** | `get_user_profile` | Get user profile | ✅ Yes |
| **Expense** | `track_expense` | Log expense | ✅ Yes |
| **Expense** | `get_expense_summary` | Get expense summary | ✅ Yes |
| **Expense** | `analyze_spending_patterns` | Analyze spending | ❌ No |
| **Mood** | `track_mood` | Log mood | ✅ Yes |
| **Mood** | `get_mood_history` | Get mood history | ✅ Yes |
| **Activity** | `record_activity` | Log activity | ✅ Yes |
| **Activity** | `get_activity_history` | Get activity history | ✅ Yes |
| **Appointment** | `schedule_appointment` | Schedule appointment | ✅ Yes |
| **Appointment** | `get_upcoming_appointments` | Get upcoming appointments | ✅ Yes |
| **Appointment** | `cancel_appointment` | Cancel appointment | ✅ Yes |
| **Wellness** | `analyze_wellness_patterns` | Analyze wellness | ✅ Yes |
| **Wellness** | `send_family_alert` | Send family alert | ✅ Yes |
| **Wellness** | `get_family_alerts_history` | Get alert history | ❌ No |
| **Suggestions** | `get_activity_suggestions` | Get suggestions | ✅ Yes |
| **Suggestions** | `search_local_activities` | Search local events | ❌ No |
| **Suggestions** | `get_mood_based_suggestions` | Mood-based suggestions | ❌ No |
| **Suggestions** | `suggest_daily_activity` | Suggest daily activity | ❌ No |
| **Summary** | `get_daily_summary` | Get daily summary | ✅ Yes |
| **Memory** | `remember_fact` | Remember fact | ✅ Yes |
| **Memory** | `recall_memories` | Recall memories | ✅ Yes |
| **Video** | `initiate_video_call` | Start video call | ✅ Yes |
| **Video** | `end_video_call` | End video call | ✅ Yes |
| **Video** | `get_available_contacts` | Get contacts | ✅ Yes |
| **Search** | `search_tool` | Web search | ✅ Yes |

**Total Registered:** 20 tools  
**Total Available (not registered):** 4 tools

---

## 🔍 Tool Selection Logic

The AI agent decides which tools to call based on:

1. **User Intent Recognition**
   - "I spent 500" → `track_expense`
   - "How am I feeling?" → `get_mood_history`
   - "Schedule an appointment" → `schedule_appointment`

2. **Context Awareness**
   - Time of day → `get_activity_suggestions`
   - Recent patterns → `analyze_wellness_patterns`
   - User profile → Personalized tool selection

3. **Proactive Behavior**
   - Detects patterns → `analyze_wellness_patterns`
   - Suggests actions → `get_activity_suggestions`
   - Sends alerts → `send_family_alert`

4. **Tool Chaining**
   - User asks complex question → Multiple tools
   - Example: "How was my week?" → `get_mood_history` + `get_activity_history` + `get_expense_summary`

---

## 💡 Adding New Tools

To add a new tool:

1. **Define function in `agent/tools.py`:**
   ```python
   def my_new_tool(
       tool_context: ToolContext,
       param1: str,
       param2: int = 10
   ) -> dict:
       """Tool description for the AI agent."""
       # Implementation
       return {"status": "success", "result": "..."}
   ```

2. **Register in `agent/agent.py`:**
   ```python
   root_agent = Agent(
       tools=[
           # ... existing tools
           my_new_tool,  # Add here
       ]
   )
   ```

3. **Update prompts in `agent/prompts.py`** (if needed):
   - Add instructions about when to use the new tool

---

## 🎯 Tool Usage Patterns

### **Simple Query → Single Tool**
```
User: "How much did I spend today?"
→ get_expense_summary(period="today")
```

### **Complex Query → Multiple Tools**
```
User: "How am I doing overall?"
→ analyze_wellness_patterns()
→ get_mood_history(days=7)
→ get_activity_history(days=7)
```

### **Action Request → Tool + Response**
```
User: "I'm feeling sad"
→ track_mood(mood="sad", energy_level=4)
→ AI generates empathetic response
```

### **Proactive Suggestion → Context + Tool**
```
AI notices: User hasn't been active
→ analyze_wellness_patterns()
→ get_activity_suggestions()
→ AI generates suggestion
```

---

**Last Updated:** February 2026  
**Total Tools:** 24 defined, 20 registered, 4 available but not registered
