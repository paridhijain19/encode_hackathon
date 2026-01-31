# Amble: AI Companion for Elderly Wellness

**Project Status:** Active Development  
**Architecture Focus:** Agent-based reasoning and memory systems  
**Target Demographic:** Adults 50+ in independent living situations

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Design Philosophy](#design-philosophy)
3. [Why Agent-Based Architecture](#why-agent-based-architecture)
4. [System Architecture](#system-architecture)
5. [Product Vision](#product-vision)
6. [Interface Philosophy](#interface-philosophy)
7. [Current Development Focus](#current-development-focus)
8. [Technical References](#technical-references)

---

## Project Overview

### Problem Statement

Elderly individuals living independently face multiple challenges that compound over time:

- **Routine disruption** goes unnoticed until it becomes critical
- **Emotional changes** are difficult for remote family members to detect
- **Cognitive load** from traditional reminder systems creates stress rather than support
- **Loss of autonomy** through overly interventionist monitoring systems
- **Social isolation** from reduced daily interactions

Existing solutions tend to be either:
- Passive tracking systems that provide data but no understanding
- Alert-heavy reminder systems that treat seniors as forgetful rather than capable
- Medical monitoring tools that pathologize normal aging

### Amble's Approach

Amble is an AI companion system designed to understand behavioral patterns over time and provide gentle, contextual support that preserves independence and dignity.

The system operates on three core principles:

1. **Observation over interrogation** - Understanding through natural conversation rather than explicit data entry
2. **Continuity over alerts** - Detecting gradual changes in routine and well-being rather than reacting to incidents
3. **Agency preservation** - Supporting autonomy rather than replacing decision-making

Amble is explicitly **not** a medical device, diagnostic tool, or emergency response system. It is a companion system that helps maintain daily routines, emotional well-being, and family connection.

---

## Checkpoint 1 Submission

A formal checkpoint overview of the project's scope and submission details is available in the repository documentation. See [Checkpoint 1 Submission](CHECKPOINT_1_SUBMISSION.md) for the full submission content, including problem statement, opportunity, and progress.

### Short Summary for Reviewers

- **Project Name:** Amble — Your gentle companion for daily wellness
- **Tracks:** Health, Fitness & Wellness; Social & Community Impact; Best Use of Opik
- **Project Focus:** Voice-first, low-cognitive-load, non-intrusive companion for elderly users (50+)
- **Key Capabilities:** Mood & wellness tracking, activity suggestions, expense tracking, appointment management, family alerts, long-term memory
- **Current Phase:** Concept development and technical architecture

---

## Design Philosophy

### Why This Is Not a Chatbot

Traditional conversational AI systems operate as stateless or minimally stateful responders. Each interaction is isolated, and context is limited to recent conversation history.

Amble differs fundamentally:

- **Persistent behavioral memory** - The system maintains a continuous understanding of the user's routines, preferences, and emotional patterns
- **Proactive pattern recognition** - Changes in behavior are detected through multi-dimensional analysis rather than explicit complaints
- **Domain specialization** - Different aspects of well-being are handled by specialized reasoning components
- **Tool-based actions** - The system can perform concrete tasks (scheduling, tracking, alerting) rather than only generating text

### Why This Is Not a Reminder System

Reminder systems assume users are forgetful. Amble assumes users are capable but benefit from support in maintaining consistency.

| Traditional Reminder System | Amble's Approach |
|------------------------------|------------------|
| "Take your medication at 9 AM" | Notices when morning routine timing shifts |
| Daily repeating alerts | Contextual check-ins based on observed patterns |
| Treats all users identically | Adapts to individual behavioral baselines |
| User must configure each reminder | Learns routines through observation |
| Creates dependency on alerts | Supports natural habit formation |

### Why Non-Medical Positioning Matters

Medical systems carry regulatory burden, liability concerns, and user anxiety. By positioning Amble as a **wellness companion** rather than a health monitor, the design achieves:

- **Lower cognitive burden** - Users interact conversationally rather than through medical interfaces
- **Reduced anxiety** - Tracking is framed as supportive rather than diagnostic
- **Appropriate family involvement** - Alerts focus on behavioral changes, not medical events
- **Clear scope boundaries** - The system suggests medical consultation rather than attempting diagnosis

---

## Why Agent-Based Architecture

### The Limitations of Monolithic LLM Systems

A single large language model handling all aspects of elderly care would face several problems:

1. **Context dilution** - All domains (mood, expenses, activities, scheduling) compete for limited context window
2. **Inconsistent reasoning** - Domain-specific logic would be implicit in prompts rather than architected
3. **Difficult observability** - Debugging which part of a monolithic system made a decision becomes opaque
4. **Poor scalability** - Adding new capabilities requires rewriting core prompts
5. **No separation of concerns** - Critical functions (family alerts) are not isolated from conversational tasks

### Agent Architecture Benefits

The multi-agent design addresses these issues through:

#### 1. Domain Specialization

Each sub-agent is optimized for specific reasoning:

- **Mood Agent** - Understands emotional language, tracks affective patterns
- **Activity Agent** - Recognizes activity types, suggests contextually appropriate options
- **Wellness Agent** - Analyzes cross-domain patterns to detect concerning changes
- **Expense Agent** - Handles financial categorization and budget awareness
- **Appointment Agent** - Manages temporal reasoning and scheduling conflicts

This specialization means each agent can maintain deep context within its domain without interference.

#### 2. Behavioral Memory Architecture

The system maintains memory at multiple levels:

**Session State** - Immediate conversational context (current mood, today's activities)  
**User Profile State** - Long-term attributes (name, location, interests, health context)  
**Persistent Storage** - Historical data for pattern analysis (mood trends, activity frequency)  
**Explicit Memory** - User-shared facts stored for future reference (family names, preferences)

This layered memory allows the system to:
- Respond naturally to immediate questions ("How was your walk this morning?")
- Reference long-term patterns ("I notice you usually walk on Tuesdays")
- Recall specific personal details ("Your grandson Rahul's birthday is coming up")

#### 3. Tool-Based Execution Model

Rather than generating text descriptions of actions, agents invoke concrete tools:

```
track_mood() → Stores structured emotional data with timestamp
analyze_wellness_patterns() → Runs pattern detection algorithms
send_family_alert() → Triggers notification only when urgency threshold is met
```

This approach ensures:
- **Reliability** - Actions are deterministic functions, not LLM-generated attempts
- **Auditability** - Every action has a clear trace in observability logs
- **Safety** - Critical actions (family alerts) cannot be accidentally triggered through conversation

#### 4. Orchestration and Delegation

The root agent acts as a conversational coordinator, delegating to specialists when needed:

```
User: "I'm feeling a bit lonely today."
  → Root agent recognizes emotional content
  → Delegates to Mood Agent
    → Mood Agent tracks mood with empathetic response
    → Checks recent social activity history
    → Suggests calling family or attending local event
  → Root agent synthesizes response naturally
```

This delegation ensures domain expertise while maintaining conversational coherence.

#### 5. Observability and Debugging

With distributed tracing (Opik integration), every agent interaction is logged:

- Which agent handled which reasoning step
- Which tools were invoked and why
- How long each decision took
- What state was accessed

This visibility is critical for:
- Identifying when agents make incorrect routing decisions
- Detecting when pattern analysis should trigger alerts but doesn't
- Optimizing response times for voice interaction
- Ensuring safety in production deployment

---

## System Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction Layer                   │
│              (Voice/Text via conversational UI)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Root Orchestration Agent                   │
│  • Maintains conversational flow                             │
│  • Routes to domain specialists                              │
│  • Synthesizes responses across agents                       │
│  • Manages user context initialization                       │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬─────────────────┐
         │               │               │                 │
         ▼               ▼               ▼                 ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Mood     │  │  Activity   │  │  Wellness   │  │   Expense   │
│    Agent    │  │    Agent    │  │    Agent    │  │    Agent    │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      Tool Layer                              │
│  • track_mood()           • record_activity()                │
│  • get_mood_history()     • schedule_appointment()           │
│  • analyze_wellness_patterns()                               │
│  • send_family_alert()    • remember_fact()                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Persistence Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Local JSON  │  │ Session State│  │   Memory     │       │
│  │   Storage    │  │   (ADK)      │  │   Service    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Example: Mood Tracking

```
1. User: "I've been feeling tired lately"

2. Root Agent receives input
   └─ Recognizes emotional content
   └─ Delegates to Mood Agent

3. Mood Agent processes
   └─ Analyzes sentiment and energy indicators
   └─ Calls track_mood(mood="tired", energy_level=4)
   └─ Calls get_mood_history(days=7)

4. Tool Execution
   └─ track_mood() writes to data.json
   └─ get_mood_history() reads and analyzes trends
   └─ Returns: "3 low-energy days in past week"

5. Wellness Agent (triggered if pattern threshold met)
   └─ Calls analyze_wellness_patterns()
   └─ Detects: Low energy + Reduced activity
   └─ Generates insight: "Consider suggesting rest"
   └─ May call send_family_alert() if prolonged

6. Root Agent synthesizes response
   └─ Empathetic acknowledgment
   └─ Gentle suggestion (rest, doctor consultation)
   └─ No alarm language
```

### State Management

The system maintains three state layers:

**1. Session State (Transient, Per-Conversation)**
- Current conversation context
- Today's tracked activities
- Immediate mood observations

**2. User Profile State (Persistent, Cross-Session)**
- Name, location, age
- Interests and preferences
- Emergency contacts
- Health context (non-diagnostic)

**3. Historical Data (Persistent, Time-Series)**
- Mood logs with timestamps
- Activity history
- Expense records
- Appointment schedule
- Family alert history

State is synchronized through:
- ADK session management for conversational context
- Local JSON persistence for long-term data
- Memory service integration for semantic recall

### Safety and Autonomy

The architecture includes several design constraints to preserve user agency:

**Tool Guardrails**
- `send_family_alert()` requires explicit urgency classification
- Alerts include justification based on observed patterns
- No automatic medical advice or diagnosis

**Agent Constraints**
- Sub-agents cannot transfer to peers (prevents circular delegation)
- Wellness agent uses multi-day windows to avoid false positives
- Pattern detection requires sustained changes, not isolated incidents

**User Control**
- All tracking tools return confirmation messages
- User can query "What have you noticed about me?" for transparency
- No hidden data collection beyond what's conversationally shared

---

## Product Vision

### What Amble Detects (And Why It Matters)

Traditional monitoring systems look for incidents: falls, missed medications, emergency signals. Amble looks for **gradual changes in behavioral continuity**.

#### Behavioral Continuity Indicators

| Pattern Change | What It Might Indicate | Amble's Response |
|----------------|------------------------|------------------|
| Morning walks shift from 7 AM to 11 AM | Sleep disruption or low morning energy | Gentle check-in, suggest earlier sleep routine |
| Social activities drop from 3/week to 0 | Isolation or mood decline | Suggest calling family, mention local events |
| Conversations become shorter | Disengagement or low energy | More open-ended questions, emotional support |
| Expense tracking stops | Loss of routine consistency | "Haven't seen you log expenses—is everything alright?" |
| Energy levels trend downward | Potential health issue or depression | Suggest doctor consultation, alert family |

These changes often precede crises by weeks. Early detection allows gentle intervention before problems escalate.

### Why This Approach Works

#### 1. Dignity Preservation

By framing support as routine maintenance rather than intervention, users remain in control. The system asks "How was your walk?" rather than "Did you walk today?" The former is a conversation; the latter is surveillance.

#### 2. Trust Building Over Time

Early interactions establish baseline understanding:
- Week 1: Learn routines and preferences
- Week 2-4: Detect individual patterns
- Month 2+: Recognize meaningful deviations

This gradual calibration prevents false alarms and builds user confidence in the system's understanding.

#### 3. Family Connection Without Infantilization

Family members receive meaningful updates, not raw data:

**Bad Alert:** "Mother has not walked in 3 days"  
**Good Alert:** "I've noticed Mom's energy has been lower this week and she's been staying in more. She mentioned feeling a bit tired. Might be worth a call to check in."

The difference:
- Context over data points
- Suggestion over command
- Respect for both user privacy and family concern

#### 4. Non-Intrusive Presence

The system does not demand attention. It participates in natural conversation and offers observations when contextually appropriate.

**Not:** "REMINDER: You should walk today!"  
**Instead:** (During morning chat) "The weather's lovely today. Perfect for a walk in the park if you're feeling up to it."

### What Amble Is Not

**Not a Medical Diagnostic Tool**  
Amble does not interpret symptoms, suggest medications, or replace medical consultation. When health concerns arise, it suggests speaking with a doctor.

**Not an Emergency Response System**  
Amble does not monitor for falls, heart rate, or acute events. It operates on the timescale of days and weeks, not seconds and minutes.

**Not a Replacement for Human Connection**  
Amble facilitates family connection and social engagement but does not replace human relationships. Its goal is to support independence, not substitute companionship.

**Not a Data Harvesting Platform**  
All data remains local. There is no aggregation, no third-party selling, no behavioral advertising. The system exists solely to support the individual user.

---

## Interface Philosophy

### Current Interaction Model

The current implementation uses text-based conversational interaction through a terminal interface. This is intentional for development purposes—focusing on agent reasoning and memory systems before adding interface complexity.

### Long-Term Interface Vision

The eventual interface is designed around three principles:

#### 1. Voice-First Interaction

Voice is the primary modality because:
- No visual learning curve
- Accessible for vision impairments
- Natural for elderly users familiar with phone conversations
- Allows interaction while doing other activities

The agent must support:
- Natural conversation pacing (pauses, corrections, tangents)
- Context retention across multi-turn dialogues
- Empathetic tone modulation

#### 2. Minimal Visual Cognitive Load

When visual elements are present, they exist to **support**, not replace, voice interaction:

- **Ambient indicators** - Subtle visual cues for system status (listening, thinking, speaking)
- **Emotional feedback** - Gentle animations that reinforce empathetic tone
- **Contextual information** - Calendar view when discussing appointments, activity timeline when reviewing patterns

Visual elements must never:
- Require reading small text
- Demand active monitoring
- Present complex decision trees
- Use abstract icons without labels

#### 3. Agent-First Design Philosophy

The system is not a dashboard with AI added. It is an agent that occasionally uses visual representation for clarity.

This inverts traditional UI design:

**Traditional UI:** Interface first, AI assists  
**Amble:** Agent first, visuals clarify when needed

Implications:
- No persistent navigation menus
- No settings screens requiring configuration
- No data visualization dashboards
- Visual elements appear contextually and disappear when not needed

### Why Defer UI Implementation

Interface design for elderly users requires:
- Extensive usability testing
- Accessibility compliance
- Cultural and linguistic adaptation
- Hardware integration (smart speakers, tablets)

These concerns are orthogonal to agent reasoning quality. Building the intelligence layer first ensures that when the interface is developed, it exposes a system worth interacting with.

Current development prioritizes:
- Agent reasoning reliability
- Memory coherence over time
- Pattern detection accuracy
- Tool execution safety

Once these foundations are solid, interface development can proceed with confidence that the underlying system is trustworthy.

---

## Current Development Focus

### Active Development Areas

**1. Agent Reasoning and Orchestration**
- Refining when root agent delegates vs. handles directly
- Improving sub-agent specialization and tool selection
- Optimizing conversational flow across agent handoffs

**2. Memory System Design**
- Balancing session state vs. persistent storage
- Implementing semantic search over long-term memories
- Designing memory pruning strategies (what to keep, what to summarize)

**3. Behavioral Pattern Detection**
- Wellness pattern analysis algorithms
- Threshold tuning for family alerts (avoiding false positives)
- Multi-dimensional pattern correlation (mood + activity + social)

**4. Tool Execution and Safety**
- Guardrails for family alert generation
- Rollback mechanisms for incorrect data entry
- Audit logging for all state-changing operations

**5. Observability and Debugging**
- Opik tracing integration for production monitoring
- Agent decision visualization
- Performance profiling for voice-compatible latency

### Intentionally Deferred

**User Interface Development**  
The system currently operates through a terminal-based conversational interface. Visual UI, voice integration, and embodiment design are intentionally deferred until agent reasoning is production-ready.

**Multi-User Support**  
Current implementation assumes single-user deployment. Multi-tenancy, user authentication, and data isolation will be added when needed for scaling.

**External Integrations**  
Google Search is integrated for local event discovery. Additional integrations (calendar sync, health APIs, smart home devices) are planned but not prioritized over core agent functionality.

**Real-Time Alerting**  
Family alerts currently log to local storage. Webhook delivery, SMS, and push notification infrastructure will be added when alert logic is validated.

### Why This Phased Approach

Building agent systems requires different expertise than building UIs. By separating concerns:

**Benefit 1: Faster Iteration on Intelligence**  
Agent prompts, tool design, and memory strategies can be tested rapidly without UI dependencies.

**Benefit 2: Platform Independence**  
Once the agent layer is solid, the same backend can support web UI, mobile app, smart speaker integration, or physical embodiment.

**Benefit 3: Focused Debugging**  
Issues with agent reasoning are not conflated with issues in interface design. Observability focuses on decision quality, not interaction design.

**Benefit 4: Safer Deployment**  
The system will not be deployed to real elderly users until agent behavior is validated in extended testing. Premature UI polish creates pressure to deploy before readiness.

---

## Technical References

### Architecture Documentation

Detailed technical architecture, control flow, and codebase analysis:  
**[Agent Architecture Documentation](agent/AGENT_ARCHITECTURE.md)**

### Implementation Details

The agent system is implemented using:
- **Google ADK (Agent Development Kit)** for agent orchestration
- **Gemini 2.0/2.5 Flash** language models
- **Comet Opik** for distributed tracing
- **Python** with asyncio for asynchronous execution
- **Pydantic** for structured data validation
- **Local JSON** for persistence (development phase)

### Repository Structure

```
encode_hackathon/
├── agent/                    # Core agent implementation
│   ├── agent.py              # Root and sub-agent definitions
│   ├── tools.py              # Tool function implementations
│   ├── prompts.py            # Agent instruction prompts
│   ├── models.py             # Pydantic data schemas
│   ├── opik_agent.py         # Local CLI runner
│   ├── data.json             # Local persistence
│   └── profiles/             # Default user personas
├── doc/                      # Project documentation
│   ├── PROJECT_OVERVIEW.md   # This document
│   └── agent/                # Technical architecture docs
└── src/                      # (Future) UI components
```

### Running the System

Current development environment:

```bash
cd encode_hackathon
python -m agent.opik_agent
```

Requires:
- Python 3.10+
- Google API key (Gemini access)
- Opik credentials (optional, for tracing)

---

## Future Directions

### Short-Term (Next 3 Months)

- Refine wellness pattern detection algorithms
- Implement semantic memory search
- Add appointment reminder logic
- Validate family alert thresholds through extended testing

### Medium-Term (3-6 Months)

- Voice interface integration
- Multi-user deployment architecture
- Real-time family notification delivery
- Calendar and health device integrations

### Long-Term (6+ Months)

- Embodied interface exploration (2D/3D avatar)
- Multi-modal interaction (voice + gesture + visual)
- Longitudinal behavioral analysis (months/years of data)
- Family dashboard for pattern visualization

### Research Questions

The project raises several open questions:

**1. Optimal Alert Thresholds**  
How sensitive should pattern detection be? False negatives risk missing problems; false positives cause alert fatigue.

**2. Memory Decay Strategies**  
What should the system remember long-term vs. summarize vs. forget? Infinite memory creates context overload.

**3. Cultural Adaptation**  
How do behavioral norms differ across cultures, and how should the agent adapt? Indian elderly users have different routines and family structures than Western users.

**4. Trust Calibration**  
How long does it take users to trust the agent with sensitive information, and what builds that trust?

These questions will inform future development as the system matures.

---

**Document Version:** 1.0  
**Last Updated:** January 31, 2026  
**Maintainer:** Amble Development Team
