"""
Scheduler Service for Amble - Proactive Agent

Handles scheduled tasks:
- Morning greetings (8 AM)
- Afternoon check-ins (2 PM)
- Medication reminders
- Appointment reminders
- Inactivity detection

Usage:
    from agent.scheduler import start_scheduler, stop_scheduler
    
    # Start scheduler (call once at server startup)
    start_scheduler()
"""

import os
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Callable, Optional
from dotenv import load_dotenv

load_dotenv()

# Import Supabase store for user data
from agent.supabase_store import (
    get_active_elders,
    get_profile,
    get_activities,
    get_appointments,
    get_moods,
)

# Scheduler instance
_scheduler = None
_is_running = False


# ============================================================
# Scheduled Task Definitions
# ============================================================

async def morning_greeting_task():
    """Send morning greeting to all active elder users."""
    from agent.communication import get_comm_service
    
    print(f"[Scheduler] Running morning greeting at {datetime.now()}")
    
    comm = get_comm_service()
    
    # Get all active elders from Supabase
    elders = get_active_elders()
    
    for elder in elders:
        user_id = elder.get("id", "default_user")
        name = elder.get("name", "there")
        
        # Send push notification
        await comm.send_push_notification(
            user_id=user_id,
            title="Good Morning! ☀️",
            message=f"Good morning, {name}! How are you feeling today?",
            data={"type": "morning_greeting", "action": "open_chat"}
        )


async def afternoon_checkin_task():
    """Send afternoon check-in to elders who haven't been active."""
    from agent.communication import get_comm_service
    
    print(f"[Scheduler] Running afternoon check-in at {datetime.now()}")
    
    comm = get_comm_service()
    
    # Get all active elders from Supabase
    elders = get_active_elders()
    
    for elder in elders:
        user_id = elder.get("id", "default_user")
        name = elder.get("name", "there")
        
        # Check if elder has activities today
        today_activities = get_activities(user_id, period="today")
        
        if not today_activities:
            await comm.send_push_notification(
                user_id=user_id,
                title="Afternoon Check-in 🌤️",
                message=f"Hi {name}! Just checking in. How's your day going?",
                data={"type": "afternoon_checkin", "action": "open_chat"}
            )


async def medication_reminder_task():
    """Send medication reminders based on scheduled times."""
    from agent.communication import get_comm_service
    
    print(f"[Scheduler] Running medication reminder at {datetime.now()}")
    
    comm = get_comm_service()
    
    # Get medication schedules (would be in user profile or separate table)
    # For now, use a simple check
    current_hour = datetime.now().hour
    
    # Default medication times: 9 AM, 2 PM, 8 PM
    medication_hours = [9, 14, 20]
    
    if current_hour in medication_hours:
        # Get all active elders from Supabase
        elders = get_active_elders()
        
        for elder in elders:
            user_id = elder.get("id", "default_user")
            name = elder.get("name", "there")
            
            await comm.send_push_notification(
                user_id=user_id,
                title="Medication Reminder 💊",
                message=f"{name}, it's time for your medication. Don't forget!",
                data={"type": "medication_reminder", "action": "confirm_taken"}
            )


async def appointment_reminder_task():
    """Send reminders for upcoming appointments."""
    from agent.communication import get_comm_service
    
    print(f"[Scheduler] Running appointment reminder at {datetime.now()}")
    
    comm = get_comm_service()
    
    # Get all active elders and their appointments
    elders = get_active_elders()
    now = datetime.now()
    
    for elder in elders:
        user_id = elder.get("id", "default_user")
        appointments = get_appointments(user_id, upcoming_only=True)
        
        for apt in appointments:
            try:
                # Combine date and time for comparison
                apt_date = apt.get("date", "")
                apt_time = apt.get("time", "00:00")
                if apt_date:
                    apt_datetime = datetime.fromisoformat(f"{apt_date}T{apt_time}")
                else:
                    continue
                
                # Remind 1 day before
                if now.date() == (apt_datetime.date() - timedelta(days=1)):
                    await comm.send_push_notification(
                        user_id=user_id,
                        title="Appointment Tomorrow 📅",
                        message=f"Reminder: {apt.get('title', 'Appointment')} tomorrow at {apt_datetime.strftime('%I:%M %p')}",
                        data={"type": "appointment_reminder", "appointment_id": apt.get("id")}
                    )
                
                # Remind 2 hours before
                elif apt_datetime - now <= timedelta(hours=2) and apt_datetime > now:
                    await comm.send_push_notification(
                        user_id=user_id,
                        title="Appointment Soon! ⏰",
                        message=f"{apt.get('title', 'Appointment')} in 2 hours at {apt.get('location', 'scheduled location')}",
                        data={"type": "appointment_reminder", "appointment_id": apt.get("id"), "urgent": True}
                    )
            except Exception as e:
                print(f"[Scheduler] Error processing appointment: {e}")


async def inactivity_check_task():
    """Check for elder inactivity and alert family if needed."""
    from agent.communication import get_comm_service
    
    print(f"[Scheduler] Running inactivity check at {datetime.now()}")
    
    comm = get_comm_service()
    
    # Get all active elders
    elders = get_active_elders()
    now = datetime.now()
    inactivity_threshold = timedelta(hours=4)
    critical_threshold = timedelta(hours=24)
    
    for elder in elders:
        user_id = elder.get("id", "default_user")
        name = elder.get("name", "User")
        
        # Get recent activities for this elder
        activities = get_activities(user_id, period="week", limit=1)
        
        if activities:
            try:
                last_activity_time = datetime.fromisoformat(activities[0].get("timestamp", "").replace("Z", "+00:00").replace("+00:00", ""))
                time_since = now - last_activity_time
                
                if time_since >= critical_threshold:
                    # Critical: No activity in 24+ hours
                    await comm.send_family_alert(
                        elder_user_id=user_id,
                        message=f"⚠️ {name} has not logged any activity in over 24 hours. Please check in.",
                        urgency="critical",
                        category="inactivity"
                    )
                elif time_since >= inactivity_threshold:
                    # Gentle check-in after 4 hours
                    await comm.send_push_notification(
                        user_id=user_id,
                        title="Just Checking In 💚",
                        message=f"Hi {name}! It's been a while. Everything okay?",
                        data={"type": "inactivity_check", "action": "respond"}
                    )
            except Exception as e:
                print(f"[Scheduler] Error parsing activity timestamp for {user_id}: {e}")


async def wellness_analysis_task():
    """Run weekly wellness analysis and send summary to family."""
    from agent.communication import get_comm_service
    
    print(f"[Scheduler] Running wellness analysis at {datetime.now()}")
    
    # Only run on Sundays
    if datetime.now().weekday() != 6:
        return
    
    comm = get_comm_service()
    
    # Get all active elders
    elders = get_active_elders()
    
    for elder in elders:
        user_id = elder.get("id", "default_user")
        name = elder.get("name", "User")
        
        # Get last week's data for this elder
        moods = get_moods(user_id, period="week")
        activities = get_activities(user_id, period="week")
        
        # Analyze mood trends
        positive_moods = sum(1 for m in moods if m.get("rating", "").lower() in ["happy", "content", "energetic", "grateful", "good", "great"])
        negative_moods = sum(1 for m in moods if m.get("rating", "").lower() in ["sad", "anxious", "lonely", "tired", "bad"])
        total_activity_mins = sum(a.get("duration_minutes", 0) or 0 for a in activities)
        
        # Generate insights
        mood_trend = "positive" if positive_moods > negative_moods else "could use some attention"
        activity_level = "good" if total_activity_mins >= 150 else "below recommended"
        
        message = f"Weekly wellness summary for {name}:\n"
        message += f"• Mood trend: {mood_trend}\n"
        message += f"• Activity: {total_activity_mins} minutes ({activity_level})\n"
        message += f"• {len(activities)} activities logged"
        
        # Alert family with low urgency summary
        await comm.send_family_alert(
            elder_user_id=user_id,
            message=message,
            urgency="low",
            category="wellness_summary"
        )


# ============================================================
# Scheduler Implementation
# ============================================================

def _create_scheduler():
    """Create the APScheduler instance."""
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger
        from apscheduler.triggers.interval import IntervalTrigger
        
        scheduler = AsyncIOScheduler()
        
        # Morning greeting: 8 AM every day
        scheduler.add_job(
            morning_greeting_task,
            CronTrigger(hour=8, minute=0),
            id="morning_greeting",
            name="Morning Greeting"
        )
        
        # Afternoon check-in: 2 PM every day
        scheduler.add_job(
            afternoon_checkin_task,
            CronTrigger(hour=14, minute=0),
            id="afternoon_checkin",
            name="Afternoon Check-in"
        )
        
        # Medication reminders: 9 AM, 2 PM, 8 PM
        for hour in [9, 14, 20]:
            scheduler.add_job(
                medication_reminder_task,
                CronTrigger(hour=hour, minute=0),
                id=f"medication_reminder_{hour}",
                name=f"Medication Reminder ({hour}:00)"
            )
        
        # Appointment reminders: Every hour
        scheduler.add_job(
            appointment_reminder_task,
            IntervalTrigger(hours=1),
            id="appointment_reminder",
            name="Appointment Reminder"
        )
        
        # Inactivity check: Every 2 hours
        scheduler.add_job(
            inactivity_check_task,
            IntervalTrigger(hours=2),
            id="inactivity_check",
            name="Inactivity Check"
        )
        
        # Weekly wellness analysis: Sunday 6 PM
        scheduler.add_job(
            wellness_analysis_task,
            CronTrigger(day_of_week="sun", hour=18, minute=0),
            id="wellness_analysis",
            name="Weekly Wellness Analysis"
        )
        
        return scheduler
        
    except ImportError:
        print("[Scheduler] APScheduler not installed. Run: pip install apscheduler")
        return None


def start_scheduler():
    """Start the scheduler."""
    global _scheduler, _is_running
    
    if _is_running:
        print("[Scheduler] Already running")
        return
    
    _scheduler = _create_scheduler()
    
    if _scheduler:
        _scheduler.start()
        _is_running = True
        print("[Scheduler] Started with jobs:")
        for job in _scheduler.get_jobs():
            print(f"  - {job.name}: {job.trigger}")
    else:
        print("[Scheduler] Failed to start (APScheduler not available)")


def stop_scheduler():
    """Stop the scheduler."""
    global _scheduler, _is_running
    
    if _scheduler and _is_running:
        _scheduler.shutdown()
        _is_running = False
        print("[Scheduler] Stopped")


def get_scheduler_status() -> Dict[str, Any]:
    """Get current scheduler status."""
    global _scheduler, _is_running
    
    if not _scheduler:
        return {"running": False, "jobs": []}
    
    jobs = []
    for job in _scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "trigger": str(job.trigger),
            "next_run": job.next_run_time.isoformat() if job.next_run_time else None
        })
    
    return {
        "running": _is_running,
        "jobs": jobs
    }


async def run_task_now(task_id: str) -> bool:
    """Manually trigger a scheduled task."""
    tasks = {
        "morning_greeting": morning_greeting_task,
        "afternoon_checkin": afternoon_checkin_task,
        "medication_reminder": medication_reminder_task,
        "appointment_reminder": appointment_reminder_task,
        "inactivity_check": inactivity_check_task,
        "wellness_analysis": wellness_analysis_task
    }
    
    # Handle medication reminder variants
    if task_id.startswith("medication_reminder"):
        task_id = "medication_reminder"
    
    task_func = tasks.get(task_id)
    if task_func:
        await task_func()
        return True
    
    return False
