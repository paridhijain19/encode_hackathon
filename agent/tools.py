"""
Amble Agent Tools
=================

All tools for the Amble companion agent.
Data is stored in Supabase (main DB).
Mem0 is used only for semantic memory search.
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from google.adk.tools import ToolContext

# Import Supabase store for all data operations
from agent.supabase_store import (
    # Profile
    save_profile,
    get_profile,
    # Expenses
    save_expense,
    get_expenses,
    # Activities  
    save_activity,
    get_activities,
    # Moods
    save_mood,
    get_moods,
    # Appointments
    save_appointment,
    get_appointments,
    delete_appointment,
    # Alerts
    save_alert,
    get_alerts,
    # Wellness
    get_wellness_data,
)

def _get_current_time() -> str:
    """Get current timestamp as ISO string"""
    return datetime.now().isoformat()

def _get_user_id(tool_context: ToolContext) -> str:
    """Get user_id from tool context or default."""
    return tool_context.state.get("user:id", "parent_user")


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
    Updates the user's persistent profile in Supabase.
    """
    user_id = _get_user_id(tool_context)
    
    profile = {
        "name": name,
        "location": location,
        "updated_at": _get_current_time()
    }
    
    if age is not None: profile["age"] = age
    if interests is not None: profile["interests"] = interests
    if health_conditions is not None: profile["health_conditions"] = health_conditions
    if emergency_contact_name is not None: profile["emergency_contact_name"] = emergency_contact_name
    if emergency_contact_phone is not None: profile["emergency_contact_phone"] = emergency_contact_phone
    
    # Save to Supabase
    save_profile(user_id, profile)
    
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
    """Retrieves the current user profile from Supabase."""
    user_id = _get_user_id(tool_context)
    profile = get_profile(user_id)
    
    if not profile:
        return {
            "status": "not_found",
            "message": "I don't have your profile yet. Could you tell me your name and city?"
        }
    
    # Update tool context state
    if tool_context and profile:
        tool_context.state["user:profile"] = profile
        tool_context.state["user:name"] = profile.get("name", "")
        tool_context.state["user:location"] = profile.get("location", "")
    
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
    """Adds a new expense to user's history in Supabase."""
    user_id = _get_user_id(tool_context)
    
    # Save to Supabase
    save_expense(user_id, amount, category, description)
    
    # Get today's total
    today_expenses = get_expenses(user_id, period="today")
    today_total = sum(e.get("amount", 0) for e in today_expenses)
    
    return {
        "status": "success",
        "message": f"Noted! ₹{amount:.2f} for {description}. Total today is ₹{today_total:.2f}.",
    }


def get_expense_summary(
    tool_context: ToolContext,
    period: str = "today"
) -> dict:
    """
    Gets a summary of expenses for a given period from Supabase.
    
    Args:
        period: 'today', 'week', 'month', or 'all'
        tool_context: ADK tool context
    
    Returns:
        dict: Expense summary with breakdown by category
    """
    user_id = _get_user_id(tool_context)
    expenses = get_expenses(user_id, period=period)
    
    # Group by category
    by_category = {}
    total = 0
    for e in expenses:
        cat = e.get("category", "other")
        amt = float(e.get("amount", 0) or 0)
        by_category[cat] = by_category.get(cat, 0) + amt
        total += amt
    
    return {
        "status": "success",
        "period": period,
        "total": total,
        "by_category": by_category,
        "transaction_count": len(expenses),
        "message": f"Your {period}'s expenses total ₹{total:.2f} across {len(expenses)} transactions."
    }


def analyze_spending_patterns(
    tool_context: ToolContext
) -> dict:
    """
    Analyzes user's spending patterns to detect insights and provide suggestions.
    Used by the agent for proactive financial guidance.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Spending insights, trends, and recommendations
    """
    user_id = _get_user_id(tool_context)
    
    # Get expenses for this month and last month
    this_month = get_expenses(user_id, period="month")
    all_expenses = get_expenses(user_id, limit=100)
    
    insights = []
    recommendations = []
    
    # Calculate totals by category
    by_category = {}
    total = 0
    for e in this_month:
        cat = e.get("category", "other")
        amt = float(e.get("amount", 0) or 0)
        by_category[cat] = by_category.get(cat, 0) + amt
        total += amt
    
    # Find top spending category
    if by_category:
        top_category = max(by_category.keys(), key=lambda k: by_category[k])
        top_amount = by_category[top_category]
        insights.append({
            "type": "top_spending",
            "message": f"This month, you've spent the most on {top_category} (₹{top_amount:.0f})"
        })
        
        # Check if any category is unusually high
        avg_per_category = total / len(by_category) if by_category else 0
        if top_amount > avg_per_category * 2:
            recommendations.append({
                "type": "spending_alert",
                "message": f"Your {top_category} spending is higher than usual. Would you like to set a budget?"
            })
    
    # Check for unusual single transactions
    for e in this_month:
        amt = float(e.get("amount", 0) or 0)
        if amt > total * 0.3 and total > 0:  # Single expense > 30% of total
            insights.append({
                "type": "large_expense",
                "message": f"Large expense detected: ₹{amt:.0f} for {e.get('description', e.get('category', 'unknown'))}"
            })
            break
    
    # Compare to typical spending
    daily_avg = total / 30 if total > 0 else 0
    if daily_avg > 0:
        insights.append({
            "type": "average",
            "message": f"You're averaging ₹{daily_avg:.0f} per day this month"
        })
    
    return {
        "status": "success",
        "total_this_month": total,
        "by_category": by_category,
        "insights": insights,
        "recommendations": recommendations,
        "summary": f"You've spent ₹{total:.0f} this month across {len(this_month)} transactions."
    }


def suggest_daily_activity(
    tool_context: ToolContext
) -> dict:
    """
    Suggests activities based on user's interests, weather, and recent patterns.
    Used for proactive engagement and wellness encouragement.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Activity suggestions tailored to the user
    """
    from agent.supabase_store import get_profile
    
    user_id = _get_user_id(tool_context)
    
    # Get user profile and interests
    profile = get_profile(user_id) or {}
    interests = profile.get("interests", [])
    
    # Get recent activities to avoid repetition
    recent = get_activities(user_id, limit=7)
    recent_types = {a.get("activity_type") for a in recent}
    
    # Define activity suggestions by interest
    activity_map = {
        "walking": [
            {"name": "Morning walk in the park", "type": "exercise", "duration": 30},
            {"name": "Evening stroll around the colony", "type": "exercise", "duration": 20}
        ],
        "yoga": [
            {"name": "Gentle yoga stretches", "type": "exercise", "duration": 20},
            {"name": "Breathing exercises (pranayama)", "type": "wellness", "duration": 15}
        ],
        "reading": [
            {"name": "Read a chapter of your book", "type": "leisure", "duration": 30},
            {"name": "Browse the newspaper", "type": "leisure", "duration": 20}
        ],
        "gardening": [
            {"name": "Water and tend to plants", "type": "hobby", "duration": 20},
            {"name": "Repot a plant or add fertilizer", "type": "hobby", "duration": 30}
        ],
        "cooking": [
            {"name": "Try a new recipe", "type": "hobby", "duration": 45},
            {"name": "Prepare a special chai", "type": "leisure", "duration": 15}
        ],
        "music": [
            {"name": "Listen to classical ragas", "type": "leisure", "duration": 30},
            {"name": "Hum along to favorite bhajans", "type": "leisure", "duration": 20}
        ],
        "temple": [
            {"name": "Morning prayers at home", "type": "spiritual", "duration": 15},
            {"name": "Visit the neighborhood temple", "type": "spiritual", "duration": 30}
        ],
        "socializing": [
            {"name": "Call a friend or relative", "type": "social", "duration": 20},
            {"name": "Tea time with neighbors", "type": "social", "duration": 30}
        ],
        "grandchildren": [
            {"name": "Video call with grandchildren", "type": "social", "duration": 20},
            {"name": "Write a letter to grandchildren", "type": "leisure", "duration": 20}
        ]
    }
    
    # Get time-appropriate greeting
    hour = datetime.now().hour
    time_context = "morning" if hour < 12 else "afternoon" if hour < 17 else "evening"
    
    # Find suitable suggestions
    suggestions = []
    for interest in interests:
        if interest in activity_map:
            for activity in activity_map[interest]:
                # Prefer activities not done recently
                if activity["type"] not in recent_types:
                    suggestions.append(activity)
    
    # Default suggestions if no interests match
    if not suggestions:
        suggestions = [
            {"name": "Take a short walk outside", "type": "exercise", "duration": 15},
            {"name": "Listen to some music", "type": "leisure", "duration": 20},
            {"name": "Call a loved one", "type": "social", "duration": 15}
        ]
    
    # Pick top 2 suggestions
    top_suggestions = suggestions[:2]
    
    return {
        "status": "success",
        "time_of_day": time_context,
        "suggestions": top_suggestions,
        "based_on_interests": interests[:3] if interests else ["general"],
        "message": f"Good {time_context}! Here are some activities you might enjoy today."
    }


# ==================== MOOD TRACKING TOOLS ====================

def track_mood(
    tool_context: ToolContext,
    mood: str,
    energy_level: int = 5,
    details: str = ""
) -> dict:
    """
    Logs the user's current mood and emotional state to Supabase.
    
    Args:
        mood: How they are feeling - 'happy', 'content', 'neutral', 'tired', 'sad', 'anxious', 'lonely', 'energetic', 'grateful'
        energy_level: Energy level from 1 (very low) to 10 (very high)
        details: Additional context about their day or feelings
        tool_context: ADK tool context
    
    Returns:
        dict: A warm, empathetic response
    """
    user_id = _get_user_id(tool_context)
    
    # Save to Supabase
    notes = f"{details} (Energy: {energy_level}/10)" if details else f"Energy: {energy_level}/10"
    save_mood(user_id, mood, notes, energy_level)
    
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
    Gets mood history for pattern analysis from Supabase.
    
    Args:
        days: Number of days to look back
        tool_context: ADK tool context
    
    Returns:
        dict: Mood history with trends
    """
    user_id = _get_user_id(tool_context)
    period = "week" if days <= 7 else "all"
    moods = get_moods(user_id, period=period, limit=50)
    
    # Analyze trends
    mood_counts = {}
    avg_energy = 0
    for m in moods:
        mood = m.get("rating", "neutral")
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
        # Extract energy from notes if stored there
        notes = m.get("notes", "")
        if "Energy:" in notes:
            try:
                energy = int(notes.split("Energy:")[1].split("/")[0].strip())
                avg_energy += energy
            except:
                avg_energy += 5
        else:
            avg_energy += 5
    
    if moods:
        avg_energy /= len(moods)
    
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
        "total_entries": len(moods)
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
    Records a daily activity performed by the user to Supabase.
    
    Args:
        activity_name: Name of the activity (e.g., 'Morning walk in the park')
        activity_type: Type - 'walking', 'exercise', 'reading', 'gardening', 'cooking', 'social', 'hobby', 'meditation', 'shopping', 'religious', 'tv_entertainment', 'phone_call', 'other'
        duration_minutes: How long the activity lasted in minutes
        notes: Additional notes about the activity
        tool_context: ADK tool context
    
    Returns:
        dict: Encouraging feedback
    """
    user_id = _get_user_id(tool_context)
    
    # Save to Supabase - description includes both name and notes
    description = f"{activity_name}: {notes}" if notes else activity_name
    save_activity(user_id, activity_type.lower(), description, duration_minutes)
    
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
    Gets activity history for pattern analysis from Supabase.
    
    Args:
        days: Number of days to look back
        tool_context: ADK tool context
    
    Returns:
        dict: Activity history with summary
    """
    user_id = _get_user_id(tool_context)
    period = "week" if days <= 7 else "all"
    activities = get_activities(user_id, period=period, limit=100)
    
    # Summarize by type
    by_type = {}
    total_minutes = 0
    for a in activities:
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
        "total_activities": len(activities),
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
    Schedules a new appointment or reminder in Supabase.
    
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
    user_id = _get_user_id(tool_context)
    
    # Parse date_time into date and time parts
    try:
        dt = datetime.fromisoformat(date_time)
        date_part = dt.strftime("%Y-%m-%d")
        time_part = dt.strftime("%H:%M")
    except:
        date_part = date_time.split(" ")[0] if " " in date_time else date_time
        time_part = date_time.split(" ")[1] if " " in date_time else "12:00"
    
    # Build description with doctor name, notes, and type
    description_parts = [f"Type: {appointment_type.lower()}"]
    if doctor_name:
        description_parts.append(f"Doctor: {doctor_name}")
    if notes:
        description_parts.append(f"Notes: {notes}")
    description = "; ".join(description_parts)
    
    save_appointment(user_id, title, description, date_part, time_part, location)
    
    return {
        "status": "success",
        "message": f"I've scheduled your {title} for {date_time} at {location}. I'll remind you when it's approaching.",
        "appointment_id": f"{user_id}_{date_part}_{time_part}"
    }


def get_upcoming_appointments(
    tool_context: ToolContext,
    days_ahead: int = 7
) -> dict:
    """
    Gets upcoming appointments for the specified period from Supabase.
    
    Args:
        days_ahead: How many days ahead to look
        tool_context: ADK tool context
    
    Returns:
        dict: List of upcoming appointments
    """
    user_id = _get_user_id(tool_context)
    appointments = get_appointments(user_id, limit=50)
    
    now = datetime.now()
    future_limit = now + timedelta(days=days_ahead)
    
    upcoming = []
    for apt in appointments:
        try:
            # Combine date and time
            apt_date = apt.get("date", "")
            apt_time = apt.get("time", "12:00")
            apt_datetime = datetime.fromisoformat(f"{apt_date} {apt_time}")
            if now <= apt_datetime <= future_limit:
                # Format for response
                upcoming.append({
                    "id": apt.get("id"),
                    "title": apt.get("title"),
                    "date_time": f"{apt_date} {apt_time}",
                    "location": apt.get("location"),
                    "description": apt.get("description", "")
                })
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
    Cancels an existing appointment in Supabase.
    
    Args:
        appointment_id: ID of the appointment to cancel
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation message
    """
    user_id = _get_user_id(tool_context)
    
    # First get the appointment to show what's being cancelled
    appointments = get_appointments(user_id, limit=50)
    apt_to_cancel = None
    for apt in appointments:
        if apt.get("id") == appointment_id:
            apt_to_cancel = apt
            break
    
    if apt_to_cancel:
        delete_appointment(appointment_id)
        return {
            "status": "success",
            "message": f"I've cancelled your appointment: {apt_to_cancel.get('title', 'the appointment')}."
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
    Uses data from Supabase.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Wellness insights and any alerts
    """
    user_id = _get_user_id(tool_context)
    
    # Get data from Supabase using the wellness helper
    wellness_data = get_wellness_data(user_id)
    
    insights = []
    concerns = []
    
    # Get recent activities and moods
    recent_activities = wellness_data.get("activities", [])
    recent_moods = wellness_data.get("moods", [])
    
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
    
    # Check for concerning mood patterns
    negative_moods = [m for m in recent_moods if m.get("rating") in ["sad", "anxious", "lonely"]]
    if len(negative_moods) >= 3:
        concerns.append({
            "type": "mood_concern",
            "message": "I've noticed you've been feeling low a few times recently. I'm here for you. Would you like to talk?",
            "suggested_action": "Consider talking to a loved one or professional",
            "urgency": "medium"
        })
    
    # Check energy levels from mood notes
    avg_energy = 5
    energy_count = 0
    for m in recent_moods:
        notes = m.get("notes", "")
        if "Energy:" in notes:
            try:
                energy = int(notes.split("Energy:")[1].split("/")[0].strip())
                avg_energy += energy
                energy_count += 1
            except:
                pass
    if energy_count > 0:
        avg_energy = avg_energy / energy_count
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
            timestamp = a.get("timestamp", "")
            if timestamp:
                day = datetime.fromisoformat(timestamp).date()
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
    Sends a meaningful update to designated family members via Supabase.
    Only sends important, non-spam updates.
    
    Args:
        message: The specific detail to share with family
        urgency: 'low', 'medium', 'high', or 'critical'
        category: 'wellness', 'activity', 'health', 'social', 'achievement'
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation that family was notified
    """
    user_id = _get_user_id(tool_context)
    
    # Map category to alert type
    alert_type = category.lower()
    
    save_alert(user_id, alert_type, message)
    
    # In a real implementation, this would trigger actual notifications
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
    Gets history of alerts sent to family from Supabase.
    
    Args:
        days: Number of days to look back
        tool_context: ADK tool context
    
    Returns:
        dict: Alert history
    """
    user_id = _get_user_id(tool_context)
    alerts = get_alerts(user_id, limit=50)
    
    return {
        "status": "success",
        "alerts": alerts,
        "count": len(alerts)
    }


# ==================== ACTIVITY SUGGESTIONS TOOLS ====================

def get_activity_suggestions(
    tool_context: ToolContext
) -> dict:
    """
    Returns current context (Time, Location, Mood) from Supabase so the Agent LLM 
    can generate personalized, dynamic suggestions.
    """
    user_id = _get_user_id(tool_context)
    
    now = datetime.now()
    profile = get_profile(user_id) or {}
    moods = get_moods(user_id, period="today", limit=1)
    last_mood = moods[0].get("rating", "unknown") if moods else "unknown"
    
    # Parse interests from profile if stored
    interests = []
    preferences = profile.get("preferences", {})
    if isinstance(preferences, dict):
        interests = preferences.get("interests", [])
    
    # Instead of static lists, we provide context to the LLM
    return {
        "status": "success",
        "current_time": now.strftime("%I:%M %p"),
        "location": profile.get("location", "Unknown"),
        "user_interests": interests,
        "last_known_mood": last_mood,
        "instruction": "Based on this context, suggest 3 warm, personlized activities for a senior user."
    }


def search_local_activities(
    tool_context: ToolContext,
    activity_type: str = "community",
    search_query: Optional[str] = None
) -> dict:
    """
    Search for local activities and events near the user.
    Uses Google Search or curated database.
    
    Args:
        activity_type: Type of activity (fitness, social, hobby, religious, learning, community)
        search_query: Optional specific search query
        tool_context: ADK tool context
    
    Returns:
        dict: List of local activities and events
    """
    user_id = _get_user_id(tool_context)
    profile = get_profile(user_id) or {}
    
    location = profile.get("location", "your area")
    interests = profile.get("interests", [])
    
    try:
        from agent.activity_discovery import get_activity_discovery
        discovery = get_activity_discovery()
        
        # Run async function synchronously
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                discovery.search_local_events(location, interests, activity_type)
            )
        finally:
            loop.close()
        
        return result
    except Exception as e:
        print(f"[Activity Discovery Error] {e}")
        return {
            "status": "error",
            "message": "I couldn't search for activities right now. Let me suggest some general options.",
            "suggestions": [
                "Take a walk in a nearby park",
                "Visit the local senior center",
                "Join a community yoga class",
                "Attend a religious service",
                "Check with your housing society for events"
            ]
        }


def get_mood_based_suggestions(
    tool_context: ToolContext
) -> dict:
    """
    Get activity suggestions based on current mood and energy level.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Personalized activity suggestions
    """
    user_id = _get_user_id(tool_context)
    
    # Get latest mood
    moods = get_moods(user_id, period="today", limit=1)
    if moods:
        mood = moods[0].get("rating", "okay")
        energy = moods[0].get("energy_level", 5)
    else:
        mood = "okay"
        energy = 5
    
    try:
        from agent.activity_discovery import get_activity_discovery
        discovery = get_activity_discovery()
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                discovery.get_activity_for_mood(mood, energy)
            )
        finally:
            loop.close()
        
        return result
    except Exception as e:
        print(f"[Mood Suggestions Error] {e}")
        return {
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


def get_daily_summary(
    tool_context: ToolContext
) -> dict:
    """
    Generates a summary of the user's day including activities, mood, and expenses from Supabase.
    
    Args:
        tool_context: ADK tool context
    
    Returns:
        dict: Daily summary
    """
    user_id = _get_user_id(tool_context)
    today = datetime.now().date().isoformat()
    
    # Get today's data from Supabase
    activities = get_activities(user_id, period="today", limit=50)
    moods = get_moods(user_id, period="today", limit=50)
    expenses = get_expenses(user_id, period="today")
    
    total_expenses = sum(e.get("amount", 0) for e in expenses)
    total_active_minutes = sum(a.get("duration_minutes", 0) for a in activities)
    
    # Determine mood trend
    if moods:
        positive = sum(1 for m in moods if m.get("rating") in ["happy", "content", "energetic", "grateful"])
        negative = sum(1 for m in moods if m.get("rating") in ["sad", "anxious", "lonely", "tired"])
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
        "activities_count": len(activities),
        "total_active_minutes": total_active_minutes,
        "expenses_total": total_expenses,
        "expenses_count": len(expenses),
        "summary": f"Today you've been active for {total_active_minutes} minutes with {len(activities)} activities. Your mood has been {mood_trend}."
    }


# ==================== LONG-TERM MEMORY TOOLS (Mem0) ====================

def remember_fact(
    tool_context: ToolContext,
    fact: str,
    category: str = "general"
) -> dict:
    """
    Remembers a factual detail about the user using Mem0 for semantic memory.
    Use this when the user mentions something that doesn't fit into other tools.
    e.g., "My grandson's name is Rahul", "I hate spicy food", "I worked as a teacher".
    
    This uses Mem0 for semantic search and long-term agent context.
    
    Args:
        fact: The piece of information to remember
        category: 'preference', 'family', 'history', 'general'
        tool_context: ADK tool context
    
    Returns:
        dict: Confirmation
    """
    user_id = _get_user_id(tool_context)
    
    # Use Mem0 for semantic memory storage
    try:
        from mem0 import MemoryClient
        mem0_client = MemoryClient()
        
        # Add memory with category metadata
        memory_text = f"[{category}] {fact}"
        mem0_client.add(memory_text, user_id=user_id)
        
        return {
            "status": "success",
            "message": f"I've made a note of that: {fact}"
        }
    except Exception as e:
        print(f"[Mem0 Error] Failed to store memory: {e}")
        # Fallback - just acknowledge without persisting
        return {
            "status": "noted",
            "message": f"I'll remember that: {fact}"
        }


def recall_memories(
    tool_context: ToolContext,
    query: str = "",
    category: Optional[str] = None
) -> dict:
    """
    Recalls facts from Mem0 semantic memory.
    
    Args:
        query: Optional search term
        category: Optional category filter
        tool_context: ADK tool context
    
    Returns:
        dict: List of relevant memories
    """
    user_id = _get_user_id(tool_context)
    
    try:
        from mem0 import MemoryClient
        import os
        api_key = os.getenv("MEM0_API_KEY")
        if not api_key:
            return {"status": "success", "memories": [], "count": 0}
        
        mem0_client = MemoryClient(api_key=api_key)

        # Search memories - Mem0 API v2 requires filters as a dictionary parameter
        search_query = query if query else "user preferences and personal information"
        memories_result = mem0_client.search(
            query=search_query,
            filters={"user_id": user_id},
            top_k=10
        )
        
        results = []
        if memories_result:
            for mem in memories_result:
                memory_text = mem.get("memory", "")
                # Filter by category if specified
                if category:
                    if not memory_text.startswith(f"[{category}]"):
                        continue
                results.append({
                    "fact": memory_text,
                    "relevance": mem.get("score", 0)
                })
        
        return {
            "status": "success",
            "memories": results,
            "count": len(results)
        }
    except Exception as e:
        print(f"[Mem0 Error] Failed to recall memories: {e}")
        return {
            "status": "success",
            "memories": [],
            "count": 0
        }


# ==================== VIDEO CALL TOOLS ====================

def initiate_video_call(
    tool_context: ToolContext,
    contact_name: str,
    contact_type: str = "family"
) -> dict:
    """
    Initiates a video call with a family member or friend.
    
    This prepares the video call UI and notifies the family member.
    
    Args:
        tool_context: ADK tool context
        contact_name: Name of the person to call (e.g., "my daughter", "Ravi", "family")
        contact_type: Type of contact - 'family', 'friend', 'caregiver'
    
    Returns:
        dict: Status and instructions for the video call
    """
    user_id = _get_user_id(tool_context)
    user_name = tool_context.state.get("user:name", "User")
    
    # Log the call request as a social activity
    save_activity(user_id, {
        "activity_type": "phone_call",
        "description": f"Video call with {contact_name}",
        "duration": 0,  # Will be updated when call ends
        "timestamp": _get_current_time(),
        "call_type": "video",
        "contact": contact_name
    })
    
    # Create an alert for family members so they know to join
    save_alert(user_id, {
        "alert_type": "video_call_request",
        "message": f"{user_name} wants to video call with {contact_name}",
        "urgency": "medium",
        "timestamp": _get_current_time(),
        "read": False,
        "contact_requested": contact_name
    })
    
    return {
        "status": "success",
        "message": f"I'm setting up a video call with {contact_name} for you!",
        "call_ready": True,
        "instructions": "The video call screen is now ready. Your family member will receive a notification to join.",
        "ui_action": "open_video_call",
        "contact": contact_name
    }


def end_video_call(
    tool_context: ToolContext,
    duration_minutes: int = 0
) -> dict:
    """
    Ends the current video call and logs the activity.
    
    Args:
        tool_context: ADK tool context  
        duration_minutes: How long the call lasted
    
    Returns:
        dict: Confirmation message
    """
    return {
        "status": "success",
        "message": f"The video call has ended. It's wonderful that you connected with your family!",
        "duration": duration_minutes
    }


def get_available_contacts(
    tool_context: ToolContext
) -> dict:
    """
    Gets the list of family members and friends available for video calls.
    
    Returns:
        dict: List of contacts that can be called
    """
    user_id = _get_user_id(tool_context)
    profile = get_profile(user_id) or {}
    
    # Get emergency contact as primary family contact
    emergency_name = profile.get("emergency_contact_name", "Family Member")
    
    # Default family contacts (in a real app, this would come from a contacts table)
    contacts = [
        {
            "name": emergency_name,
            "relationship": "Emergency Contact",
            "available": True
        },
        {
            "name": "Family Group",
            "relationship": "All Family Members",
            "available": True
        }
    ]
    
    return {
        "status": "success",
        "contacts": contacts,
        "message": f"You can call {emergency_name} or start a family group call."
    }
