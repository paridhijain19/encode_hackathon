# Amble Companion Agent - Architecture & Technical Documentation

> **Last Updated:** January 2026  
> **Target Audience:** Future maintainers and developers  
> **Codebase Location:** `agent/` directory

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [High-Level Architecture](#2-high-level-architecture)
3. [File Structure & Contributions](#3-file-structure--contributions)
4. [Agent Hierarchy & Orchestration](#4-agent-hierarchy--orchestration)
5. [Control Flow & Execution](#5-control-flow--execution)
6. [State Management](#6-state-management)
7. [Tool System](#7-tool-system)
8. [Data Persistence](#8-data-persistence)
9. [Observability & Tracing](#9-observability--tracing)
10. [Extension Guide](#10-extension-guide)
11. [Appendix: Key Assumptions & Unclear Areas](#11-appendix-key-assumptions--unclear-areas)

---

## 1. Problem Statement

### What This Agent Solves

**Amble** is an AI-powered companion agent designed specifically for **elderly individuals (50+)**. It addresses several key challenges faced by seniors:

| Challenge | How Amble Addresses It |
|-----------|------------------------|
| **Loneliness & Social Isolation** | Provides warm, empathetic daily conversations and tracks social interactions |
| **Health Management** | Tracks moods, activities, wellness patterns; schedules medical appointments |
| **Financial Oversight** | Helps track daily expenses with simple conversational interface |
| **Cognitive Engagement** | Suggests activities, finds local events, maintains long-term memory of user |
| **Family Connection** | Sends smart alerts to family members about concerning wellness patterns |

### Target User Persona

Based on the code, the target user is:
- **Age:** 50+ (explicitly mentioned in prompts)
- **Location:** India (default: Mumbai; currency: ₹; cultural awareness for Indian festivals)
- **Technical Proficiency:** Low (voice-first design, simple conversational interface)
- **Primary Need:** Independence with remote family support

---

## 2. High-Level Architecture

### Technology Stack

| Component | Technology |
|-----------|------------|
| **Agent Framework** | Google ADK (Agent Development Kit) |
| **LLM Models** | Gemini 2.0/2.5 Flash variants |
| **Observability** | Comet Opik Tracer |
| **Data Persistence** | Local JSON file (`data.json`) |
| **Configuration** | Environment variables (`.env`) |
| **Runtime** | Python async (asyncio) |

### Architecture Diagram (Conceptual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                    │
│                     (Text/Voice via UI)                              │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ROOT AGENT (amble_text)                          │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Callbacks:                                                      │ │
│  │  - initialize_user_context (before)                              │ │
│  │  - auto_save_session_to_memory (after)                           │ │
│  │  - Opik tracing callbacks                                        │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                     DIRECT TOOLS                                  │ │
│  │  - User Profile    - Expenses      - Moods                       │ │
│  │  - Activities      - Appointments  - Wellness                    │ │
│  │  - Memory          - Google Search - Daily Summary               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │               SUB-AGENTS (Specialists)                           │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │ │
│  │  │  Mood   │ │Activity │ │Expense  │ │Appoint- │ │Wellness │    │ │
│  │  │  Agent  │ │ Agent   │ │ Agent   │ │  ment   │ │ Agent   │    │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘    │ │
│  │  ┌─────────┐                                                     │ │
│  │  │ Local   │                                                     │ │
│  │  │ Events  │                                                     │ │
│  │  └─────────┘                                                     │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                       │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────────┐       │
│  │  data.json   │  │ default_       │  │ ADK Session State  │       │
│  │ (persistence)│  │ persona.json   │  │ (in-memory)        │       │
│  └──────────────┘  └────────────────┘  └────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure & Contributions

### Core Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| [agent.py](agent.py) | **Main entry point** - Defines root agent, sub-agents, orchestration logic | `root_agent`, `opik_tracer`, `initialize_user_context` |
| [tools.py](tools.py) | **Tool definitions** - All callable functions the agent can use | 20+ tool functions (tracking, scheduling, memory, etc.) |
| [prompts.py](prompts.py) | **System prompts** - Persona definitions for each agent | `ROOT_AGENT_INSTRUCTION`, `*_AGENT_INSTRUCTION` |
| [models.py](models.py) | **Data models** - Pydantic schemas for structured data | `UserProfile`, `MoodEntry`, `ExpenseEntry`, etc. |
| [opik_agent.py](opik_agent.py) | **Local runner** - Interactive CLI interface with Rich UI | `run_chat_session()`, `main()` |
| [opik.py](opik.py) | **Demo/Example** - Recipe agent demo (separate from main agent) | Recipe pipeline example |

### Data Files

| File | Purpose |
|------|---------|
| [data.json](data.json) | Persistent storage for all user data (expenses, moods, activities, etc.) |
| [profiles/default_persona.json](profiles/default_persona.json) | Default user profile and initial memories for new users |
| `.env` | Environment configuration (API keys, etc.) |

### File Dependency Graph

```
__init__.py
    └── agent.py
            ├── tools.py (tool functions)
            ├── prompts.py (instructions)
            ├── models.py (data types - imported but not directly used in agent.py)
            └── opik_tracer (from opik integration)

opik_agent.py (standalone runner)
    └── agent.py (imports root_agent, opik_tracer)

opik.py (separate demo - not part of main agent)
```

---

## 4. Agent Hierarchy & Orchestration

### Root Agent

**Name:** `amble_text`  
**Type:** `Agent` (Google ADK)  
**Model:** `gemini-2.5-flash`

The root agent is the primary orchestrator. It:
1. Receives all user messages
2. Determines whether to handle directly or delegate to sub-agents
3. Has access to ALL tools (can bypass sub-agents)
4. Manages callbacks for context initialization and memory persistence

### Sub-Agents (Specialists)

Each sub-agent is specialized for a domain. They are defined but **explicitly noted as having `disallow_transfer_to_peers=True`**, meaning:
- Sub-agents cannot delegate to each other
- They must return control to the root agent

| Sub-Agent | Model | Specialization | Tools |
|-----------|-------|----------------|-------|
| `mood_agent` | gemini-2.5-flash | Emotional wellness, mood tracking | `track_mood`, `get_mood_history` |
| `activity_agent` | gemini-2.5-flash | Daily activities, suggestions, local events | `record_activity`, `get_activity_history`, `get_activity_suggestions`, `google_search` |
| `expense_agent` | gemini-2.5-flash | Financial tracking | `track_expense`, `get_expense_summary` |
| `appointment_agent` | gemini-2.5-flash | Schedule management | `schedule_appointment`, `get_upcoming_appointments`, `cancel_appointment` |
| `wellness_agent` | gemini-2.5-flash (reasoning) | Pattern detection, family alerts | `analyze_wellness_patterns`, `send_family_alert`, `get_family_alerts_history`, `get_mood_history`, `get_activity_history` |
| `local_events_agent` | gemini-2.5-flash | Local event discovery | `google_search` |

### Agent Instantiation Pattern

All agents follow this pattern (explicit from code):

```python
LlmAgent(
    name="agent_name",
    model=MODEL_STANDARD,
    description="Brief description for routing decisions",
    instruction=AGENT_INSTRUCTION,  # From prompts.py
    tools=[...],                     # Subset of tools
    output_key="response_key",       # For state storage
    disallow_transfer_to_peers=True, # No peer delegation
    **OPIK_CALLBACKS                 # Observability hooks
)
```

> **Note:** Sub-agents are defined in [agent.py](agent.py) but **are not explicitly passed to root_agent as `sub_agents`**. This means the root agent operates primarily through direct tool calls, with sub-agents available for potential delegation through ADK's routing system. *This is an ambiguity in the codebase.*

---

## 5. Control Flow & Execution

### Startup Flow (via opik_agent.py)

```
1. main()
   └── asyncio.run(run_chat_session())

2. run_chat_session()
   ├── Create InMemoryRunner(agent=root_agent)
   ├── Create session via runner.session_service
   └── Enter chat loop

3. Chat Loop (per message):
   ├── Get user input
   ├── Create types.Content message
   ├── runner.run_async() → yields events
   │   ├── [before_agent_callback] → initialize_user_context()
   │   ├── [LLM Processing] → Gemini generates response/tool calls
   │   ├── [Tool Execution] → If tools called
   │   ├── [after_agent_callback] → auto_save_session_to_memory_callback()
   │   └── Yield content events
   └── Display response via Rich panels

4. Cleanup:
   └── opik_tracer.flush() → Send traces to Opik
```

### Agent Reasoning Flow (Per Turn)

```
User Message
    │
    ▼
┌─────────────────────────────────────────┐
│  initialize_user_context() (callback)   │
│  - Load user profile from data.json     │
│  - Or load from default_persona.json    │
│  - Set user:* state variables           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  ROOT_AGENT_INSTRUCTION                 │
│  (Prompt with {user:name}, etc.)        │
│  + User Message                          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  LLM Reasoning (Gemini)                  │
│  Decides:                                │
│  - Generate direct response?             │
│  - Call tool(s)?                         │
│  - Delegate to sub-agent?               │
└─────────────────────────────────────────┘
    │
    ├──────────────────┬─────────────────┐
    │                  │                 │
    ▼                  ▼                 ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ Direct   │    │ Tool     │    │ Sub-Agent│
│ Response │    │ Call     │    │ Delegate │
└──────────┘    └──────────┘    └──────────┘
    │                  │                 │
    │                  ▼                 │
    │          ┌──────────────┐          │
    │          │ tools.py     │          │
    │          │ function     │          │
    │          │ execution    │          │
    │          └──────────────┘          │
    │                  │                 │
    └──────────────────┴─────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────┐
│  auto_save_session_to_memory_callback() │
│  (Saves to ADK memory service)          │
└─────────────────────────────────────────┘
                       │
                       ▼
              Final Response to User
```

---

## 6. State Management

### State Layers

The agent uses **three layers of state**:

#### 1. ADK Session State (Transient, Cross-Turn)

Managed via `CallbackContext.state` and `ToolContext.state`.

| Key Pattern | Example | Scope |
|-------------|---------|-------|
| `user:*` | `user:name`, `user:location`, `user:interests` | Cross-session (persisted if using DB backend) |
| `current_time` | Current timestamp | Per-turn |
| `user:initialized` | Boolean flag | Cross-session |

**Explicit Usage (from code):**

```python
# In initialize_user_context():
callback_context.state["user:name"] = profile.get("name", "Friend")
callback_context.state["user:location"] = profile.get("location", "Mumbai, India")
callback_context.state["user:interests"] = ", ".join(profile.get("interests", []))
callback_context.state["user:initialized"] = True
```

#### 2. Local JSON Storage (Persistent)

File: [data.json](data.json)

```json
{
    "user_profile": { ... },
    "expenses": [ ... ],
    "moods": [ ... ],
    "activities": [ ... ],
    "appointments": [ ... ],
    "family_alerts": [ ... ],
    "long_term_memory": [ ... ]
}
```

**Access Pattern:**
```python
data = _load_data()  # Read from file
# Modify data...
_save_data(data)     # Write back
```

#### 3. Default Persona (Bootstrap)

File: [profiles/default_persona.json](profiles/default_persona.json)

Used **only** when:
- `user:initialized` is not set
- `data.json` has no `user_profile`

Contains:
- Default user profile
- Initial memories to seed the agent's knowledge

### State Initialization Priority

```
1. Check user:initialized in session state
   └── If True → Skip initialization, just update current_time

2. Load from data.json
   └── If user_profile exists → Use it

3. Load from default_persona.json
   └── If state.user_profile exists → Use it
   └── Save to data.json for future persistence

4. Fallback defaults (hardcoded)
   └── name: "Friend", location: "your city", age: 60
```

---

## 7. Tool System

### Tool Architecture

All tools are defined in [tools.py](tools.py) as **plain Python functions** with:
- Type hints for parameters
- Docstrings (used by LLM for understanding)
- `tool_context: ToolContext` parameter for state access

### Tool Categories

#### User Profile Tools

| Tool | Purpose |
|------|---------|
| `update_user_profile()` | Updates and persists user profile |
| `get_user_profile()` | Retrieves current profile from state |

#### Tracking Tools

| Tool | Purpose |
|------|---------|
| `track_expense()` | Logs expense with amount, category, description |
| `get_expense_summary()` | Aggregates expenses by period (today/week/month) |
| `track_mood()` | Records mood and energy level with empathetic response |
| `get_mood_history()` | Analyzes mood trends over N days |
| `record_activity()` | Logs activity with type, duration, notes |
| `get_activity_history()` | Summarizes activities by type |

#### Scheduling Tools

| Tool | Purpose |
|------|---------|
| `schedule_appointment()` | Creates appointment with full details |
| `get_upcoming_appointments()` | Lists appointments within N days |
| `cancel_appointment()` | Marks appointment as cancelled |

#### Wellness & Alerts

| Tool | Purpose |
|------|---------|
| `analyze_wellness_patterns()` | Detects concerning patterns across all data |
| `send_family_alert()` | Sends notification to family (logged, not actually sent) |
| `get_family_alerts_history()` | Lists past alerts |

#### Suggestions & Summary

| Tool | Purpose |
|------|---------|
| `get_activity_suggestions()` | Returns context for LLM to generate suggestions |
| `get_daily_summary()` | Aggregates today's activities, mood, expenses |

#### Memory Tools

| Tool | Purpose |
|------|---------|
| `remember_fact()` | Stores arbitrary facts (e.g., "My grandson is Rahul") |
| `recall_memories()` | Retrieves facts by query or category |

### Tool Response Pattern

All tools return a dictionary with:

```python
{
    "status": "success" | "not_found" | "error",
    "message": "Human-readable response for the agent to relay",
    # ... additional data fields
}
```

### External Tools

| Tool | Source |
|------|--------|
| `google_search` | `google.adk.tools.google_search_tool` |

---

## 8. Data Persistence

### Data Flow Diagram

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│    User Input   │ ──▶  │  Agent Process  │ ──▶  │   Tool Call     │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  _load_data()   │
                                                  │  Read data.json │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  Modify Data    │
                                                  │  (append/update)│
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  _save_data()   │
                                                  │  Write data.json│
                                                  └─────────────────┘
```

### Data Schema (data.json)

```javascript
{
  "user_profile": {
    "name": string,
    "age": number,
    "location": string,
    "interests": string[],
    "health_conditions": string[],
    "emergency_contact_name": string,
    "emergency_contact_phone": string
  },
  "expenses": [
    {
      "timestamp": ISO8601,
      "amount": number,
      "category": string,
      "description": string
    }
  ],
  "moods": [
    {
      "timestamp": ISO8601,
      "mood": MoodType,
      "energy_level": 1-10,
      "details": string
    }
  ],
  "activities": [
    {
      "timestamp": ISO8601,
      "activity_name": string,
      "activity_type": ActivityType,
      "duration_minutes": number,
      "notes": string
    }
  ],
  "appointments": [
    {
      "id": number,
      "created_at": ISO8601,
      "title": string,
      "appointment_type": AppointmentType,
      "date_time": ISO8601,
      "location": string,
      "doctor_name": string,
      "notes": string,
      "status": "scheduled" | "cancelled",
      "reminder_sent": boolean
    }
  ],
  "family_alerts": [
    {
      "timestamp": ISO8601,
      "message": string,
      "urgency": "low" | "medium" | "high" | "critical",
      "category": string,
      "status": "sent"
    }
  ],
  "long_term_memory": [
    {
      "timestamp": ISO8601,
      "fact": string,
      "category": "preference" | "family" | "history" | "general"
    }
  ]
}
```

---

## 9. Observability & Tracing

### Opik Integration

**Purpose:** Distributed tracing and observability for agent execution.

**Configuration (from code):**

```python
opik_tracer = OpikTracer(
    project_name="amble-companion",
    metadata={
        "environment": "development",
        "agent_type": "elderly-companion"
    }
)
```

### Callback Injection

Every agent receives these callbacks:

```python
OPIK_CALLBACKS = {
    "before_agent_callback": opik_tracer.before_agent_callback,
    "after_agent_callback": opik_tracer.after_agent_callback,
    "before_model_callback": opik_tracer.before_model_callback,
    "after_model_callback": opik_tracer.after_model_callback,
    "before_tool_callback": opik_tracer.before_tool_callback,
    "after_tool_callback": opik_tracer.after_tool_callback,
}
```

### Trace Lifecycle

```
Agent Start ──▶ before_agent_callback
    │
    ▼
Model Call ──▶ before_model_callback ──▶ LLM ──▶ after_model_callback
    │
    ▼
Tool Call ──▶ before_tool_callback ──▶ Function ──▶ after_tool_callback
    │
    ▼
Agent End ──▶ after_agent_callback
    │
    ▼
Session End ──▶ opik_tracer.flush()
```

---

## 10. Extension Guide

### Adding a New Tool

1. **Define the function in [tools.py](tools.py):**

```python
def new_tool_name(
    tool_context: ToolContext,
    required_param: str,
    optional_param: int = 10
) -> dict:
    """
    Clear description for the LLM to understand when to use this tool.
    
    Args:
        required_param: Description of what this parameter does
        optional_param: Description with default behavior
        tool_context: ADK tool context (always include)
    
    Returns:
        dict: Response with status and message
    """
    data = _load_data()
    
    # Your logic here...
    
    _save_data(data)
    
    return {
        "status": "success",
        "message": "Human-friendly response"
    }
```

2. **Import and register in [agent.py](agent.py):**

```python
from agent.tools import new_tool_name

# Add to root_agent tools list:
root_agent = Agent(
    ...
    tools=[
        ...,
        new_tool_name,  # Add here
    ],
    ...
)
```

3. **Optionally add to relevant sub-agent** if domain-specific.

### Adding a New Sub-Agent

1. **Define the instruction in [prompts.py](prompts.py):**

```python
NEW_AGENT_INSTRUCTION = """
You are the [Name] sub-agent of Amble, specialized in [domain].

Your role:
1. ...
2. ...

Always maintain a warm, caring tone.
"""
```

2. **Create the agent in [agent.py](agent.py):**

```python
new_agent = LlmAgent(
    name="new_agent",
    model=MODEL_STANDARD,
    description="Brief description for routing",
    instruction=NEW_AGENT_INSTRUCTION,
    tools=[relevant_tool1, relevant_tool2],
    output_key="new_response",
    disallow_transfer_to_peers=True,
    **OPIK_CALLBACKS
)
```

3. **Add to root agent's sub_agents** (if using delegation):

```python
root_agent = Agent(
    ...
    sub_agents=[new_agent, ...],  # Add here
    ...
)
```

### Adding New Data Types

1. **Define Pydantic model in [models.py](models.py):**

```python
class NewDataEntry(BaseModel):
    """Description of this data type"""
    field1: str = Field(description="What this field represents")
    field2: Optional[int] = Field(default=None, description="Optional field")
```

2. **Add enum if needed:**

```python
class NewCategory(str, Enum):
    OPTION_A = "option_a"
    OPTION_B = "option_b"
```

3. **Update data.json schema** by adding to `_load_data()` defaults:

```python
def _load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        return {
            ...,
            "new_data_type": [],  # Add here
        }
```

### Modifying Agent Personality

Edit [prompts.py](prompts.py):

- **ROOT_AGENT_INSTRUCTION** - Main personality, tone, capabilities
- **Domain-specific instructions** - Sub-agent behaviors

Key personality variables:
- `{user:name}` - User's name
- `{user:location}` - User's location
- `{user:interests}` - User's interests
- `{current_time}` - Current timestamp

---

## 11. Appendix: Key Assumptions & Unclear Areas

### Confirmed (Explicit in Code)

| Aspect | Evidence |
|--------|----------|
| Target audience is elderly (50+) | Prompt explicitly states "AI companion designed for elderly individuals (50+)" |
| Currency is Indian Rupees | `₹` symbol used in expense tracking |
| Single-user design | One `data.json` file, no user ID partitioning |
| Voice-first design intent | "Voice-First Design" mentioned in prompts |
| Sub-agents cannot transfer to peers | `disallow_transfer_to_peers=True` on all sub-agents |

### Inferred (Not Explicit)

| Aspect | Inference | Basis |
|--------|-----------|-------|
| Sub-agents may not be actively used | Root agent has ALL tools directly | Sub-agents defined but not clearly passed to root's `sub_agents` parameter |
| Family alerts are logged, not sent | `print()` statement in `send_family_alert()` | No actual notification integration visible |
| Memory service may be unused | `InMemoryMemoryService` imported but not explicitly configured in runner | Memory callback exists but runner uses defaults |

### Unclear Areas

1. **Sub-Agent Routing:** The code defines 6 sub-agents but the `root_agent` instantiation doesn't explicitly pass them as `sub_agents`. It's unclear if ADK auto-discovers them or if they're unused.

2. **Voice Integration:** The prompt mentions "Voice-First Design" but [opik_agent.py](opik_agent.py) is text-based. Voice integration may be handled elsewhere (likely frontend).

3. **Family Notification Delivery:** `send_family_alert()` logs to console and `data.json` but doesn't actually send notifications. Real implementation would need webhook/SMS/push integration.

4. **Session Persistence:** The code uses `"user:"` prefix for cross-session persistence, but `InMemoryRunner` doesn't persist across restarts. Would need `DatabaseSessionService` for true persistence.

5. **MODEL_LIVE:** `gemini-2.0-flash-live-001` is defined but never used. May be intended for real-time/streaming features.

---

## Quick Reference

### Running the Agent Locally

```bash
cd encode_hackathon
python -m agent.opik_agent
```

### Environment Variables Required

```env
GOOGLE_API_KEY=your_gemini_api_key
# Opik credentials (if using cloud tracing)
```

### Key Files to Edit for Common Tasks

| Task | File(s) |
|------|---------|
| Add new tool | [tools.py](tools.py), [agent.py](agent.py) |
| Change personality | [prompts.py](prompts.py) |
| Add data schema | [models.py](models.py), [tools.py](tools.py) |
| Modify default user | [profiles/default_persona.json](profiles/default_persona.json) |
| Add sub-agent | [prompts.py](prompts.py), [agent.py](agent.py) |

---

*This documentation was generated through code analysis only. No runtime testing was performed.*
