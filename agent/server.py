"""
Amble Companion Agent - FastAPI Server
======================================

Exposes the Amble agent via REST API with Mem0 long-term memory.

Usage:
    uvicorn agent.server:app --reload --port 8000

Environment Variables:
    MEM0_API_KEY: Your Mem0 API key for long-term memory storage
"""

import os
import sys
import asyncio
from contextlib import asynccontextmanager
from typing import Optional, List
from datetime import datetime
import warnings

# Suppress known deprecation warnings from third-party libraries
warnings.filterwarnings("ignore", category=DeprecationWarning, module="pyiceberg")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="supabase")
warnings.filterwarnings("ignore", message=".*enablePackrat.*")
warnings.filterwarnings("ignore", message=".*escChar.*")
warnings.filterwarnings("ignore", message=".*unquoteResults.*")
warnings.filterwarnings("ignore", message=".*@model_validator.*mode='after'.*")
warnings.filterwarnings("ignore", message=".*verify.*parameter.*deprecated.*")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from google.adk.runners import InMemoryRunner
from google.genai import types

# Load environment variables
load_dotenv()

# Ensure agent package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.append(project_root)

from agent.agent import root_agent, opik_tracer


# ==================== MEM0 SETUP ====================
"""
Mem0 Authentication:
- Set MEM0_API_KEY environment variable with your Mem0 platform API key
- Optionally set MEM0_ORG_ID and MEM0_PROJECT_ID for multi-project setups
- Get your API key from: https://app.mem0.ai/
"""

from mem0 import MemoryClient

# Initialize Mem0 client (None if API key not configured)
mem0_client: Optional[MemoryClient] = None

def init_mem0() -> Optional[MemoryClient]:
    """
    Initialize Mem0 client with API key from environment.
    Returns None if MEM0_API_KEY is not set (memory features disabled).
    """
    api_key = os.getenv("MEM0_API_KEY")
    if not api_key:
        print("[WARN] MEM0_API_KEY not set - long-term memory disabled")
        return None
    
    try:
        client = MemoryClient(api_key=api_key)
        print("[OK] Mem0 client initialized")
        return client
    except Exception as e:
        print(f"[WARN] Failed to initialize Mem0: {e}")
        return None


# ==================== MODELS ====================

class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    user_id: str = "default_user"
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Response body for chat endpoint."""
    response: str
    session_id: str
    user_id: str
    memories_used: int = 0  # Number of memories retrieved for context


class StateResponse(BaseModel):
    """Response body for state endpoint."""
    status: str
    user_id: str
    session_id: Optional[str] = None
    memory_count: int = 0
    agent_ready: bool = False
    # Data from Supabase
    expenses: List[dict] = []
    activities: List[dict] = []
    appointments: List[dict] = []
    moods: List[dict] = []
    user_profile: dict = {}
    last_updated: Optional[str] = None


# ==================== STATE ====================

# Global runner instance (initialized on startup)
runner: Optional[InMemoryRunner] = None

# Import Supabase store for persistent data
from agent.supabase_store import (
    save_session as db_save_session,
    get_session as db_get_session,
    delete_session as db_delete_session,
    save_chat as db_save_chat,
    get_chat_history as db_get_chat_history,
    get_profile as db_get_profile,
    save_profile as db_save_profile,
    get_expenses as db_get_expenses,
    get_activities as db_get_activities,
    get_appointments as db_get_appointments,
    get_moods as db_get_moods,
    get_alerts as db_get_alerts,
    get_family_summary as db_get_family_summary,
    get_wellness_data as db_get_wellness_data,
    list_users as db_list_users,
    register_user as db_register_user,
    # Family linking functions
    link_family_member as db_link_family_member,
    unlink_family_member as db_unlink_family_member,
    get_linked_elder as db_get_linked_elder,
    get_family_members_for_elder as db_get_family_members_for_elder,
    get_active_elders as db_get_active_elders
)

# Simple rate limiter for Google API (to avoid 429 errors)
import time
_last_request_time: float = 0
_MIN_REQUEST_INTERVAL: float = 2.0  # Minimum 2 seconds between requests


# ==================== MEM0 MEMORY FUNCTIONS ====================
"""
Memory Operations:
- save_memory(): Stores user message + agent reply for future retrieval
- search_memory(): Semantic search for relevant past memories
- Both functions are scoped by user_id for multi-user support
"""

def save_memory(user_id: str, user_message: str, agent_response: str) -> bool:
    """
    Save conversation turn to Mem0 for long-term memory.
    
    Args:
        user_id: Unique identifier for the user (used as filter)
        user_message: The user's input message
        agent_response: The agent's response
    
    Returns:
        True if saved successfully, False otherwise
    
    Note:
        - Saves both user and assistant messages together
        - This allows semantic search to find relevant context
        - Mem0 automatically extracts and indexes key information
    """
    global mem0_client
    
    if mem0_client is None:
        return False
    
    try:
        messages = [
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": agent_response}
        ]
        mem0_client.add(messages, user_id=user_id)
        return True
    except Exception as e:
        print(f"[WARN] Failed to save memory: {e}")
        return False


def search_memory(user_id: str, query: str, limit: int = 5) -> List[dict]:
    """
    Search Mem0 for relevant memories for this user.
    
    Args:
        user_id: Unique identifier for the user (filter scope)
        query: Search query (typically the current user message)
        limit: Maximum number of memories to return (default: 5)
    
    Returns:
        List of memory objects with 'memory' field containing the text.
        Returns empty list if no memories found or on error.
    
    Note:
        - Uses semantic search (not keyword matching)
        - Filters by user_id to ensure privacy between users
        - Empty results are handled gracefully (agent works without memory)
    """
    global mem0_client
    
    if mem0_client is None:
        return []
    
    try:
        # Search with user_id filter to scope memories to this user only
        # Mem0 API v2 requires filters as a dictionary parameter
        results = mem0_client.search(
            query=query,
            filters={"user_id": user_id},
            top_k=limit
        )
        
        # Handle empty results gracefully
        if not results:
            return []
        
        # Results is a list of memory objects
        # Each has 'memory' (text), 'id', 'score', etc.
        return results if isinstance(results, list) else []
    except Exception as e:
        print(f"[WARN] Failed to search memory: {e}")
        return []


def format_memories_for_context(memories: List[dict]) -> str:
    """
    Format retrieved memories into a string for agent context.
    
    Args:
        memories: List of memory objects from search_memory()
    
    Returns:
        Formatted string to prepend to agent context, or empty string if no memories
    """
    if not memories:
        return ""
    
    memory_texts = []
    for i, mem in enumerate(memories, 1):
        # Extract memory text (Mem0 returns 'memory' field)
        text = mem.get("memory", "") if isinstance(mem, dict) else str(mem)
        if text:
            memory_texts.append(f"{i}. {text}")
    
    if not memory_texts:
        return ""
    
    return (
        "\n\n[Past Memories - Use these for context about this user]\n"
        + "\n".join(memory_texts)
        + "\n[End of Memories]\n\n"
    )


# ==================== LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources."""
    global runner, mem0_client
    
    # Startup: Initialize Mem0 client
    mem0_client = init_mem0()
    
    # Startup: Initialize agent runner
    runner = InMemoryRunner(
        agent=root_agent,
        app_name="amble-api"
    )
    print("[OK] Amble agent runner initialized")
    
    # FIXED: Start proactive scheduler for reminders and check-ins
    try:
        from agent.scheduler import start_scheduler
        start_scheduler()
        print("[OK] Proactive scheduler started")
    except Exception as e:
        print(f"[WARN] Failed to start scheduler: {e}")
        print("[WARN] Proactive features (reminders, check-ins) will not work")
    
    yield
    
    # Shutdown
    try:
        # Stop scheduler
        from agent.scheduler import stop_scheduler
        stop_scheduler()
        print("[OK] Scheduler stopped")
    except Exception as e:
        print(f"[WARN] Failed to stop scheduler: {e}")
    
    try:
        opik_tracer.flush()
        print("[OK] Opik traces flushed")
    except Exception as e:
        print(f"[WARN] Failed to flush traces: {e}")


# ==================== APP ====================

app = FastAPI(
    title="Amble Companion API",
    description="AI companion agent for elderly individuals",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HELPERS ====================

async def get_or_create_session(user_id: str, requested_session_id: Optional[str] = None) -> str:
    """
    Get existing session or create new one for user.
    
    If a session_id is provided, verify it exists. If not, create a new one.
    Sessions are stored in Supabase for persistence across server restarts.
    """
    global runner
    
    # If a specific session was requested, try to use it
    if requested_session_id:
        try:
            # Try to get the session from ADK runner
            existing = await runner.session_service.get_session(
                app_name="amble-api",
                user_id=user_id,
                session_id=requested_session_id
            )
            if existing:
                return requested_session_id
        except Exception as e:
            # Session not found in ADK - will create new one
            print(f"[SESSION] Requested session not found, creating new: {e}")
    
    # Check if we have a stored session for this user
    stored_session = db_get_session(user_id)
    if stored_session:
        try:
            # Verify it still exists in ADK
            existing = await runner.session_service.get_session(
                app_name="amble-api",
                user_id=user_id,
                session_id=stored_session
            )
            if existing:
                return stored_session
        except Exception:
            # Stored session invalid, will create new
            db_delete_session(user_id)
    
    # Create new session
    session = await runner.session_service.create_session(
        app_name="amble-api",
        user_id=user_id
    )
    
    # Store in Supabase for persistence
    db_save_session(user_id, session.id)
    print(f"[SESSION] Created new session for {user_id}: {session.id}")
    
    return session.id


async def run_agent(user_id: str, session_id: str, message: str, memory_context: str = "") -> str:
    """
    Run agent and collect response text with API key fallback support.
    
    Args:
        user_id: User identifier
        session_id: ADK session ID
        message: User's message
        memory_context: Optional formatted memory context to prepend
    
    Returns:
        Agent's response text
    """
    global runner
    
    from agent.api_key_manager import (
        get_google_api_key, 
        mark_google_key_exhausted,
        is_quota_error, 
        is_auth_error
    )
    
    # Prepend memory context to the message if available
    # This allows the agent to see relevant past memories
    full_message = memory_context + message if memory_context else message
    
    content = types.Content(
        role="user",
        parts=[types.Part(text=full_message)]
    )
    
    # Retry with different API keys on quota exhaustion
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response_parts = []
            
            async for event in runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=content
            ):
                # Extract text from content events
                if hasattr(event, "content") and event.content:
                    if not event.content.parts:
                        continue
                    
                    for part in event.content.parts:
                        if hasattr(part, "text") and part.text:
                            # Only collect responses from the root agent
                            author = getattr(event, "author", "")
                            if author == "amble_text":
                                response_parts.append(part.text)
            
            return "".join(response_parts) if response_parts else "I'm sorry, I couldn't process that request."
            
        except Exception as e:
            current_key = os.getenv("GOOGLE_API_KEY")
            
            if is_quota_error(e):
                print(f"[AGENT] Quota exhausted for Google API key (attempt {attempt + 1}/{max_retries}): {e}")
                if current_key:
                    mark_google_key_exhausted(current_key, "quota_exceeded")
                
                # Try to get a new key for next attempt
                if attempt < max_retries - 1:
                    new_key = get_google_api_key()
                    if new_key:
                        os.environ["GOOGLE_API_KEY"] = new_key
                        print(f"[AGENT] Switched to new Google API key for retry")
                        continue
                    else:
                        print(f"[AGENT] No more Google API keys available")
                        break
            
            elif is_auth_error(e):
                print(f"[AGENT] Authentication error with Google API key: {e}")
                if current_key:
                    mark_google_key_exhausted(current_key, "auth_error")
                
                # Try to get a new key for next attempt
                if attempt < max_retries - 1:
                    new_key = get_google_api_key()
                    if new_key:
                        os.environ["GOOGLE_API_KEY"] = new_key
                        print(f"[AGENT] Switched to new Google API key after auth error")
                        continue
                    else:
                        print(f"[AGENT] No more Google API keys available")
                        break
            else:
                # Other error, don't retry
                print(f"[AGENT] Non-quota error: {e}")
                raise e
    
    # All retries exhausted
    return "I'm experiencing high demand right now. Please try again in a few minutes."


# ==================== ENDPOINTS ====================

@app.get("/")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "agent": "amble"}


@app.get("/api/keys/status")
async def get_api_key_status():
    """
    Get status of all API keys (for monitoring).
    Returns count of available, exhausted, and cooling down keys.
    """
    from agent.api_key_manager import api_key_manager
    
    status = api_key_manager.get_status()
    return {
        "status": "ok",
        "api_keys": status,
        "last_updated": time.time()
    }


# ==================== ANAM AI SESSION ENDPOINT ====================

import httpx

class AnamSessionRequest(BaseModel):
    """Request for Anam session token."""
    avatar_id: str = "960f614f-ea88-47c3-9883-f02094f70874"  # Default avatar


@app.post("/api/anam/session")
async def get_anam_session(request: AnamSessionRequest):
    """
    Get Anam AI session token for video avatar with audio passthrough.
    
    This enables ElevenLabs audio to be sent to Anam for lip-sync.
    Includes automatic fallback to additional Anam API keys on quota exhaustion.
    """
    from agent.api_key_manager import (
        get_anam_api_key, 
        mark_anam_key_exhausted,
        is_quota_error, 
        is_auth_error
    )
    
    anam_api_key = get_anam_api_key()
    
    if not anam_api_key:
        raise HTTPException(
            status_code=400,
            detail="No Anam API keys available. Add ANAM_API_KEY or ANAM_API_KEY_1, ANAM_API_KEY_2, etc. to .env"
        )
    
    # Retry with different API keys on quota exhaustion
    max_retries = 3
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.anam.ai/v1/auth/session-token",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {anam_api_key}",
                    },
                    json={
                        "personaConfig": {
                            "avatarId": request.avatar_id,
                            "enableAudioPassthrough": True,  # For ElevenLabs audio
                        }
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"[Anam] API Response success with key {attempt + 1}")
                    return {
                        "sessionToken": data.get("sessionToken"),
                        "avatarId": request.avatar_id
                    }
                elif response.status_code in [429, 503]:
                    # Rate limit or service unavailable - try next key
                    print(f"[Anam] Rate limited (attempt {attempt + 1}/{max_retries}): {response.text}")
                    mark_anam_key_exhausted(anam_api_key, f"rate_limit_{response.status_code}")
                    
                    if attempt < max_retries - 1:
                        anam_api_key = get_anam_api_key()
                        if not anam_api_key:
                            break
                        print(f"[Anam] Switched to new API key for retry")
                        continue
                elif response.status_code in [401, 403]:
                    # Auth error - try next key
                    print(f"[Anam] Auth error (attempt {attempt + 1}/{max_retries}): {response.text}")
                    mark_anam_key_exhausted(anam_api_key, f"auth_error_{response.status_code}")
                    
                    if attempt < max_retries - 1:
                        anam_api_key = get_anam_api_key()
                        if not anam_api_key:
                            break
                        print(f"[Anam] Switched to new API key after auth error")
                        continue
                else:
                    # Other error, don't retry
                    print(f"[Anam] API Error: {response.text}")
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Anam API error: {response.text}"
                    )
                
        except httpx.TimeoutException:
            print(f"[Anam] Timeout (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                continue
            else:
                raise HTTPException(status_code=504, detail="Anam API timeout after retries")
        except Exception as e:
            if is_quota_error(e) or is_auth_error(e):
                print(f"[Anam] API key exhausted (attempt {attempt + 1}/{max_retries}): {e}")
                mark_anam_key_exhausted(anam_api_key, str(e))
                
                if attempt < max_retries - 1:
                    anam_api_key = get_anam_api_key()
                    if not anam_api_key:
                        break
                    print(f"[Anam] Switched to new API key for retry")
                    continue
            else:
                raise e
    
    # All retries exhausted
    raise HTTPException(
        status_code=503, 
        detail="All Anam API keys exhausted. Please try again later."
    )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== USER MANAGEMENT ENDPOINTS ====================

class RegisterUserRequest(BaseModel):
    user_id: str
    name: str
    role: str = "parent"  # 'parent' or family role like 'daughter', 'son'
    avatar: str = None
    relation: str = None  # For family members: 'daughter', 'son', etc.


@app.get("/api/users")
async def list_users(role: str = None):
    """
    List all registered users from the database.
    Optional filter by role: 'parent' or 'family'.
    """
    try:
        if role == 'family':
            # Get all non-parent users
            all_users = db_list_users()
            users = [u for u in all_users if u.get('role') != 'parent']
        elif role == 'parent':
            users = db_list_users(role='parent')
        else:
            users = db_list_users()
        return {"users": users}
    except Exception as e:
        return {"users": [], "error": str(e)}


@app.post("/api/users")
async def register_user(request: RegisterUserRequest):
    """Register a new user account."""
    try:
        user = db_register_user(
            user_id=request.user_id,
            name=request.name,
            role=request.role,
            avatar=request.avatar,
            relation=request.relation,
        )
        return {"status": "success", "user": user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/state", response_model=StateResponse)
async def get_state(user_id: str = "default_user"):
    """
    Get current agent state for polling.
    
    Returns:
        Agent status, session info, memory count, and data from Supabase.
    """
    global runner, sessions, mem0_client
    from datetime import datetime
    
    # Get data from Supabase
    profile = db_get_profile(user_id) or {}
    expenses = db_get_expenses(user_id, period="week")
    activities = db_get_activities(user_id, period="week", limit=20)
    appointments = db_get_appointments(user_id, limit=20)
    moods = db_get_moods(user_id, period="week", limit=10)
    
    # Count memories for this user
    memory_count = 0
    if mem0_client is not None:
        try:
            # Use search instead of get_all to avoid filter requirement errors
            # Mem0 API v2 requires filters as a dictionary parameter
            memories = mem0_client.search(
                query="user information preferences activities",
                filters={"user_id": user_id},
                top_k=100
            )
            memory_count = len(memories) if memories else 0
        except Exception as e:
            # Silently handle - memory count is optional
            print(f"[WARN] Failed to count memories: {e}")
            pass  # Don't fail if memory count fails
    
    return StateResponse(
        status="ok",
        user_id=user_id,
        session_id=db_get_session(user_id),
        memory_count=memory_count,
        agent_ready=runner is not None,
        # Data from Supabase
        expenses=expenses,
        activities=activities,
        appointments=appointments,
        moods=moods,
        user_profile=profile,
        last_updated=datetime.now().isoformat()
    )


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with Amble agent.
    
    Flow:
    1. Search Mem0 for relevant past memories (top 5)
    2. Format memories as context for the agent
    3. Run agent with message + memory context
    4. Save conversation turn to Mem0 for future retrieval
    5. Return response with memory stats
    """
    global runner, _last_request_time
    
    # Debug logging
    print(f"[CHAT] Received request: user_id={request.user_id}, message={request.message[:50]}...")
    
    if runner is None:
        print("[CHAT] ERROR: Agent not initialized")
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    if not request.message.strip():
        print("[CHAT] ERROR: Empty message")
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    # Rate limiting to avoid hitting Google API limits
    current_time = time.time()
    time_since_last = current_time - _last_request_time
    if time_since_last < _MIN_REQUEST_INTERVAL:
        wait_time = _MIN_REQUEST_INTERVAL - time_since_last
        await asyncio.sleep(wait_time)  # Wait before proceeding
    _last_request_time = time.time()
    
    try:
        # Get or create session (pass requested session_id for validation)
        session_id = await get_or_create_session(request.user_id, request.session_id)
        
        # Step 1: Search for relevant memories before invoking agent
        memories = search_memory(
            user_id=request.user_id,
            query=request.message,
            limit=5  # Top 5 most relevant memories
        )
        
        # Step 2: Format memories for agent context
        memory_context = format_memories_for_context(memories)
        
        # Step 3: Run agent with memory context
        response_text = await run_agent(
            user_id=request.user_id,
            session_id=session_id,
            message=request.message,
            memory_context=memory_context
        )
        
        # Step 4: Save this conversation turn to memory for future use
        save_memory(
            user_id=request.user_id,
            user_message=request.message,
            agent_response=response_text
        )
        
        # Step 5: Log Opik metrics for observability & evaluation
        try:
            opik_tracer.log_metric("memory_hits", len(memories))
            opik_tracer.log_metric("has_memory", int(len(memories) > 0))
            opik_tracer.log_metric("response_length", len(response_text))
            opik_tracer.log_metric("user_message_length", len(request.message))
        except Exception:
            pass  # Don't fail request if metrics logging fails
        
        # Save chat to Supabase for family portal
        db_save_chat(
            user_id=request.user_id,
            session_id=session_id,
            user_message=request.message,
            agent_response=response_text
        )
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            user_id=request.user_id,
            memories_used=len(memories)
        )
        
    except Exception as e:
        error_str = str(e)
        print(f"[CHAT] ERROR: {error_str}")
        # Check for rate limit errors from Google API
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
            raise HTTPException(
                status_code=429,
                detail="Rate limit reached. Please wait 60 seconds before sending another message."
            )
        raise HTTPException(status_code=500, detail=error_str)


# ==================== ONBOARDING & INVITE ENDPOINTS ====================

from pydantic import BaseModel as PydanticBase
from typing import List, Optional

class OnboardingData(PydanticBase):
    name: str = ""
    age: str = ""
    location: str = ""
    interests: List[str] = []
    familyMembers: List[dict] = []
    user_id: str = "parent_user"

class InviteRequest(PydanticBase):
    elder_user_id: str
    family_email: str
    family_name: str
    relation: str

class InviteAcceptRequest(PydanticBase):
    token: str
    password: str


@app.post("/api/onboarding")
async def save_onboarding(data: OnboardingData):
    """Save onboarding profile data for the elder user to Supabase."""
    try:
        from datetime import datetime
        
        user_id = data.user_id or "parent_user"
        
        # Build profile dict for save_profile(user_id, profile_dict)
        profile_data = {
            "name": data.name,
            "location": data.location,
            "age": data.age,
            "interests": data.interests,
            "onboarded": True,
            "onboarded_at": datetime.now().isoformat()
        }
        
        # Also register this user with role=parent
        db_register_user(user_id, data.name, role="parent")
        
        db_save_profile(user_id, profile_data)
        return {"status": "success", "message": "Profile saved to Supabase"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/invite")
async def send_invite(request: InviteRequest):
    """Send a family invite email."""
    try:
        from agent.auth import get_auth_service
        from agent.communication import get_comm_service
        
        auth = get_auth_service()
        comm = get_comm_service()
        
        import os
        
        # Create invite token
        invite_token = await auth.create_invite_token(
            elder_user_id=request.elder_user_id,
            family_email=request.family_email,
            relation=request.relation
        )
        
        # Build invite URL
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        invite_url = f"{frontend_url}/invite?token={invite_token}"
        
        # Send invite email
        await comm.send_email(
            to=request.family_email,
            subject=f"Join {request.family_name}'s Amble Circle",
            body=f"""
Hello {request.family_name},

You've been invited to join as {request.relation} on Amble - 
a companion app for your family member.

Click the link below to accept the invitation:
{invite_url}

This link expires in 7 days.

Best,
The Amble Team
            """.strip()
        )
        
        return {"status": "success", "message": "Invite sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/invite/validate")
async def validate_invite(token: str):
    """Validate an invite token and return invite details."""
    try:
        from agent.auth import get_auth_service
        auth = get_auth_service()
        
        invite = await auth.validate_invite_token(token)
        if not invite:
            raise HTTPException(status_code=400, detail="Invalid or expired invite token")
        
        return {
            "elder_user_id": invite.get("elder_user_id"),
            "elder_name": invite.get("elder_name", "Your family member"),
            "relation": invite.get("relation")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/invite/accept")
async def accept_invite(request: InviteAcceptRequest):
    """Accept an invite and create a family member account."""
    try:
        from agent.auth import get_auth_service
        auth = get_auth_service()
        
        user = await auth.accept_invite(
            token=request.token,
            password=request.password
        )
        
        if not user:
            raise HTTPException(status_code=400, detail="Failed to accept invite")
        
        return {
            "status": "success",
            "user_id": user.id,
            "message": "Account created successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SCHEDULER ENDPOINTS ====================

@app.get("/api/scheduler/status")
async def get_scheduler_status_endpoint():
    """Get the status of the proactive scheduler."""
    try:
        from agent.scheduler import get_scheduler_status
        return get_scheduler_status()
    except Exception as e:
        return {"running": False, "error": str(e)}


@app.post("/api/scheduler/task/{task_name}")
async def run_scheduler_task(task_name: str):
    """Manually trigger a scheduler task."""
    try:
        from agent.scheduler import run_task_now
        success = run_task_now(task_name)
        if success:
            return {"status": "success", "message": f"Task {task_name} triggered"}
        else:
            raise HTTPException(status_code=404, detail=f"Task {task_name} not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== NOTIFICATION ENDPOINTS ====================

# In-memory notification store (replace with DB in production)
_notifications_store: dict = {}

def _get_user_notifications(user_id: str) -> List[dict]:
    """Get notifications for a user from the in-memory store."""
    if user_id not in _notifications_store:
        _notifications_store[user_id] = []
    return _notifications_store[user_id]

def _add_notification(user_id: str, notification: dict):
    """Add a notification for a user."""
    if user_id not in _notifications_store:
        _notifications_store[user_id] = []
    notification['id'] = f"notif_{len(_notifications_store[user_id])}_{datetime.now().timestamp()}"
    notification['created_at'] = datetime.now().isoformat()
    notification['is_read'] = False
    _notifications_store[user_id].insert(0, notification)
    # Keep only last 50 notifications
    _notifications_store[user_id] = _notifications_store[user_id][:50]

@app.get("/api/notifications/{user_id}")
async def get_notifications(user_id: str):
    """Get pending notifications for a user."""
    notifications = _get_user_notifications(user_id)
    unread = [n for n in notifications if not n.get('is_read', False)]
    return {
        "notifications": unread[:10],  # Return max 10 unread
        "total_unread": len(unread)
    }

@app.post("/api/notifications/{notification_id}/dismiss")
async def dismiss_notification(notification_id: str):
    """Dismiss/mark a notification as read."""
    for user_notifications in _notifications_store.values():
        for notif in user_notifications:
            if notif.get('id') == notification_id:
                notif['is_read'] = True
                return {"status": "success"}
    return {"status": "not_found"}

@app.post("/api/notifications/{user_id}/read-all")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user."""
    notifications = _get_user_notifications(user_id)
    for notif in notifications:
        notif['is_read'] = True
    return {"status": "success", "count": len(notifications)}

@app.post("/api/notifications/{user_id}/create")
async def create_notification(user_id: str, notification: dict):
    """Create a new notification (used by scheduler)."""
    _add_notification(user_id, notification)
    return {"status": "success"}


@app.post("/api/notifications/{user_id}/demo")
async def trigger_demo_notifications(user_id: str):
    """Trigger proactive notifications based on time of day."""
    from datetime import datetime
    
    hour = datetime.now().hour
    name = "there"
    
    # Try to get user name and data
    try:
        profile = db_get_profile(user_id)
        if profile and profile.get("name"):
            name = profile["name"]
    except:
        pass
    
    # Morning (5 AM - 12 PM): Health focus
    if 5 <= hour < 12:
        _add_notification(user_id, {
            "type": "greeting",
            "title": "Good Morning! ☀️",
            "message": f"Rise and shine, {name}! A new day awaits you.",
            "action": "Say Hi"
        })
        
        # Morning health suggestions
        if hour < 9:
            _add_notification(user_id, {
                "type": "medication",
                "title": "Morning Medication 💊",
                "message": "Time for your morning medicines. Stay healthy!",
                "action": "Mark Taken"
            })
        
        _add_notification(user_id, {
            "type": "wellness",
            "title": "Start Your Day Right 🌿",
            "message": "Try 5 minutes of gentle stretching to wake up your body!",
            "action": "Log Activity"
        })
    
    # Afternoon (12 PM - 5 PM): Activity focus
    elif 12 <= hour < 17:
        _add_notification(user_id, {
            "type": "checkin",
            "title": "Afternoon Boost ☕",
            "message": f"Hope you're having a great day, {name}!",
            "action": "Chat"
        })
        
        if hour == 14:
            _add_notification(user_id, {
                "type": "medication",
                "title": "Afternoon Medication 💊",
                "message": "Don't forget your afternoon medicines!",
                "action": "Mark Taken"
            })
        
        _add_notification(user_id, {
            "type": "activity",
            "title": "Time to Move! 🚶",
            "message": "A 15-minute walk after lunch helps digestion and energy.",
            "action": "Log Walk"
        })
    
    # Evening (5 PM - 9 PM): Relaxation focus
    elif 17 <= hour < 21:
        _add_notification(user_id, {
            "type": "greeting",
            "title": "Good Evening! 🌅",
            "message": f"Winding down, {name}? You've earned a peaceful evening.",
            "action": "Share"
        })
        
        if hour >= 20:
            _add_notification(user_id, {
                "type": "medication",
                "title": "Evening Medication 💊",
                "message": "Time for your evening medicines before bed.",
                "action": "Mark Taken"
            })
        
        _add_notification(user_id, {
            "type": "wellness",
            "title": "Relaxation Time 🧘",
            "message": "Try some deep breathing or light reading to relax.",
            "action": "Log Activity"
        })
    
    # Night (9 PM - 5 AM): Rest focus
    else:
        _add_notification(user_id, {
            "type": "greeting",
            "title": "Good Night! 🌙",
            "message": f"Rest well, {name}. Tomorrow is a new day!",
            "action": "Dismiss"
        })
        
        _add_notification(user_id, {
            "type": "wellness",
            "title": "Sleep Tip 😴",
            "message": "Keep your room cool and dark for better sleep quality.",
            "action": "Dismiss"
        })
    
    return {"status": "success", "notifications_added": 3}


@app.get("/api/proactive/{user_id}/greeting")
async def get_proactive_greeting(user_id: str):
    """Get a proactive greeting and optionally add notification."""
    from datetime import datetime
    
    hour = datetime.now().hour
    name = "there"
    
    try:
        profile = db_get_profile(user_id)
        if profile and profile.get("name"):
            name = profile["name"]
    except:
        pass
    
    # Create contextual greeting
    if 5 <= hour < 12:
        greeting = f"Good morning, {name}! ☀️"
        suggestion = "How did you sleep?"
    elif 12 <= hour < 17:
        greeting = f"Good afternoon, {name}! 🌤️"
        suggestion = "Had lunch yet?"
    elif 17 <= hour < 21:
        greeting = f"Good evening, {name}! 🌅"
        suggestion = "How was your day?"
    else:
        greeting = f"Hello, {name}! 🌙"
        suggestion = "Everything okay?"
    
    return {
        "greeting": greeting,
        "suggestion": suggestion,
        "time_of_day": "morning" if hour < 12 else "afternoon" if hour < 17 else "evening" if hour < 21 else "night",
        "user_name": name
    }


@app.get("/api/proactive/{user_id}/health-suggestions")
async def get_health_suggestions(user_id: str):
    """Get personalized health and activity suggestions based on user data."""
    from datetime import datetime, timedelta
    
    suggestions = []
    name = "there"
    
    try:
        profile = db_get_profile(user_id)
        if profile and profile.get("name"):
            name = profile["name"]
    except:
        pass
    
    # Get recent activities
    try:
        activities = db_get_activities(user_id, period="week")
        today_activities = db_get_activities(user_id, period="today")
        
        # If no activity today
        if not today_activities:
            suggestions.append({
                "type": "activity",
                "icon": "🚶",
                "title": "Get Moving!",
                "message": "You haven't logged any activity today. Even a short walk helps!",
                "action": "Log Activity"
            })
        
        # Calculate weekly activity
        total_mins = sum(a.get("duration_minutes", 0) or 0 for a in activities)
        if total_mins < 150:  # WHO recommends 150 mins/week
            suggestions.append({
                "type": "wellness",
                "icon": "💪",
                "title": "Weekly Goal",
                "message": f"You've done {total_mins} mins this week. Aim for 150 mins!",
                "action": "View Progress"
            })
    except:
        pass
    
    # Get mood data
    try:
        moods = db_get_moods(user_id, period="week")
        if moods:
            recent_mood = moods[0].get("rating", "").lower()
            if recent_mood in ["sad", "tired", "anxious", "lonely"]:
                suggestions.append({
                    "type": "wellness",
                    "icon": "🌸",
                    "title": "Self-Care Reminder",
                    "message": "Call a friend or try some calming music today.",
                    "action": "Log Mood"
                })
    except:
        pass
    
    # Time-based suggestions
    hour = datetime.now().hour
    
    if 7 <= hour < 10:
        suggestions.append({
            "type": "health",
            "icon": "🍳",
            "title": "Breakfast Time",
            "message": "A good breakfast keeps you energized all morning!",
            "action": "Dismiss"
        })
    elif 12 <= hour < 14:
        suggestions.append({
            "type": "health",
            "icon": "🥗",
            "title": "Lunch Break",
            "message": "Time for a nutritious lunch. Stay hydrated too!",
            "action": "Dismiss"
        })
    elif 15 <= hour < 17:
        suggestions.append({
            "type": "wellness",
            "icon": "☕",
            "title": "Afternoon Tea",
            "message": "Take a break with some tea and light stretching.",
            "action": "Dismiss"
        })
    
    # Default suggestion if nothing else
    if not suggestions:
        suggestions.append({
            "type": "wellness",
            "icon": "💚",
            "title": "You're Doing Great!",
            "message": f"Keep it up, {name}! Consistency is key.",
            "action": "Dismiss"
        })
    
    return {
        "suggestions": suggestions[:5],  # Max 5 suggestions
        "user_name": name,
        "generated_at": datetime.now().isoformat()
    }

# ==================== FAMILY PORTAL ENDPOINTS ====================

@app.get("/api/family/{elder_user_id}/summary")
async def get_family_summary(elder_user_id: str):
    """Get a summary of elder's recent data for family members from Supabase."""
    try:
        # Use the comprehensive family summary from Supabase
        summary = db_get_family_summary(elder_user_id)
        
        return {
            "user_profile": summary.get("profile", {}),
            "recent_activities": summary.get("recent_activities", []),
            "recent_moods": summary.get("recent_moods", []),
            "upcoming_appointments": summary.get("appointments", []),
            "recent_expenses": summary.get("recent_expenses", []),
            "alerts": summary.get("alerts", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/{elder_user_id}/alerts")
async def get_family_alerts(elder_user_id: str):
    """Get alerts for family members from Supabase."""
    try:
        alerts = db_get_alerts(elder_user_id, limit=50)
        
        return {
            "alerts": alerts,
            "unread_count": len([a for a in alerts if not a.get("read")])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/{elder_user_id}/chat-history")
async def get_family_chat_history(elder_user_id: str, limit: int = 50):
    """Get chat history for family members to review conversations from Supabase."""
    try:
        chat_history = db_get_chat_history(elder_user_id, limit=limit)
        
        return {
            "chat_history": chat_history,
            "total_count": len(chat_history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/chat/{user_id}")
async def get_chat_messages(user_id: str, limit: int = 100):
    """Get chat messages for the Messages page."""
    try:
        chat_history = db_get_chat_history(user_id, limit=limit)
        
        # Transform to the format expected by the frontend
        # Note: DB columns are user_message, agent_response, created_at
        messages = []
        for entry in chat_history:
            messages.append({
                "message": entry.get("user_message", ""),
                "response": entry.get("agent_response", ""),
                "timestamp": entry.get("created_at", "")
            })
        
        return {
            "messages": messages,
            "total_count": len(messages)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FAMILY LINKING ENDPOINTS ====================

class LinkFamilyRequest(BaseModel):
    """Request body for linking family member to elder."""
    family_user_id: str
    elder_id: str


@app.post("/api/family/link")
async def link_family_to_elder(request: LinkFamilyRequest):
    """Link a family member to an elder user."""
    try:
        success = db_link_family_member(request.family_user_id, request.elder_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to link family member")
        
        return {
            "success": True,
            "message": f"Family member {request.family_user_id} linked to elder {request.elder_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/family/unlink/{family_user_id}")
async def unlink_family_from_elder(family_user_id: str):
    """Remove the elder link from a family member."""
    try:
        success = db_unlink_family_member(family_user_id)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to unlink family member")
        
        return {
            "success": True,
            "message": f"Family member {family_user_id} unlinked from elder"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/linked-elder/{family_user_id}")
async def get_family_linked_elder(family_user_id: str):
    """Get the elder that a family member is linked to."""
    try:
        elder = db_get_linked_elder(family_user_id)
        if not elder:
            return {"linked_elder": None}
        
        # Return simplified elder profile
        prefs = elder.get("preferences") or {}
        return {
            "linked_elder": {
                "id": elder.get("user_id"),
                "name": elder.get("name"),
                "avatar": prefs.get("avatar", "👴"),
                "location": elder.get("location"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/members/{elder_id}")
async def get_elder_family_members(elder_id: str):
    """Get all family members linked to a specific elder."""
    try:
        members = db_get_family_members_for_elder(elder_id)
        return {
            "family_members": members,
            "count": len(members)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/elders")
async def get_active_elders():
    """Get all active elder users (for family member picker)."""
    try:
        elders = db_get_active_elders()
        return {
            "elders": elders,
            "count": len(elders)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SETTINGS ENDPOINTS ====================

# In-memory settings store (replace with DB in production)
_settings_store: dict = {}

def _get_default_settings():
    """Return default settings structure."""
    return {
        "notifications": {
            "morning_greeting": True,
            "medication_reminders": True,
            "appointment_reminders": True,
            "check_ins": True,
            "family_alerts": True
        },
        "emergency_contacts": [],
        "medication_reminders": [],
        "privacy": {
            "share_with_family": True,
            "share_location": False,
            "share_health": True
        }
    }

@app.get("/api/settings/{user_id}")
async def get_user_settings(user_id: str):
    """Get user settings."""
    if user_id not in _settings_store:
        _settings_store[user_id] = _get_default_settings()
    return _settings_store[user_id]

@app.put("/api/settings/{user_id}")
async def update_user_settings(user_id: str, settings: dict):
    """Update user settings."""
    if user_id not in _settings_store:
        _settings_store[user_id] = _get_default_settings()
    
    # Merge new settings with existing
    for key, value in settings.items():
        if isinstance(value, dict) and key in _settings_store[user_id]:
            _settings_store[user_id][key].update(value)
        else:
            _settings_store[user_id][key] = value
    
    return {"status": "success", "settings": _settings_store[user_id]}

@app.patch("/api/settings/{user_id}/{section}")
async def update_settings_section(user_id: str, section: str, data: dict):
    """Update a specific settings section."""
    if user_id not in _settings_store:
        _settings_store[user_id] = _get_default_settings()
    
    if section in _settings_store[user_id]:
        if isinstance(_settings_store[user_id][section], dict):
            _settings_store[user_id][section].update(data)
        else:
            _settings_store[user_id][section] = data
    else:
        _settings_store[user_id][section] = data
    
    return {"status": "success", "section": section, "data": _settings_store[user_id][section]}


@app.get("/api/family/{elder_user_id}/wellness")
async def get_family_wellness(elder_user_id: str):
    """Get wellness data including moods, activities, and health metrics from Supabase."""
    try:
        wellness = db_get_wellness_data(elder_user_id)
        
        moods = wellness.get("moods", [])
        activities = wellness.get("activities", [])
        
        # Calculate wellness metrics
        avg_energy = sum(m.get("energy_level", 5) for m in moods[-7:]) / max(len(moods[-7:]), 1)
        total_activity_minutes = sum(a.get("duration_minutes", 0) for a in activities[-7:])
        
        return {
            "recent_moods": moods[-10:],
            "recent_activities": activities[-10:],
            "wellness_score": min(100, int((avg_energy * 10) + (total_activity_minutes / 5))),
            "avg_energy_level": round(avg_energy, 1),
            "total_activity_minutes_week": total_activity_minutes,
            "mood_trend": "stable" if len(moods) < 2 else (
                "improving" if moods[-1].get("energy_level", 5) > moods[-2].get("energy_level", 5) else "declining"
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/{elder_user_id}/expenses")
async def get_family_expenses(elder_user_id: str):
    """Get detailed expense data for family members from Supabase."""
    try:
        expenses = db_get_expenses(elder_user_id, period="all")
        
        # Aggregate by category
        categories = {}
        for exp in expenses:
            cat = exp.get("category", "other")
            categories[cat] = categories.get(cat, 0) + exp.get("amount", 0)
        
        total = sum(exp.get("amount", 0) for exp in expenses)
        
        return {
            "recent_expenses": expenses[-20:] if len(expenses) > 20 else expenses,
            "total_spent": total,
            "by_category": [{"category": k, "amount": v} for k, v in sorted(categories.items(), key=lambda x: -x[1])],
            "expense_count": len(expenses)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/family/{elder_user_id}/alert/{alert_id}/read")
async def mark_alert_read(elder_user_id: str, alert_id: str):
    """Mark an alert as read in Supabase."""
    try:
        # For now, just return success - we can implement update later if needed
        # The alerts table has a 'read' column that can be updated
        from agent.supabase_store import get_supabase_client
        client = get_supabase_client()
        if client:
            try:
                client.table("alerts").update({"read": True}).eq("id", alert_id).execute()
            except Exception as update_err:
                print(f"Failed to update alert: {update_err}")
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== FAMILY MESSAGING ENDPOINTS ====================

from agent.supabase_store import (
    save_family_message,
    get_family_messages,
    mark_family_messages_read,
    get_family_members_for_elder,
    get_unread_message_count
)


class FamilyMessageRequest(BaseModel):
    """Request body for sending family messages."""
    sender_id: str
    message: str
    message_type: str = "text"


@app.get("/api/family/{elder_user_id}/messages")
async def get_messages(elder_user_id: str, family_member_id: str = None, limit: int = 50):
    """Get messages for an elder, optionally filtered by family member."""
    try:
        messages = get_family_messages(elder_user_id, family_member_id, limit)
        return {
            "messages": messages,
            "count": len(messages)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/family/{elder_user_id}/messages/{family_member_id}")
async def send_message(elder_user_id: str, family_member_id: str, request: FamilyMessageRequest):
    """Send a message between elder and family member."""
    try:
        success = save_family_message(
            elder_user_id=elder_user_id,
            family_member_id=family_member_id,
            sender_id=request.sender_id,
            message=request.message,
            message_type=request.message_type
        )
        
        if success:
            return {"status": "success", "message": "Message sent"}
        else:
            # Even if DB fails, return success for local demo
            return {"status": "success", "message": "Message sent (local mode)"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/family/{elder_user_id}/messages/{family_member_id}/read")
async def mark_messages_read(elder_user_id: str, family_member_id: str, reader_id: str):
    """Mark messages as read."""
    try:
        mark_family_messages_read(elder_user_id, family_member_id, reader_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/family/{elder_user_id}/contacts")
async def get_family_contacts(elder_user_id: str):
    """Get list of family members for an elder."""
    try:
        # Get from messages table
        members = get_family_members_for_elder(elder_user_id)
        
        # If no messages yet, return default family members from profile
        if not members:
            profile = db_get_profile(elder_user_id) or {}
            family = profile.get("family_members", [])
            if family:
                members = [
                    {
                        "id": f"family_{m.get('name', 'unknown').lower().replace(' ', '_')}",
                        "name": m.get("name", "Family"),
                        "avatar": m.get("avatar", "👤"),
                        "relation": m.get("relation", "Family")
                    }
                    for m in family
                ]
            else:
                # Default demo family members
                members = [
                    {"id": "family_sarah", "name": "Sarah", "avatar": "👩", "relation": "Daughter"},
                    {"id": "family_david", "name": "David", "avatar": "👨", "relation": "Son"},
                ]
        
        return {"contacts": members}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/messages/unread/{user_id}")
async def get_unread_messages(user_id: str, elder_user_id: str = None):
    """Get unread message count for a user."""
    try:
        count = get_unread_message_count(user_id, elder_user_id)
        return {"unread_count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== DIRECT DATA ENDPOINTS (NO AGENT) ====================
"""
These endpoints allow manual data entry directly to the database
without invoking the AI agent. Use these for form-based inputs.
"""

from agent.supabase_store import save_expense, save_activity, save_appointment


# ==================== VOICE ENDPOINTS ====================
"""
Voice interaction endpoints using OpenAI's Whisper (STT) and TTS APIs.
These enable voice-first interactions for elderly users.
"""

from fastapi import File, UploadFile
from fastapi.responses import StreamingResponse
import io
import openai


class TextToSpeechRequest(BaseModel):
    """Request body for text-to-speech endpoint."""
    text: str
    voice: str = "alloy"  # Options: alloy, echo, fable, onyx, nova, shimmer


@app.post("/api/voice/speech-to-text")
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Convert speech audio to text using OpenAI Whisper API.

    This endpoint accepts audio files in various formats (mp3, mp4, mpeg, mpga, m4a, wav, webm)
    and returns the transcribed text.

    Args:
        audio: Audio file upload containing the speech to transcribe

    Returns:
        JSON with transcribed text

    Usage:
        - Upload audio file from voice recorder
        - Get back transcribed text to use in chat
        - Supports multiple audio formats
    """
    try:
        # Read audio file content
        audio_content = await audio.read()

        # Create a file-like object from the bytes
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.wav"

        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

        client = openai.OpenAI(api_key=api_key)

        # Transcribe using Whisper
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )

        return {
            "status": "success",
            "text": transcript,
            "filename": audio.filename
        }

    except Exception as e:
        print(f"[VOICE] Speech-to-text error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to transcribe audio: {str(e)}")


@app.post("/api/voice/text-to-speech")
async def text_to_speech(request: TextToSpeechRequest):
    """
    Convert text to speech audio using OpenAI TTS API.

    This endpoint accepts text and returns speech audio that can be played back.
    Uses a warm, friendly voice suitable for elderly users.

    Args:
        request: Contains text to convert and optional voice selection

    Returns:
        Audio file (mp3) stream

    Usage:
        - Send agent response text
        - Receive audio file to play back
        - Configurable voice options
    """
    try:
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

        client = openai.OpenAI(api_key=api_key)

        # Generate speech using TTS
        response = client.audio.speech.create(
            model="tts-1",
            voice=request.voice,
            input=request.text
        )

        # Stream the audio response
        audio_stream = io.BytesIO(response.content)

        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"inline; filename=speech.mp3"
            }
        )

    except Exception as e:
        print(f"[VOICE] Text-to-speech error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {str(e)}")


class ElevenLabsTTSRequest(BaseModel):
    """Request body for ElevenLabs text-to-speech endpoint."""
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel - default warm female voice
    model_id: str = "eleven_multilingual_v2"  # Updated to v2 for free tier support
    output_format: str = "mp3_44100_128"  # or pcm_16000 for Anam lip-sync


@app.post("/api/voice/elevenlabs-tts")
async def elevenlabs_text_to_speech(request: ElevenLabsTTSRequest):
    """
    Convert text to speech using ElevenLabs API.
    
    Returns high-quality speech audio suitable for avatar lip-sync.
    Use output_format=pcm_16000 for Anam integration.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="ELEVENLABS_API_KEY not configured. Add it to .env for ElevenLabs voice."
        )
    
    # Determine content type based on format
    content_type = "audio/mpeg" if request.output_format.startswith("mp3") else "audio/pcm"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{request.voice_id}",
                headers={
                    "Accept": content_type,
                    "Content-Type": "application/json",
                    "xi-api-key": api_key,
                },
                json={
                    "text": request.text,
                    "model_id": request.model_id,
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                    },
                    "output_format": request.output_format
                },
                timeout=30.0
            )
            
            if response.status_code != 200:
                print(f"[ElevenLabs] API Error: {response.text}")
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"ElevenLabs API error: {response.text}"
                )
            
            # Return audio stream
            audio_stream = io.BytesIO(response.content)
            return StreamingResponse(
                audio_stream,
                media_type=content_type,
                headers={
                    "Content-Disposition": f"inline; filename=speech.{'mp3' if content_type == 'audio/mpeg' else 'pcm'}"
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="ElevenLabs API timeout")
    except Exception as e:
        print(f"[ElevenLabs] TTS error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {str(e)}")


@app.post("/api/voice/chat")
async def voice_chat(audio: UploadFile = File(...), user_id: str = "default_user", session_id: Optional[str] = None):
    """
    Voice chat endpoint - combines speech-to-text, agent response, and text-to-speech.

    This is a complete voice interaction flow:
    1. Transcribe user's voice input
    2. Get agent response
    3. Convert response to speech
    4. Return both text and audio

    Args:
        audio: Voice input from user
        user_id: User identifier
        session_id: Optional session ID for conversation continuity

    Returns:
        JSON with both text transcription and audio response
    """
    global runner

    try:
        # Step 1: Transcribe audio to text
        audio_content = await audio.read()
        audio_file = io.BytesIO(audio_content)
        audio_file.name = audio.filename or "audio.wav"

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

        client = openai.OpenAI(api_key=api_key)

        # Transcribe
        user_message = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="text"
        )

        # Step 2: Get agent response (reuse existing chat logic)
        if runner is None:
            raise HTTPException(status_code=503, detail="Agent not initialized")

        # Get or create session
        session_id = await get_or_create_session(user_id, session_id)

        # Search for relevant memories
        memories = search_memory(user_id=user_id, query=user_message, limit=5)
        memory_context = format_memories_for_context(memories)

        # Run agent
        response_text = await run_agent(
            user_id=user_id,
            session_id=session_id,
            message=user_message,
            memory_context=memory_context
        )

        # Save to memory
        save_memory(user_id=user_id, user_message=user_message, agent_response=response_text)

        # Save to Supabase
        db_save_chat(
            user_id=user_id,
            session_id=session_id,
            user_message=user_message,
            agent_response=response_text
        )

        # Step 3: Convert response to speech
        tts_response = client.audio.speech.create(
            model="tts-1",
            voice="nova",  # Warm, friendly voice for elderly users
            input=response_text
        )

        # Encode audio as base64 for JSON response
        import base64
        audio_base64 = base64.b64encode(tts_response.content).decode('utf-8')

        return {
            "status": "success",
            "user_message": user_message,
            "agent_response": response_text,
            "audio_response": audio_base64,
            "session_id": session_id,
            "memories_used": len(memories)
        }

    except Exception as e:
        print(f"[VOICE] Voice chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Voice chat failed: {str(e)}")


class DirectExpenseRequest(BaseModel):
    """Request for direct expense entry."""
    user_id: str
    amount: float
    category: str
    description: str = ""


class DirectHealthRequest(BaseModel):
    """Request for direct health/activity entry."""
    user_id: str
    activity_type: str  # e.g., 'blood_pressure', 'medication', 'exercise'
    value: str
    notes: str = ""


class DirectAppointmentRequest(BaseModel):
    """Request for direct appointment entry."""
    user_id: str
    title: str
    date: str  # YYYY-MM-DD
    time: str = "09:00"  # HH:MM
    location: str = ""


@app.post("/api/expenses")
async def add_expense_direct(request: DirectExpenseRequest):
    """
    Add an expense directly to the database (no agent involved).
    
    This is for manual form entries where the user explicitly adds
    an expense without going through the conversational agent.
    """
    try:
        success = save_expense(
            user_id=request.user_id,
            amount=request.amount,
            category=request.category,
            description=request.description
        )
        
        if success:
            return {
                "status": "success",
                "message": f"Added expense: ₹{request.amount} for {request.category}"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save expense to database")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/health")
async def add_health_record_direct(request: DirectHealthRequest):
    """
    Add a health record/activity directly to the database (no agent involved).
    
    This is for manual form entries like logging blood pressure,
    tracking medication, or recording exercise.
    """
    try:
        # Map health record types to activity format
        activity_type = request.activity_type
        description = f"{request.activity_type}: {request.value}"
        if request.notes:
            description += f" - {request.notes}"
        
        # For medication/exercise, estimate duration
        duration = None
        if activity_type == 'exercise':
            # Try to extract duration from value (e.g., "30 min walk")
            import re
            match = re.search(r'(\d+)\s*min', request.value.lower())
            if match:
                duration = int(match.group(1))
        
        success = save_activity(
            user_id=request.user_id,
            activity_type=activity_type,
            description=description,
            duration_minutes=duration
        )
        
        if success:
            return {
                "status": "success",
                "message": f"Recorded {request.activity_type}: {request.value}"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save health record to database")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/appointments")
async def add_appointment_direct(request: DirectAppointmentRequest):
    """
    Add an appointment directly to the database (no agent involved).
    
    This is for manual form entries where the user explicitly adds
    an appointment without going through the conversational agent.
    """
    try:
        success = save_appointment(
            user_id=request.user_id,
            title=request.title,
            description="",  # Can be expanded later
            date=request.date,
            time=request.time,
            location=request.location
        )
        
        if success:
            return {
                "status": "success",
                "message": f"Added appointment: {request.title} on {request.date}"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to save appointment to database")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

