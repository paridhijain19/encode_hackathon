# pydantic models for structured data handling

from typing import List, Optional
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


# ==================== ENUMS ====================

class MoodType(str, Enum):
    """Mood categories for tracking wellness"""
    HAPPY = "happy"
    CONTENT = "content"
    NEUTRAL = "neutral"
    TIRED = "tired"
    SAD = "sad"
    ANXIOUS = "anxious"
    LONELY = "lonely"
    ENERGETIC = "energetic"
    GRATEFUL = "grateful"


class ExpenseCategory(str, Enum):
    """Common expense categories for elderly users"""
    GROCERIES = "groceries"
    PHARMACY = "pharmacy"
    UTILITIES = "utilities"
    HEALTHCARE = "healthcare"
    TRANSPORT = "transport"
    HOUSEHOLD = "household"
    ENTERTAINMENT = "entertainment"
    FOOD_DINING = "food_dining"
    PERSONAL_CARE = "personal_care"
    OTHER = "other"


class ActivityType(str, Enum):
    """Types of daily activities"""
    WALKING = "walking"
    EXERCISE = "exercise"
    READING = "reading"
    GARDENING = "gardening"
    COOKING = "cooking"
    SOCIAL = "social"
    HOBBY = "hobby"
    MEDITATION = "meditation"
    SHOPPING = "shopping"
    RELIGIOUS = "religious"
    TV_ENTERTAINMENT = "tv_entertainment"
    PHONE_CALL = "phone_call"
    OTHER = "other"


class AlertUrgency(str, Enum):
    """Smart alert urgency levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AppointmentType(str, Enum):
    """Types of appointments"""
    DOCTOR = "doctor"
    DENTIST = "dentist"
    SPECIALIST = "specialist"
    LAB_TEST = "lab_test"
    PHARMACY_PICKUP = "pharmacy_pickup"
    PERSONAL = "personal"
    SOCIAL = "social"
    OTHER = "other"


# ==================== PYDANTIC MODELS ====================

class UserProfile(BaseModel):
    """User profile information stored long-term"""
    name: str = Field(description="User's preferred name")
    age: Optional[int] = Field(default=None, description="User's age")
    location: str = Field(default="Ahmedabad",description="City/area where the user lives")
    timezone: Optional[str] = Field(default="Asia/Kolkata", description="User's timezone")
    preferred_language: str = Field(default="English", description="Preferred language")
    emergency_contact_name: Optional[str] = Field(default=None, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(default=None, description="Emergency contact phone")
    health_conditions: Optional[List[str]] = Field(default=[], description="Known health conditions")
    medications: Optional[List[str]] = Field(default=[], description="Current medications")
    interests: Optional[List[str]] = Field(default=[], description="Hobbies and interests")
    daily_routine_preferences: Optional[str] = Field(default=None, description="Notes about preferred routine")


class ExpenseEntry(BaseModel):
    """Structure for expense tracking"""
    amount: float = Field(description="The expense amount")
    category: ExpenseCategory = Field(description="Category of the expense")
    description: str = Field(description="Brief description of what was purchased")
    timestamp: Optional[str] = Field(default=None, description="When the expense occurred")


class MoodEntry(BaseModel):
    """Structure for mood tracking"""
    mood: MoodType = Field(description="Current mood state")
    energy_level: Optional[int] = Field(default=5, ge=1, le=10, description="Energy level 1-10")
    details: Optional[str] = Field(default=None, description="Additional context about feelings")
    timestamp: Optional[str] = Field(default=None, description="When mood was recorded")


class ActivityEntry(BaseModel):
    """Structure for activity logging"""
    activity_type: ActivityType = Field(description="Type of activity")
    activity_name: str = Field(description="Specific activity performed")
    duration_minutes: int = Field(description="How long the activity lasted in minutes")
    notes: Optional[str] = Field(default=None, description="Additional notes about the activity")
    timestamp: Optional[str] = Field(default=None, description="When activity occurred")


class AppointmentEntry(BaseModel):
    """Structure for appointment management"""
    title: str = Field(description="What the appointment is for")
    appointment_type: AppointmentType = Field(description="Type of appointment")
    date_time: str = Field(description="Scheduled date and time")
    location: Optional[str] = Field(default="Home", description="Where the appointment is")
    doctor_name: Optional[str] = Field(default=None, description="Name of doctor/provider")
    notes: Optional[str] = Field(default=None, description="Any preparation or notes")
    reminder_sent: bool = Field(default=False, description="Whether reminder was sent")


class WellnessInsight(BaseModel):
    """Structure for pattern detection insights"""
    insight_type: str = Field(description="Type of insight: 'positive', 'concerning', 'suggestion'")
    title: str = Field(description="Brief title of the insight")
    message: str = Field(description="Detailed insight message")
    suggested_action: Optional[str] = Field(default=None, description="Recommended action")
    urgency: AlertUrgency = Field(default=AlertUrgency.LOW, description="How urgent this insight is")


class SmartAlert(BaseModel):
    """Structure for family notifications"""
    message: str = Field(description="The alert message for family")
    urgency: AlertUrgency = Field(description="Urgency level of the alert")
    category: str = Field(description="Category: 'wellness', 'activity', 'health', 'social'")
    requires_response: bool = Field(default=False, description="Whether family should respond")
    timestamp: Optional[str] = Field(default=None, description="When alert was generated")


class ActivitySuggestion(BaseModel):
    """Structure for activity suggestions"""
    title: str = Field(description="Name of the suggested activity")
    description: str = Field(description="Brief description of the activity")
    category: str = Field(description="Category: 'outdoor', 'indoor', 'social', 'creative', 'wellness'")
    duration_estimate: str = Field(description="Estimated time needed")
    location: Optional[str] = Field(default=None, description="Where to do this activity")
    is_local_event: bool = Field(default=False, description="Whether this is a local event")


class LocalEventSuggestion(BaseModel):
    """Structure for local event suggestions"""
    event_name: str = Field(description="Name of the event")
    event_type: str = Field(description="Type of event")
    location: str = Field(description="Where the event is happening")
    date_time: Optional[str] = Field(default=None, description="When the event is")
    description: str = Field(description="Brief description of the event")
    source_url: Optional[str] = Field(default=None, description="Link for more information")


class DailySummary(BaseModel):
    """Structure for daily wellness summary"""
    date: str = Field(description="Date of the summary")
    mood_trend: str = Field(description="Overall mood trend for the day")
    activities_completed: List[str] = Field(description="List of activities done")
    total_active_minutes: int = Field(description="Total minutes of activity")
    expenses_total: float = Field(description="Total expenses for the day")
    highlights: List[str] = Field(description="Positive highlights from the day")
    areas_of_concern: Optional[List[str]] = Field(default=[], description="Any concerning patterns")
