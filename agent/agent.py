
import os
from datetime import datetime
from dotenv import load_dotenv

from google.adk.agents import Agent, LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.memory import InMemoryMemoryService
from google.adk.tools.google_search_tool import google_search
from google.adk.tools.agent_tool import AgentTool
from opik.integrations.adk import OpikTracer

# Import local modules
from agent.tools import (
    # User profile
    update_user_profile,
    get_user_profile,
    # Expense tracking
    track_expense,
    get_expense_summary,
    analyze_spending_patterns,  
    # Mood tracking
    track_mood,
    get_mood_history,
    get_mood_based_suggestions,  
    # Activity tracking
    record_activity,
    get_activity_history,
    suggest_daily_activity,  
    search_local_activities,  
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
    # Video calls
    initiate_video_call,
    end_video_call,
    get_available_contacts,
)

from agent.prompts import (
    ROOT_AGENT_INSTRUCTION
)

dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path)

MODEL_LIVE = "gemini-2.0-flash-live-001"   
MODEL_STANDARD = "gemini-2.5-flash"        
MODEL_REASONING = "gemini-2.5-flash"       



import json



def initialize_user_context(callback_context: CallbackContext):
    """
    Initializes user context from Supabase or default persona profile.
    
    Uses 'user:' prefix for cross-session persistence (persists across sessions
    when using DatabaseSessionService or VertexAiSessionService).
    
    Priority:
    1. Existing user state (from previous sessions via user: prefix)
    2. Supabase profile storage
    3. Default persona profile JSON
    """
    from agent.supabase_store import get_profile, save_profile
    
    # Get user_id from the invocation context (this is the actual user_id from the API call)
    # The session object contains the user_id that was used to create/retrieve it
    try:
        session = callback_context._invocation_context.session
        user_id = session.user_id if hasattr(session, 'user_id') else None
    except Exception:
        user_id = None
    
    # Fallback to state if session doesn't have user_id
    if not user_id:
        user_id = callback_context.state.get("user_id", "parent_user")
    
    print(f"[AGENT] initialize_user_context called for user_id: {user_id}")
    
    # Check if user context is already initialized for THIS user
    # If user_id changed, we need to reinitialize
    stored_user_id = callback_context.state.get("user:id")
    if callback_context.state.get("user:initialized") and stored_user_id == user_id:
        # Same user already initialized, just update current time
        callback_context.state["current_time"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        return
    
    # Log when user changes
    if stored_user_id and stored_user_id != user_id:
        print(f"[AGENT] User changed from {stored_user_id} to {user_id}, reloading profile...")
    
    # Try loading from Supabase first
    profile = get_profile(user_id)

    
    # Set user state with user: prefix for cross-session persistence
    if profile:
        callback_context.state["user:name"] = profile.get("name", "Friend")
        callback_context.state["user:location"] = profile.get("location", "Mumbai, India")
        # Age might be in preferences
        age = profile.get("age", 65)
        if not age and "preferences" in profile:
            age = profile.get("preferences", {}).get("age", 65)
        callback_context.state["user:age"] = age
        # Interests might be in preferences
        interests = profile.get("interests", [])
        if not interests and "preferences" in profile:
            interests = profile.get("preferences", {}).get("interests", [])
        callback_context.state["user:interests"] = ", ".join(interests) if isinstance(interests, list) else interests
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
    
    # Mark as initialized and store user_id to detect changes
    callback_context.state["user:initialized"] = True
    callback_context.state["user:id"] = user_id
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

# ==================== OPIK INITIALIZATION ====================
opik_tracer = OpikTracer(
    project_name="amble-companion",
    metadata={"environment": "development", "agent_type": "elderly-companion"}
)

# Shared callback list for all sub-agents
OPIK_CALLBACKS = {
    "before_agent_callback": opik_tracer.before_agent_callback,
    "after_agent_callback": opik_tracer.after_agent_callback,
    "before_model_callback": opik_tracer.before_model_callback,
    "after_model_callback": opik_tracer.after_model_callback,
    "before_tool_callback": opik_tracer.before_tool_callback,
    "after_tool_callback": opik_tracer.after_tool_callback,
}


search_agent = LlmAgent(
    name="search_agent",
    model=MODEL_STANDARD,
    description="Searches the web for local events, news, and factual information",
    instruction="""
You are a search assistant for elderly users.
Use google_search to find accurate, recent information.
Focus on:
- Local events and activities suitable for seniors
- Health and wellness information
- News and current events
- Factual answers to questions

Summarize results clearly in simple language.
Avoid technical jargon. Be warm and helpful.
""",
    tools=[google_search],
    **OPIK_CALLBACKS
)

# Wrap search_agent as a tool for root_agent to use safely
# AgentTool only takes 'agent' parameter - name/description come from the agent itself
search_tool = AgentTool(agent=search_agent)


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
        analyze_spending_patterns,  # FIXED: Now accessible to agent
        # Mood tracking
        track_mood,
        get_mood_history,
        get_mood_based_suggestions,  # FIXED: Now accessible to agent
        # Activity tracking
        record_activity,
        get_activity_history,
        suggest_daily_activity,  # FIXED: Now accessible to agent
        search_local_activities,  # FIXED: Now accessible to agent
        # Appointments
        schedule_appointment,
        get_upcoming_appointments,
        cancel_appointment,
        # Wellness
        analyze_wellness_patterns,
        send_family_alert,
        get_family_alerts_history,  # FIXED: Now accessible to agent
        # Suggestions and summary
        get_activity_suggestions,
        get_daily_summary,
        # Long-term memory (custom implementation)
        remember_fact,
        recall_memories,
        # Video calls
        initiate_video_call,
        end_video_call,
        get_available_contacts,
        # Web search (safely wrapped via AgentTool)
        search_tool,
    ],
    # Root agent uses multiple before/after callbacks
    before_agent_callback=[initialize_user_context, opik_tracer.before_agent_callback],
    after_agent_callback=[auto_save_session_to_memory_callback, opik_tracer.after_agent_callback],
    # Standard OPIK callbacks
    before_model_callback=opik_tracer.before_model_callback,
    after_model_callback=opik_tracer.after_model_callback,
    before_tool_callback=opik_tracer.before_tool_callback,
    after_tool_callback=opik_tracer.after_tool_callback,
)

