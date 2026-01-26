
import os
from datetime import datetime
from dotenv import load_dotenv

from google.adk.agents import Agent, LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.memory import InMemoryMemoryService
#from opik.integrations.adk import OpikTracer, track_adk_agent_recursive

# Import local modules
from agent.tools import (
    # User profile
    update_user_profile,
    get_user_profile,
    # Expense tracking
    track_expense,
    get_expense_summary,
    # Mood tracking
    track_mood,
    get_mood_history,
    # Activity tracking
    record_activity,
    get_activity_history,
    # Appointments
    schedule_appointment,
    get_upcoming_appointments,
    cancel_appointment,
    # Wellness
    analyze_wellness_patterns,
    # Smart alerts
    send_family_alert,
    get_family_alerts_history,
    # Suggestions
    get_activity_suggestions,
    get_daily_summary,
    # Memory
    remember_fact,
    recall_memories,
)

from agent.prompts import (
    ROOT_AGENT_INSTRUCTION,
    MOOD_AGENT_INSTRUCTION,
    ACTIVITY_AGENT_INSTRUCTION,
    EXPENSE_AGENT_INSTRUCTION,
    APPOINTMENT_AGENT_INSTRUCTION,
    WELLNESS_AGENT_INSTRUCTION,
)

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

MODEL_LIVE = "gemini-2.0-flash-live-001"   
MODEL_STANDARD = "gemini-2.5-flash"        
MODEL_REASONING = "gemini-2.5-flash"       



import json

# Path to the default persona profile
PERSONA_PROFILE_PATH = os.path.join(os.path.dirname(__file__), "profiles", "default_persona.json")

def _load_persona_profile():
    """Loads the default persona profile from JSON file."""
    if os.path.exists(PERSONA_PROFILE_PATH):
        try:
            with open(PERSONA_PROFILE_PATH, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}

def initialize_user_context(callback_context: CallbackContext):
    """
    Initializes user context from stored data or default persona profile.
    
    Uses 'user:' prefix for cross-session persistence (persists across sessions
    when using DatabaseSessionService or VertexAiSessionService).
    
    Priority:
    1. Existing user state (from previous sessions via user: prefix)
    2. Local data.json storage  
    3. Default persona profile JSON
    """
    from agent.tools import _load_data, _save_data
    
    # Check if user context is already initialized (cross-session persistence)
    if callback_context.state.get("user:initialized"):
        # User already exists, just update current time
        callback_context.state["current_time"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        return
    
    # Try loading from local data storage first
    data = _load_data()
    profile = data.get("user_profile", {})
    
    # If no profile in data.json, load from default persona
    if not profile:
        persona_data = _load_persona_profile()
        if persona_data and "state" in persona_data:
            profile = persona_data["state"].get("user_profile", {})
            # Save to data.json for persistence
            data["user_profile"] = profile
            
            # Also load initial memories if present
            initial_memories = persona_data.get("initial_memories", [])
            if initial_memories and "long_term_memory" not in data:
                data["long_term_memory"] = initial_memories
            
            _save_data(data)
    
    # Set user state with user: prefix for cross-session persistence
    if profile:
        callback_context.state["user:name"] = profile.get("name", "Friend")
        callback_context.state["user:location"] = profile.get("location", "Mumbai, India")
        callback_context.state["user:age"] = profile.get("age", 65)
        callback_context.state["user:interests"] = ", ".join(profile.get("interests", []))
        callback_context.state["user:profile"] = profile
    else:
        # Fallback defaults for a warm, welcoming experience
        callback_context.state["user:name"] = "Friend"
        callback_context.state["user:location"] = "your city"
        callback_context.state["user:age"] = 60
        callback_context.state["user:interests"] = "reading, walking, family time"
        callback_context.state["user:profile"] = {
            "name": "Friend",
            "location": "your city",
            "interests": ["reading", "walking", "family time"]
        }
    
    # Mark as initialized to avoid reloading on subsequent turns
    callback_context.state["user:initialized"] = True
    callback_context.state["current_time"] = datetime.now().strftime("%Y-%m-%d %H:%M")


async def auto_save_session_to_memory_callback(callback_context: CallbackContext):
    """
    Automatically saves the session contents to long-term memory
    after each agent interaction.
    """
    if callback_context._invocation_context.memory_service:
        await callback_context._invocation_context.memory_service.add_session_to_memory(
            callback_context._invocation_context.session
        )


import warnings
warnings.filterwarnings("ignore", message="Tools at indices.*are not compatible with automatic function calling")

# # ==================== OPIK INITIALIZATION ====================
# # Initialize Opik tracer early so we can use its callbacks
# opik_tracer = OpikTracer(
#     project_name="amble-companion",
#     metadata={"environment": "development", "agent_type": "elderly-companion"}
# )

# # Shared callback list for all sub-agents
#     OPIK_CALLBACKS = {
#         "before_agent_callback": opik_tracer.before_agent_callback,
#         "after_agent_callback": opik_tracer.after_agent_callback,
#         "before_model_callback": opik_tracer.before_model_callback,
#         "after_model_callback": opik_tracer.after_model_callback,
#         "before_tool_callback": opik_tracer.before_tool_callback,
#         "after_tool_callback": opik_tracer.after_tool_callback,
#     }

# ==================== SUB-AGENTS ====================

# Mood & Emotional Wellness Agent
mood_agent = LlmAgent(
    name="mood_agent",
    model=MODEL_STANDARD,
    description="Handles emotional conversations, mood tracking, and wellness check-ins",
    instruction=MOOD_AGENT_INSTRUCTION,
    tools=[track_mood, get_mood_history],
    output_key="mood_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)

# Activity Tracking & Suggestions Agent
activity_agent = LlmAgent(
    name="activity_agent",
    model=MODEL_STANDARD,
    description="Tracks daily activities, suggests activities, and finds local events",
    instruction=ACTIVITY_AGENT_INSTRUCTION,
    tools=[
        record_activity, 
        get_activity_history, 
        get_activity_suggestions,
        google_search,  # For finding local events
    ],
    output_key="activity_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)

# Expense Tracking Agent
expense_agent = LlmAgent(
    name="expense_agent",
    model=MODEL_STANDARD,
    description="Helps track and summarize daily expenses",
    instruction=EXPENSE_AGENT_INSTRUCTION,
    tools=[track_expense, get_expense_summary],
    output_key="expense_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)

# Appointment Management Agent
appointment_agent = LlmAgent(
    name="appointment_agent",
    model=MODEL_STANDARD,
    description="Manages healthcare and personal appointments",
    instruction=APPOINTMENT_AGENT_INSTRUCTION,
    tools=[schedule_appointment, get_upcoming_appointments, cancel_appointment],
    output_key="appointment_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)

# Wellness Pattern Analysis Agent
wellness_agent = LlmAgent(
    name="wellness_agent",
    model=MODEL_REASONING,
    description="Analyzes patterns, detects concerns, and manages family alerts",
    instruction=WELLNESS_AGENT_INSTRUCTION,
    tools=[
        analyze_wellness_patterns,
        send_family_alert,
        get_family_alerts_history,
        get_mood_history,
        get_activity_history,
    ],
    output_key="wellness_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)

# Local Events & Trending Activities Agent  
local_events_agent = LlmAgent(
    name="local_events_agent",
    model=MODEL_STANDARD,
    description="Searches for local events, trending activities, and things to do in the user's city",
    instruction="""
    You help find local events and activities for elderly users.
    
    When searching:
    1. Use Google Search to find senior-friendly events in their area
    2. Look for cultural events, community gatherings, walking groups, hobby classes
    3. Search for trending activities and popular destinations
    4. Consider accessibility and timing
    
    User Location: {user:location}
    User Interests: {user:interests}
    
    Format results clearly with event name, location, timing, and brief description.
    Focus on activities suitable for seniors (50+).
    """,
    tools=[google_search],
    output_key="events_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)


# ==================== ROOT AGENT ====================

root_agent = Agent(
    name="amble_text",
    model=MODEL_STANDARD, 
    description="Amble: Text-based AI companion for elderly individuals",
    instruction=ROOT_AGENT_INSTRUCTION,
    tools=[
        # User profile tools
        update_user_profile,
        get_user_profile,
        # Expense tracking
        track_expense,
        get_expense_summary,
        # Mood tracking
        track_mood,
        get_mood_history,
        # Activity tracking
        record_activity,
        get_activity_history,
        # Appointments
        schedule_appointment,
        get_upcoming_appointments,
        cancel_appointment,
        # Wellness
        analyze_wellness_patterns,
        send_family_alert,
        # Suggestions and summary
        get_activity_suggestions,
        get_daily_summary,
        # Long-term memory (custom implementation)
        remember_fact,
        recall_memories,
        load_memory,
        google_search,
    ],
    # # Root agent uses multiple before/after callbacks
    # before_agent_callback=[initialize_user_context, opik_tracer.before_agent_callback],
    # after_agent_callback=[auto_save_session_to_memory_callback, opik_tracer.after_agent_callback],
    # # Standard OPIK callbacks
    # before_model_callback=opik_tracer.before_model_callback,
    # after_model_callback=opik_tracer.after_model_callback,
    # before_tool_callback=opik_tracer.before_tool_callback,
    # after_tool_callback=opik_tracer.after_tool_callback,
)

