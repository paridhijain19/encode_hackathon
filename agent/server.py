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
from contextlib import asynccontextmanager
from typing import Optional, List

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
    # Data from data.json
    expenses: List[dict] = []
    activities: List[dict] = []
    appointments: List[dict] = []
    moods: List[dict] = []
    user_profile: dict = {}
    last_updated: Optional[str] = None


# ==================== STATE ====================

# Global runner instance (initialized on startup)
runner: Optional[InMemoryRunner] = None

# Simple session store
sessions: dict[str, str] = {}  # user_id -> session_id


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
        print(f"⚠ Failed to save memory: {e}")
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
        # Mem0 API v2 requires filters as a dict parameter
        results = mem0_client.search(
            query=query,
            filters={"user_id": user_id},
            limit=limit
        )
        
        # Handle empty results gracefully
        if not results:
            return []
        
        # Results is a list of memory objects
        # Each has 'memory' (text), 'id', 'score', etc.
        return results if isinstance(results, list) else []
    except Exception as e:
        print(f"⚠ Failed to search memory: {e}")
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
    
    yield
    
    # Shutdown
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

async def get_or_create_session(user_id: str) -> str:
    """Get existing session or create new one for user."""
    global runner, sessions
    
    if user_id in sessions:
        return sessions[user_id]
    
    # Create new session
    session = await runner.session_service.create_session(
        app_name="amble-api",
        user_id=user_id
    )
    sessions[user_id] = session.id
    return session.id


async def run_agent(user_id: str, session_id: str, message: str, memory_context: str = "") -> str:
    """
    Run agent and collect response text.
    
    Args:
        user_id: User identifier
        session_id: ADK session ID
        message: User's message
        memory_context: Optional formatted memory context to prepend
    
    Returns:
        Agent's response text
    """
    global runner
    
    # Prepend memory context to the message if available
    # This allows the agent to see relevant past memories
    full_message = memory_context + message if memory_context else message
    
    content = types.Content(
        role="user",
        parts=[types.Part(text=full_message)]
    )
    
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


# ==================== ENDPOINTS ====================

@app.get("/")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "agent": "amble"}


@app.get("/api/state", response_model=StateResponse)
async def get_state(user_id: str = "default_user"):
    """
    Get current agent state for polling.
    
    Returns:
        Agent status, session info, memory count, and data from data.json.
    """
    global runner, sessions, mem0_client
    
    # Import tools to load data
    from agent.tools import _load_data
    from datetime import datetime
    
    # Load data from data.json
    data = _load_data()
    
    # Count memories for this user
    memory_count = 0
    if mem0_client is not None:
        try:
            # Get all memories for this user (use a broad search)
            memories = mem0_client.get_all(user_id=user_id, limit=100)
            memory_count = len(memories) if memories else 0
        except Exception:
            pass  # Don't fail if memory count fails
    
    return StateResponse(
        status="ok",
        user_id=user_id,
        session_id=sessions.get(user_id),
        memory_count=memory_count,
        agent_ready=runner is not None,
        # Data from data.json (last 20 items for lists)
        expenses=data.get("expenses", [])[-20:],
        activities=data.get("activities", [])[-20:],
        appointments=data.get("appointments", []),
        moods=data.get("moods", [])[-10:],
        user_profile=data.get("user_profile", {}),
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
    global runner
    
    if runner is None:
        raise HTTPException(status_code=503, detail="Agent not initialized")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        # Get or create session
        session_id = request.session_id or await get_or_create_session(request.user_id)
        
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
        
        return ChatResponse(
            response=response_text,
            session_id=session_id,
            user_id=request.user_id,
            memories_used=len(memories)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== MAIN ====================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
