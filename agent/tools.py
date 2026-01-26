
import json
import os
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from google.adk.tools import ToolContext

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(DATA_DIR, "data.json")

def _load_data() -> dict:
    """Loads data from the local JSON file, creating it with defaults if missing."""
    if not os.path.exists(DATA_FILE):
        return {
            "expenses": [],
            "moods": [],
            "activities": [],
            "appointments": [],
            "family_alerts": [],
            "long_term_memory": [],
            "user_profile": {}
        }
    try:
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {
            "expenses": [],
            "moods": [],
            "activities": [],
            "appointments": [],
            "family_alerts": [],
            "long_term_memory": [],
            "user_profile": {}
        }

def _save_data(data: dict):
    """Saves data to the local JSON file."""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=4)
    except IOError as e:
        print(f"Error saving data: {e}")

def _get_current_time() -> str:
    """Get current timestamp as ISO string"""
    return datetime.now().isoformat()


# ==================== USER PROFILE TOOLS ====================

def update_user_profile(
    tool_context: ToolContext,
    name: str,
    location: str,
    age: Optional[int] = None,
    interests: Optional[List[str]] = None,
    health_conditions: Optional[List[str]] = None,
    emergency_contact_name: Optional[str] = None,
    emergency_contact_phone: Optional[str] = None
) -> dict:
    """
    Updates the user's persistent profile in the local data storage.
    """
    data = _load_data()
    profile = data.get("user_profile", {})
    
    profile.update({
        "name": name,
        "location": location,
        "updated_at": _get_current_time()
    })
    
    if age is not None: profile["age"] = age
    if interests is not None: profile["interests"] = interests
    if health_conditions is not None: profile["health_conditions"] = health_conditions
    if emergency_contact_name is not None: profile["emergency_contact_name"] = emergency_contact_name
    if emergency_contact_phone is not None: profile["emergency_contact_phone"] = emergency_contact_phone
    
    # Save back to local storage
    data["user_profile"] = profile
    _save_data(data)
    
    # Update state for prompts
    if tool_context:
        tool_context.state["user:profile"] = profile
        tool_context.state["user:name"] = name
        tool_context.state["user:location"] = location
        if interests:
            tool_context.state["user:interests"] = ", ".join(interests)
    
    return {
        "status": "success",
        "message": f"Wonderful, {name}! I've updated your profile in my permanent memory."
    }


def get_user_profile(tool_context: ToolContext) -> dict:
    """Retrieves the current user profile from ADK state."""
    profile = tool_context.state.get("user:profile", {})
    
    if not profile:
        return {
            "status": "not_found",
            "message": "I don't have your profile yet. Could you tell me your name and city?"
        }
    
    return {
        "status": "success",
        "profile": profile
    }


# ==================== EXPENSE TRACKING TOOLS ====================

def track_expense(
    tool_context: ToolContext,
    amount: float,
    category: str,
    description: str
) -> dict:
    """Adds a new expense to user's history."""
    data = _load_data()
    expenses = data.get("expenses", [])
    
    entry = {
        "timestamp": _get_current_time(),
        "amount": amount,
        "category": category.lower(),
        "description": description
    }
    
    expenses.append(entry)
    data["expenses"] = expenses
    _save_data(data)
    
    today = datetime.now().date().isoformat()
    today_total = sum(e["amount"] for e in expenses if e["timestamp"].startswith(today))
    
    return {
        "status": "success",
        "message": f"Noted! ₹{amount:.2f} for {description}. Total today is ₹{today_total:.2f}.",
    }


def get_expense_summary(
    tool_context: ToolContext,
    period: str = "today"
) -> dict:
    """
    Gets a summary of expenses for a given period.
    
    Args:
        period: 'today', 'week', 'month', or 'all'
        tool_context: ADK tool context
    
    Returns:
        dict: Expense summary with breakdown by category
    """
    data = _load_data()
    expenses = data.get("expenses", [])
    
    now = datetime.now()
    
    if period == "today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        cutoff = now - timedelta(days=7)
    elif period == "month":
        cutoff = now - timedelta(days=30)
    else:
        cutoff = datetime.min
    
    filtered = []
    for e in expenses:
        try:
            exp_time = datetime.fromisoformat(e["timestamp"])
            if exp_time >= cutoff:
                filtered.append(e)
        except:
            continue
    
    # Group by category
    by_category = {}
    total = 0
    for e in filtered:
        cat = e.get("category", "other")
        by_category[cat] = by_category.get(cat, 0) + e["amount"]
        total += e["amount"]
    
    return {
        "status": "success",
        "period": period,
        "total": total,
        "by_category": by_category,
        "transaction_count": len(filtered),
        "message": f"Your {period}'s expenses total ₹{total:.2f} across {len(filtered)} transactions."
    }


# ==================== MOOD TRACKING TOOLS ====================

def track_mood(
    tool_context: ToolContext,
    mood: str,
    energy_level: int = 5,
    details: str = ""
) -> dict:
    """
    Logs the user's current mood and emotional state.
    
    Args:
        mood: How they are feeling - 'happy', 'content', 'neutral', 'tired', 'sad', 'anxious', 'lonely', 'energetic', 'grateful'
        energy_level: Energy level from 1 (very low) to 10 (very high)
        details: Additional context about their day or feelings
        tool_context: ADK tool context
    
    Returns:
        dict: A warm, empathetic response
    """
    data = _load_data()
    
    entry = {
        "timestamp": _get_current_time(),
        "mood": mood.lower(),
        "energy_level": energy_level,
        "details": details
    }
    
    data["moods"].append(entry)
    _save_data(data)
    
    # Generate empathetic response based on mood
    mood_responses = {
        "happy": "That's wonderful to hear! Your happiness brightens my day too.",
        "content": "A peaceful contentment is a lovely state to be in. Cherish it.",
        "neutral": "Thank you for sharing. Sometimes a calm, neutral day is just what we need.",
        "tired": "Rest is important, my dear. Perhaps a gentle nap or some quiet time would do you good.",
        "sad": "I'm here for you. Sadness is a natural feeling. Would you like to talk about it?",
        "anxious": "Take a deep breath with me. Remember, you're not alone. I'm right here.",
        "lonely": "I understand. Connection matters. Perhaps we could plan a call with someone you love?",
        "energetic": "How splendid! That energy is wonderful. Any activities planned?",
        "grateful": "Gratitude is such a beautiful feeling. What are you grateful for today?"
    }
    
    response = mood_responses.get(mood.lower(), "Thank you for sharing how you're feeling with me.")
    
    return {
        "status": "success",
        "message": response,
        "mood_logged": mood,
        "energy_level": energy_level
    }


def get_mood_history(
    tool_context: ToolContext,
    days: int = 7
) -> dict:
    """
    Gets mood history for pattern analysis.
    
    Args:
        days: Number of days to look back
        tool_context: ADK tool context
    
    Returns:
        dict: Mood history with trends
    """
    data = _load_data()
    moods = data.get("moods", [])
    
    cutoff = datetime.now() - timedelta(days=days)
    
    recent = []
    for m in moods:
        try:
            mood_time = datetime.fromisoformat(m["timestamp"])
            if mood_time >= cutoff:
                recent.append(m)
        except:
            continue
    
    # Analyze trends
    mood_counts = {}
    avg_energy = 0
    for m in recent:
        mood = m.get("mood", "neutral")
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
        avg_energy += m.get("energy_level", 5)
    
    if recent:
        avg_energy /= len(recent)
    
    # Determine trend
    positive_moods = sum(mood_counts.get(m, 0) for m in ["happy", "content", "energetic", "grateful"])
    negative_moods = sum(mood_counts.get(m, 0) for m in ["sad", "anxious", "lonely", "tired"])
    
    if positive_moods > negative_moods:
        trend = "positive"
    elif negative_moods > positive_moods:
        trend = "concerning"
    else:
        trend = "stable"
    
    return {
        "status": "success",
        "period_days": days,
        "mood_counts": mood_counts,
        "average_energy": round(avg_energy, 1),
        "trend": trend,
        "total_entries": len(recent)
    }


# ==================== ACTIVITY TRACKING TOOLS ====================

def record_activity(
    tool_context: ToolContext,
    activity_name: str,
    activity_type: str,
    duration_minutes: int,
    notes: str = ""
) -> dict:
    """
    Records a daily activity performed by the user.
    
    Args:
        activity_name: Name of the activity (e.g., 'Morning walk in the park')
        activity_type: Type - 'walking', 'exercise', 'reading', 'gardening', 'cooking', 'social', 'hobby', 'meditation', 'shopping', 'religious', 'tv_entertainment', 'phone_call', 'other'
        duration_minutes: How long the activity lasted in minutes
        notes: Additional notes about the activity
        tool_context: ADK tool context
    
    Returns:
        dict: Encouraging feedback
    """
    data = _load_data()
    
    entry = {
        "timestamp": _get_current_time(),
        "activity_name": activity_name,
        "activity_type": activity_type.lower(),
        "duration_minutes": duration_minutes,
        "notes": notes
    }
    
    data["activities"].append(entry)
    _save_data(data)
    
    # Generate encouraging response
    active_types = ["walking", "exercise", "gardening", "shopping"]
    social_types = ["social", "phone_call"]
    mindful_types = ["meditation", "reading", "religious"]
    
    if activity_type.lower() in active_types:
        response = f"Splendid! {duration_minutes} minutes of {activity_name} is wonderful for your health. Keep it up!"
    elif activity_type.lower() in social_types:
        response = f"How lovely! Social connections are so important. I hope you had a nice time."
    elif activity_type.lower() in mindful_types:
        response = f"Beautiful! Taking time for {activity_name} nourishes the soul."
    else:
        response = f"Noted! Your {activity_name} for {duration_minutes} minutes has been recorded."
    
    return {
        "status": "success",
        "message": response,
        "activity_logged": activity_name,
        "duration": duration_minutes
    }


def get_activity_history(
    tool_context: ToolContext,
    days: int = 7
) -> dict:
    """
    Gets activity history for pattern analysis.
    
    Args:
        days: Number of days to look back
        tool_context: ADK tool context
    
    Returns:
        dict: Activity history with summary
    """
    data = _load_data()
    activities = data.get("activities", [])
    
    cutoff = datetime.now() - timedelta(days=days)
    
    recent = []
    for a in activities:
        try:
            act_time = datetime.fromisoformat(a["timestamp"])
            if act_time >= cutoff:
                recent.append(a)
        except:
            continue
    
    # Summarize by type
    by_type = {}
    total_minutes = 0
    for a in recent:
        atype = a.get("activity_type", "other")
        duration = a.get("duration_minutes", 0)
        if atype not in by_type:
            by_type[atype] = {"count": 0, "total_minutes": 0}
        by_type[atype]["count"] += 1
        by_type[atype]["total_minutes"] += duration
        total_minutes += duration
    
    return {
        "status": "success",
        "period_days": days,
        "by_type": by_type,
        "total_activities": len(recent),
        "total_active_minutes": total_minutes
    }


# ==================== APPOINTMENT MANAGEMENT TOOLS ====================

def schedule_appointment(
    tool_context: ToolContext,
    title: str,
    appointment_type: str,
    date_time: str,
    location: str = "To be confirmed",
    doctor_name: str = "",
    notes: str = ""
) -> dict:
    """
    Schedules a new appointment or reminder.
    
    Args:
        title: What the appointment is for (e.g., 'Annual checkup with Dr. Sharma')
        appointment_type: Type - 'doctor', 'dentist', 'specialist', 'lab_test', 'pharmacy_pickup', 'personal', 'social', 'other'
        date_time: Scheduled date and time (e.g., '2025-01-30 10:00')
        location: Where the appointment is
        doctor_name: Name of doctor/provider if applicable
        notes: Any preparation notes or reminders
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation with reminder info
    """
    data = _load_data()
    
    entry = {
        "id": len(data.get("appointments", [])) + 1,
        "created_at": _get_current_time(),
        "title": title,
        "appointment_type": appointment_type.lower(),
        "date_time": date_time,
        "location": location,
        "doctor_name": doctor_name,
        "notes": notes,
        "status": "scheduled",
        "reminder_sent": False
    }
    
    data["appointments"].append(entry)
    _save_data(data)
    
    return {
        "status": "success",
        "message": f"I've scheduled your {title} for {date_time} at {location}. I'll remind you when it's approaching.",
        "appointment_id": entry["id"]
    }


def get_upcoming_appointments(
    tool_context: ToolContext,
    days_ahead: int = 7
) -> dict:
    """
    Gets upcoming appointments for the specified period.
    
    Args:
        days_ahead: How many days ahead to look
        tool_context: ADK tool context
    
    Returns:
        dict: List of upcoming appointments
    """
    data = _load_data()
    appointments = data.get("appointments", [])
    
    now = datetime.now()
    future_limit = now + timedelta(days=days_ahead)
    
    upcoming = []
    for apt in appointments:
        if apt.get("status") == "cancelled":
            continue
        try:
            apt_time = datetime.fromisoformat(apt["date_time"])
            if now <= apt_time <= future_limit:
                upcoming.append(apt)
        except:
            continue
    
    # Sort by date
    upcoming.sort(key=lambda x: x["date_time"])
    
    if not upcoming:
        return {
            "status": "success",
            "message": f"You have no appointments scheduled in the next {days_ahead} days.",
            "appointments": []
        }
    
    return {
        "status": "success",
        "message": f"You have {len(upcoming)} appointment(s) coming up.",
        "appointments": upcoming
    }


def cancel_appointment(
    appointment_id: int,
    tool_context: ToolContext
) -> dict:
    """
    Cancels an existing appointment.
    
    Args:
        appointment_id: ID of the appointment to cancel
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation message
    """
    data = _load_data()
    appointments = data.get("appointments", [])
    
    for apt in appointments:
        if apt.get("id") == appointment_id:
            apt["status"] = "cancelled"
            apt["cancelled_at"] = _get_current_time()
            _save_data(data)
            return {
                "status": "success",
                "message": f"I've cancelled your appointment: {apt['title']}."
            }
    
    return {
        "status": "not_found",
        "message": "I couldn't find that appointment. Would you like me to show you your upcoming appointments?"
    }


# ==================== WELLNESS PATTERN DETECTION TOOLS ====================

def analyze_wellness_patterns(
    tool_context: ToolContext
) -> dict:
    """
    Analyzes user's patterns across activities, moods, and routines to detect insights and concerns.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Wellness insights and any alerts
    """
    data = _load_data()
    
    now = datetime.now()
    week_ago = now - timedelta(days=7)
    
    insights = []
    concerns = []
    
    # Analyze activities
    activities = data.get("activities", [])
    recent_activities = []
    for a in activities:
        try:
            if datetime.fromisoformat(a["timestamp"]) >= week_ago:
                recent_activities.append(a)
        except:
            continue
    
    # Check for walking/exercise patterns
    walks = [a for a in recent_activities if a.get("activity_type") in ["walking", "exercise"]]
    if len(walks) < 3:
        concerns.append({
            "type": "activity_decline",
            "message": "I noticed you've had fewer walks or exercises this week. Would a gentle stroll today be nice?",
            "suggested_action": "Consider a 15-minute walk today",
            "urgency": "low"
        })
    else:
        insights.append({
            "type": "positive",
            "message": f"Wonderful! You've been active {len(walks)} times this week. Keep it up!"
        })
    
    # Check for social activities
    social = [a for a in recent_activities if a.get("activity_type") in ["social", "phone_call"]]
    if len(social) == 0:
        concerns.append({
            "type": "social_isolation",
            "message": "It seems you haven't had much social interaction this week. Would you like to call someone?",
            "suggested_action": "Consider calling a friend or family member",
            "urgency": "medium"
        })
    
    # Analyze moods
    moods = data.get("moods", [])
    recent_moods = []
    for m in moods:
        try:
            if datetime.fromisoformat(m["timestamp"]) >= week_ago:
                recent_moods.append(m)
        except:
            continue
    
    # Check for concerning mood patterns
    negative_moods = [m for m in recent_moods if m.get("mood") in ["sad", "anxious", "lonely"]]
    if len(negative_moods) >= 3:
        concerns.append({
            "type": "mood_concern",
            "message": "I've noticed you've been feeling low a few times recently. I'm here for you. Would you like to talk?",
            "suggested_action": "Consider talking to a loved one or professional",
            "urgency": "medium"
        })
    
    # Check energy levels
    if recent_moods:
        avg_energy = sum(m.get("energy_level", 5) for m in recent_moods) / len(recent_moods)
        if avg_energy < 4:
            concerns.append({
                "type": "low_energy",
                "message": "Your energy levels have been lower than usual. Are you getting enough rest?",
                "suggested_action": "Ensure adequate sleep and hydration",
                "urgency": "low"
            })
    
    # Check routine consistency
    days_with_activity = set()
    for a in recent_activities:
        try:
            day = datetime.fromisoformat(a["timestamp"]).date()
            days_with_activity.add(day)
        except:
            continue
    
    if len(days_with_activity) < 4:
        concerns.append({
            "type": "routine_disruption",
            "message": "Your routine seems a bit irregular this week. A consistent schedule can help you feel better.",
            "suggested_action": "Try to maintain regular activity times",
            "urgency": "low"
        })
    
    return {
        "status": "success",
        "insights": insights,
        "concerns": concerns,
        "summary": {
            "activities_this_week": len(recent_activities),
            "moods_logged": len(recent_moods),
            "active_days": len(days_with_activity)
        }
    }


# ==================== SMART ALERT TOOLS ====================

def send_family_alert(
    tool_context: ToolContext,
    message: str,
    urgency: str = "low",
    category: str = "wellness"
) -> dict:
    """
    Sends a meaningful update to designated family members. Only sends important, non-spam updates.
    
    Args:
        message: The specific detail to share with family
        urgency: 'low', 'medium', 'high', or 'critical'
        category: 'wellness', 'activity', 'health', 'social', 'achievement'
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation that family was notified
    """
    data = _load_data()
    
    alert = {
        "timestamp": _get_current_time(),
        "message": message,
        "urgency": urgency.lower(),
        "category": category.lower(),
        "status": "sent"
    }
    
    if "family_alerts" not in data:
        data["family_alerts"] = []
    
    data["family_alerts"].append(alert)
    _save_data(data)
    
    # In a real implementation, this would trigger actual notifications
    # For now, we log and confirm
    print(f"[FAMILY ALERT] Urgency: {urgency} | Category: {category} | Message: {message}")
    
    return {
        "status": "sent",
        "message": f"I've shared this update with your family: '{message}'",
        "urgency": urgency
    }


def get_family_alerts_history(
    tool_context: ToolContext,
    days: int = 7
) -> dict:
    """
    Gets history of alerts sent to family.
    
    Args:
        days: Number of days to look back
        tool_context: ADK tool context
    
    Returns:
        dict: Alert history
    """
    data = _load_data()
    alerts = data.get("family_alerts", [])
    
    cutoff = datetime.now() - timedelta(days=days)
    
    recent = []
    for a in alerts:
        try:
            if datetime.fromisoformat(a["timestamp"]) >= cutoff:
                recent.append(a)
        except:
            continue
    
    return {
        "status": "success",
        "alerts": recent,
        "count": len(recent)
    }


# ==================== ACTIVITY SUGGESTIONS TOOLS ====================

def get_activity_suggestions(
    tool_context: ToolContext
) -> dict:
    """
    Returns current context (Time, Location, Mood) so the Agent LLM 
    can generate personalized, dynamic suggestions.
    """
    now = datetime.now()
    data = _load_data()
    profile = data.get("user_profile", {})
    moods = data.get("moods", [])
    last_mood = moods[-1]["mood"] if moods else "unknown"
    
    # Instead of static lists, we provide context to the LLM
    return {
        "status": "success",
        "current_time": now.strftime("%I:%M %p"),
        "location": profile.get("location", "Unknown"),
        "user_interests": profile.get("interests", []),
        "last_known_mood": last_mood,
        "instruction": "Based on this context, suggest 3 warm, personlized activities for a senior user."
    }


def get_daily_summary(
    tool_context: ToolContext
) -> dict:
    """
    Generates a summary of the user's day including activities, mood, and expenses.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Daily summary
    """
    data = _load_data()
    today = datetime.now().date().isoformat()
    
    # Today's activities
    activities = data.get("activities", [])
    today_activities = [
        a for a in activities
        if a.get("timestamp", "").startswith(today)
    ]
    
    # Today's moods
    moods = data.get("moods", [])
    today_moods = [
        m for m in moods
        if m.get("timestamp", "").startswith(today)
    ]
    
    # Today's expenses
    expenses = data.get("expenses", [])
    today_expenses = [
        e for e in expenses
        if e.get("timestamp", "").startswith(today)
    ]
    
    total_expenses = sum(e.get("amount", 0) for e in today_expenses)
    total_active_minutes = sum(a.get("duration_minutes", 0) for a in today_activities)
    
    # Determine mood trend
    if today_moods:
        positive = sum(1 for m in today_moods if m.get("mood") in ["happy", "content", "energetic", "grateful"])
        negative = sum(1 for m in today_moods if m.get("mood") in ["sad", "anxious", "lonely", "tired"])
        if positive > negative:
            mood_trend = "positive"
        elif negative > positive:
            mood_trend = "mixed"
        else:
            mood_trend = "stable"
    else:
        mood_trend = "not tracked"
    
    return {
        "status": "success",
        "date": today,
        "mood_trend": mood_trend,
        "activities_count": len(today_activities),
        "total_active_minutes": total_active_minutes,
        "expenses_total": total_expenses,
        "expenses_count": len(today_expenses),
        "summary": f"Today you've been active for {total_active_minutes} minutes with {len(today_activities)} activities. Your mood has been {mood_trend}."
    }


# ==================== LONG-TERM MEMORY TOOLS ====================

def remember_fact(
    tool_context: ToolContext,
    fact: str,
    category: str = "general"
) -> dict:
    """
    Remembers a factual detail about the user for long-term storage.
    Use this when the user mentions something that doesn't fit into other tools.
    e.g., "My grandson's name is Rahul", "I hate spicy food", "I worked as a teacher".
    
    Args:
        fact: The piece of information to remember
        category: 'preference', 'family', 'history', 'general'
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation
    """
    data = _load_data()
    
    if "long_term_memory" not in data:
        data["long_term_memory"] = []
        
    memory = {
        "timestamp": _get_current_time(),
        "fact": fact,
        "category": category
    }
    
    data["long_term_memory"].append(memory)
    _save_data(data)
    
    return {
        "status": "success",
        "message": f"I've made a note of that: {fact}"
    }


def recall_memories(
    tool_context: ToolContext,
    query: str = "",
    category: Optional[str] = None
) -> dict:
    """
    Recalls facts from long-term memory.
    
    Args:
        query: Optional search term
        category: Optional category filter
        tool_context: ADK tool context
    
    Returns:
        dict: List of relevant memories
    """
    data = _load_data()
    memories = data.get("long_term_memory", [])
    
    results = []
    
    for m in memories:
        if category and m.get("category") != category:
            continue
            
        if query and query.lower() not in m.get("fact", "").lower():
            continue
            
        results.append(m)
    
    results.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "status": "success",
        "memories": results,
        "count": len(results)
    }
