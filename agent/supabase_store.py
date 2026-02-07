"""
Supabase Data Store for Amble
==============================

Main database layer for ALL persistent data.
Replaces data.json completely.

Tables used (from Supabase):
- users: User accounts
- profiles: User profiles with preferences
- expenses: Expense tracking
- activities: Activity logging
- moods: Mood tracking
- appointments: Scheduled appointments
- alerts: Family alerts
- sessions: ADK session mappings
- chat_history: Conversation history

Mem0 is used ONLY for semantic memory search (agent context).
"""

import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (parent of agent folder)
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

# ==================== SUPABASE CLIENT ====================

_supabase_client = None

def get_supabase_client():
    """Get or create Supabase client (singleton)."""
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env")
    
    try:
        from supabase import create_client
        _supabase_client = create_client(url, key)
        print("[OK] Supabase client initialized")
        return _supabase_client
    except Exception as e:
        raise RuntimeError(f"Failed to initialize Supabase: {e}")


def _get_client():
    """Internal helper to get client."""
    return get_supabase_client()


# ==================== USER MANAGEMENT ====================

AVATAR_OPTIONS = {
    'parent': ['👵', '👴', '👵🏽', '👴🏽', '👵🏿', '👴🏿'],
    'family': ['👩', '👨', '👧', '👦', '👩🏽', '👨🏽']
}

def _pick_avatar(role: str, index: int = 0) -> str:
    """Pick an avatar based on role and index."""
    options = AVATAR_OPTIONS.get(role, AVATAR_OPTIONS['family'])
    return options[index % len(options)]


def register_user(user_id: str, name: str, role: str = "elder", avatar: str = None, relation: str = None) -> Dict[str, Any]:
    """
    Register a new user in the user_profiles table.
    Returns the created user dict.
    """
    client = _get_client()
    
    if not avatar:
        avatar = _pick_avatar('parent' if role in ('parent', 'elder') else 'family')
    
    # Normalize role
    db_role = 'parent' if role in ('parent', 'elder') else role
    
    profile_data = {
        "user_id": user_id,
        "name": name,
        "preferences": {
            "role": db_role,
            "avatar": avatar,
            "relation": relation,
        },
    }
    
    try:
        client.table("user_profiles").upsert(
            profile_data, on_conflict="user_id"
        ).execute()
        
        return {
            "id": user_id,
            "name": name,
            "role": db_role,
            "avatar": avatar,
            "relation": relation,
        }
    except Exception as e:
        print(f"[WARN] Failed to register user: {e}")
        return {"id": user_id, "name": name, "role": db_role, "avatar": avatar}


def list_users(role: str = None) -> List[Dict[str, Any]]:
    """
    List all registered users from user_profiles table.
    Optionally filter by role (stored in preferences->role).
    """
    client = _get_client()
    
    try:
        result = client.table("user_profiles").select("*").order("created_at").execute()
        
        users = []
        for row in (result.data or []):
            prefs = row.get("preferences") or {}
            user_role = prefs.get("role", "parent")
            
            if role and user_role != role:
                continue
            
            users.append({
                "id": row["user_id"],
                "name": row.get("name") or row["user_id"],
                "role": user_role,
                "avatar": prefs.get("avatar", "👤"),
                "relation": prefs.get("relation"),
                "location": row.get("location"),
            })
        
        return users
    except Exception as e:
        print(f"[WARN] Failed to list users: {e}")
        return []


def get_or_create_user(user_id: str, name: str = None, role: str = "elder") -> Dict[str, Any]:
    """
    Get existing user or create new one.
    Uses user_id as the unique identifier (e.g., 'parent_user', 'family_sarah').
    """
    profile = get_profile(user_id)
    if profile:
        prefs = profile.get("preferences") or {}
        return {
            "id": user_id,
            "name": profile.get("name") or name or user_id,
            "role": prefs.get("role", role),
            "avatar": prefs.get("avatar", "👤"),
        }
    
    # Create new user
    return register_user(user_id, name or user_id, role)


# ==================== SESSION MANAGEMENT ====================

_sessions_cache: Dict[str, str] = {}

def save_session(user_id: str, session_id: str) -> bool:
    """Save session mapping to Supabase."""
    _sessions_cache[user_id] = session_id
    client = _get_client()
    
    try:
        client.table("sessions").upsert({
            "user_id": user_id,
            "session_id": session_id,
            "updated_at": datetime.now().isoformat()
        }, on_conflict="user_id").execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save session: {e}")
        return False


def get_session(user_id: str) -> Optional[str]:
    """Get session ID for user."""
    if user_id in _sessions_cache:
        return _sessions_cache[user_id]
    
    client = _get_client()
    try:
        result = client.table("sessions").select("session_id").eq("user_id", user_id).execute()
        if result.data and len(result.data) > 0:
            session_id = result.data[0]["session_id"]
            _sessions_cache[user_id] = session_id
            return session_id
    except Exception as e:
        print(f"[WARN] Failed to get session: {e}")
    
    return None


def delete_session(user_id: str) -> bool:
    """Delete session for user."""
    _sessions_cache.pop(user_id, None)
    client = _get_client()
    
    try:
        client.table("sessions").delete().eq("user_id", user_id).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to delete session: {e}")
        return False


# ==================== PROFILE MANAGEMENT ====================

def save_profile(user_id: str, profile: Dict[str, Any]) -> bool:
    """Save user profile to Supabase (user_profiles table)."""
    client = _get_client()
    
    try:
        # Check if profile exists in user_profiles table
        result = client.table("user_profiles").select("id").eq("user_id", user_id).execute()
        
        profile_data = {
            "user_id": user_id,
            "name": profile.get("name"),
            "location": profile.get("location"),
            "preferences": {
                "age": profile.get("age"),
                "interests": profile.get("interests", []),
                "health_conditions": profile.get("health_conditions", []),
                "emergency_contact_name": profile.get("emergency_contact_name"),
                "emergency_contact_phone": profile.get("emergency_contact_phone"),
                "onboarded": True
            },
            "updated_at": datetime.now().isoformat()
        }
        
        if result.data and len(result.data) > 0:
            # Update existing
            client.table("user_profiles").update(profile_data).eq("user_id", user_id).execute()
        else:
            # Insert new
            client.table("user_profiles").insert(profile_data).execute()
        
        return True
    except Exception as e:
        print(f"[WARN] Failed to save profile: {e}")
        return False


def get_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user profile from Supabase (user_profiles table)."""
    client = _get_client()
    
    try:
        # Get profile from user_profiles table
        result = client.table("user_profiles").select("*").eq("user_id", user_id).execute()
        
        if result.data and len(result.data) > 0:
            profile = result.data[0]
            # Flatten preferences into top level for easier access
            if profile.get("preferences"):
                prefs = profile["preferences"]
                if isinstance(prefs, dict):
                    profile["age"] = prefs.get("age")
                    profile["interests"] = prefs.get("interests", [])
                    profile["health_conditions"] = prefs.get("health_conditions", [])
            return profile
        
    except Exception as e:
        print(f"[WARN] Failed to get profile: {e}")
    
    return None


# ==================== EXPENSE TRACKING ====================

def save_expense(user_id: str, amount: float, category: str, description: str, date: str = None) -> bool:
    """Save expense to Supabase."""
    client = _get_client()
    
    try:
        expense_data = {
            "user_id": user_id,
            "amount": amount,
            "category": category.lower(),
            "description": description,
            "date": date or datetime.now().date().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        client.table("expenses").insert(expense_data).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save expense: {e}")
        return False


def get_expenses(user_id: str, period: str = "all", limit: int = 50) -> List[Dict[str, Any]]:
    """Get expenses for user from Supabase."""
    client = _get_client()
    
    try:
        query = client.table("expenses").select("*").eq("user_id", user_id)
        
        # Filter by period
        now = datetime.now()
        if period == "today":
            cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            query = query.gte("created_at", cutoff)
        elif period == "week":
            cutoff = (now - timedelta(days=7)).isoformat()
            query = query.gte("created_at", cutoff)
        elif period == "month":
            cutoff = (now - timedelta(days=30)).isoformat()
            query = query.gte("created_at", cutoff)
        
        result = query.order("created_at", desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get expenses: {e}")
        return []


# ==================== ACTIVITY TRACKING ====================

def save_activity(user_id: str, activity_type: str, description: str, duration_minutes: int = None) -> bool:
    """Save activity to Supabase."""
    client = _get_client()
    
    try:
        activity_data = {
            "user_id": user_id,
            "activity_type": activity_type.lower(),
            "description": description,
            "duration_minutes": duration_minutes,
            "timestamp": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat()
        }
        client.table("activities").insert(activity_data).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save activity: {e}")
        return False


def get_activities(user_id: str, period: str = "all", limit: int = 50) -> List[Dict[str, Any]]:
    """Get activities for user from Supabase."""
    client = _get_client()
    
    try:
        query = client.table("activities").select("*").eq("user_id", user_id)
        
        now = datetime.now()
        if period == "today":
            cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            query = query.gte("timestamp", cutoff)
        elif period == "week":
            cutoff = (now - timedelta(days=7)).isoformat()
            query = query.gte("timestamp", cutoff)
        
        result = query.order("timestamp", desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get activities: {e}")
        return []


# ==================== MOOD TRACKING ====================

def save_mood(user_id: str, rating: str, notes: str = None, energy_level: int = None) -> bool:
    """Save mood entry to Supabase."""
    client = _get_client()
    
    try:
        mood_data = {
            "user_id": user_id,
            "rating": rating.lower(),
            "notes": notes,
            "timestamp": datetime.now().isoformat()
        }
        client.table("moods").insert(mood_data).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save mood: {e}")
        return False


def get_moods(user_id: str, period: str = "all", limit: int = 20) -> List[Dict[str, Any]]:
    """Get mood history for user from Supabase."""
    client = _get_client()
    
    try:
        query = client.table("moods").select("*").eq("user_id", user_id)
        
        now = datetime.now()
        if period == "today":
            cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
            query = query.gte("timestamp", cutoff)
        elif period == "week":
            cutoff = (now - timedelta(days=7)).isoformat()
            query = query.gte("timestamp", cutoff)
        
        result = query.order("timestamp", desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get moods: {e}")
        return []


# ==================== APPOINTMENTS ====================

def save_appointment(user_id: str, title: str, description: str, date: str, time: str, location: str = None) -> bool:
    """Save appointment to Supabase."""
    client = _get_client()
    
    try:
        appt_data = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "date": date,
            "time": time,
            "location": location,
            "reminded": False,
            "created_at": datetime.now().isoformat()
        }
        client.table("appointments").insert(appt_data).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save appointment: {e}")
        return False


def get_appointments(user_id: str, upcoming_only: bool = True, limit: int = 20) -> List[Dict[str, Any]]:
    """Get appointments for user from Supabase."""
    client = _get_client()
    
    try:
        query = client.table("appointments").select("*").eq("user_id", user_id)
        
        if upcoming_only:
            today = datetime.now().date().isoformat()
            query = query.gte("date", today)
        
        result = query.order("date").order("time").limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get appointments: {e}")
        return []


def delete_appointment(user_id: str, appointment_id: str = None, title: str = None) -> bool:
    """Delete appointment from Supabase."""
    client = _get_client()
    
    try:
        query = client.table("appointments").delete().eq("user_id", user_id)
        if appointment_id:
            query = query.eq("id", appointment_id)
        elif title:
            query = query.ilike("title", f"%{title}%")
        else:
            return False
        query.execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to delete appointment: {e}")
        return False


# ==================== ALERTS ====================

def save_alert(user_id: str, alert_type: str, message: str) -> bool:
    """Save family alert to Supabase."""
    client = _get_client()
    
    try:
        alert_data = {
            "user_id": user_id,
            "type": alert_type,
            "message": message,
            "read": False,
            "timestamp": datetime.now().isoformat()
        }
        client.table("alerts").insert(alert_data).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save alert: {e}")
        return False


def get_alerts(user_id: str, unread_only: bool = False, limit: int = 50) -> List[Dict[str, Any]]:
    """Get alerts for user from Supabase."""
    client = _get_client()
    
    try:
        query = client.table("alerts").select("*").eq("user_id", user_id)
        
        if unread_only:
            query = query.eq("read", False)
        
        result = query.order("timestamp", desc=True).limit(limit).execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get alerts: {e}")
        return []


def mark_alert_read(alert_id: str) -> bool:
    """Mark alert as read."""
    client = _get_client()
    
    try:
        client.table("alerts").update({"read": True}).eq("id", alert_id).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to mark alert read: {e}")
        return False


# ==================== CHAT HISTORY ====================

def save_chat(user_id: str, session_id: str, user_message: str, agent_response: str) -> bool:
    """Save chat message to Supabase."""
    client = _get_client()
    
    try:
        chat_data = {
            "user_id": user_id,
            "session_id": session_id,
            "user_message": user_message,
            "agent_response": agent_response,
            "created_at": datetime.now().isoformat()
        }
        client.table("chat_history").insert(chat_data).execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to save chat: {e}")
        return False


def get_chat_history(user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
    """Get chat history for user from Supabase."""
    client = _get_client()
    
    try:
        result = client.table("chat_history") \
            .select("*") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(limit) \
            .execute()
        
        # Return in chronological order
        return list(reversed(result.data)) if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get chat history: {e}")
        return []


# ==================== FAMILY DATA (for family dashboard) ====================

def get_family_summary(elder_user_id: str) -> Dict[str, Any]:
    """Get comprehensive summary for family dashboard."""
    try:
        # Get profile
        profile = get_profile(elder_user_id) or {}
        
        # Get recent data
        activities = get_activities(elder_user_id, period="week", limit=20)
        expenses = get_expenses(elder_user_id, period="month", limit=30)
        moods = get_moods(elder_user_id, period="week", limit=10)
        appointments = get_appointments(elder_user_id, upcoming_only=True, limit=5)
        alerts = get_alerts(elder_user_id, limit=10)
        
        # Calculate totals
        total_expenses = sum(float(e.get("amount", 0) or 0) for e in expenses)
        unread_alerts = len([a for a in alerts if not a.get("read")])
        
        # Get last interaction
        chats = get_chat_history(elder_user_id, limit=1)
        last_interaction = chats[-1]["created_at"] if chats else None
        
        return {
            "user_profile": profile,
            "activities": activities,
            "expenses": expenses,
            "moods": moods,
            "appointments": appointments,
            "alerts": alerts,
            "total_expenses_month": total_expenses,
            "unread_alerts": unread_alerts,
            "last_interaction": last_interaction,
            "activity_count_week": len(activities),
        }
    except Exception as e:
        print(f"[WARN] Failed to get family summary: {e}")
        return {}


# ==================== WELLNESS DATA ====================

def get_wellness_data(user_id: str) -> Dict[str, Any]:
    """Get wellness metrics for user."""
    moods = get_moods(user_id, period="week", limit=20)
    activities = get_activities(user_id, period="week", limit=20)
    
    # Calculate averages
    mood_counts = {}
    for m in moods:
        mood = m.get("rating", "neutral")
        mood_counts[mood] = mood_counts.get(mood, 0) + 1
    
    activity_counts = {}
    total_duration = 0
    for a in activities:
        atype = a.get("activity_type", "other")
        activity_counts[atype] = activity_counts.get(atype, 0) + 1
        total_duration += int(a.get("duration_minutes", 0) or 0)
    
    return {
        "mood_distribution": mood_counts,
        "activity_counts": activity_counts,
        "total_activity_minutes": total_duration,
        "mood_entries": len(moods),
        "activity_entries": len(activities),
    }


# ==================== FAMILY MESSAGES ====================

def save_family_message(
    elder_user_id: str,
    family_member_id: str,
    sender_id: str,
    message: str,
    message_type: str = "text"
) -> bool:
    """
    Save a message between elder and family member.
    
    Args:
        elder_user_id: The elder's user ID (e.g., 'parent_user')
        family_member_id: The family member's ID (e.g., 'family_sarah')
        sender_id: Who sent the message (elder_user_id or family_member_id)
        message: The message content
        message_type: 'text', 'voice_note', 'photo', 'location'
    """
    client = _get_client()
    
    try:
        data = {
            "elder_user_id": elder_user_id,
            "family_member_id": family_member_id,
            "sender_id": sender_id,
            "message": message,
            "message_type": message_type,
            "is_read": sender_id != elder_user_id,  # Auto-read if sent by elder
            "created_at": datetime.now().isoformat()
        }
        
        result = client.table("family_messages").insert(data).execute()
        return bool(result.data)
    except Exception as e:
        print(f"[WARN] Failed to save family message: {e}")
        # Store locally if DB fails
        return False


def get_family_messages(
    elder_user_id: str,
    family_member_id: str = None,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get messages for an elder, optionally filtered by family member.
    
    Args:
        elder_user_id: The elder's user ID
        family_member_id: Optional filter for specific family member
        limit: Max messages to return
    """
    client = _get_client()
    
    try:
        query = client.table("family_messages") \
            .select("*") \
            .eq("elder_user_id", elder_user_id) \
            .order("created_at", desc=False) \
            .limit(limit)
        
        if family_member_id:
            query = query.eq("family_member_id", family_member_id)
        
        result = query.execute()
        return result.data if result.data else []
    except Exception as e:
        print(f"[WARN] Failed to get family messages: {e}")
        return []


def mark_family_messages_read(elder_user_id: str, family_member_id: str, reader_id: str) -> bool:
    """Mark all messages as read for a conversation."""
    client = _get_client()
    
    try:
        # Mark messages as read where the reader is NOT the sender
        client.table("family_messages") \
            .update({"is_read": True}) \
            .eq("elder_user_id", elder_user_id) \
            .eq("family_member_id", family_member_id) \
            .neq("sender_id", reader_id) \
            .execute()
        return True
    except Exception as e:
        print(f"[WARN] Failed to mark messages read: {e}")
        return False


def get_family_members_for_elder(elder_user_id: str) -> List[Dict[str, Any]]:
    """Get list of family members who have messaged this elder."""
    client = _get_client()
    
    # Default family members (used as fallback)
    default_family = [
        {"id": "family_sarah", "name": "Sarah", "avatar": "👩", "relation": "Daughter"},
        {"id": "family_michael", "name": "Michael", "avatar": "👨", "relation": "Son"},
        {"id": "family_emma", "name": "Emma", "avatar": "👧", "relation": "Granddaughter"},
        {"id": "family_john", "name": "John", "avatar": "👦", "relation": "Grandson"},
    ]
    
    try:
        # Get unique family member IDs from messages
        result = client.table("family_messages") \
            .select("family_member_id") \
            .eq("elder_user_id", elder_user_id) \
            .execute()
        
        if not result.data:
            # No messages yet, return default family
            return default_family
        
        unique_members = list(set(m["family_member_id"] for m in (result.data or [])))
        
        # Get profiles for each
        members = []
        for member_id in unique_members:
            profile = get_profile(member_id)
            if profile:
                members.append({
                    "id": member_id,
                    "name": profile.get("name", member_id),
                    "avatar": profile.get("avatar", "👤"),
                    "relation": profile.get("relation", "Family")
                })
            else:
                members.append({
                    "id": member_id,
                    "name": member_id.replace("family_", "").title(),
                    "avatar": "👤",
                    "relation": "Family"
                })
        
        return members if members else default_family
    except Exception as e:
        print(f"[WARN] Failed to get family members: {e}")
        # Return default family contacts on error
        return default_family


def get_unread_message_count(user_id: str, elder_user_id: str = None) -> int:
    """Get count of unread messages for a user."""
    client = _get_client()
    
    try:
        query = client.table("family_messages") \
            .select("id") \
            .neq("sender_id", user_id) \
            .eq("is_read", False)
        
        if elder_user_id:
            query = query.eq("elder_user_id", elder_user_id)
        else:
            # For elders, match on elder_user_id
            query = query.eq("elder_user_id", user_id)
        
        result = query.execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        print(f"[WARN] Failed to get unread count: {e}")
        return 0
