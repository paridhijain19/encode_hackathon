# Amble - Elder Care and Connection Agent

Amble helps elderly individuals (50+) maintain healthy routines and stay connected with family through an intelligent AI companion. For seniors, it offers voice-first interactions for tracking expenses, discovering local activities, managing health reminders, and connecting with loved ones, no complex tech required. For their families living far away, it provides a peace-of-mind dashboard with wellness insights and smart alerts. Unlike simple reminder apps, Amble's AI agents learn and adapt understanding conversational English, proactively discovering relevant activities, detecting concerning patterns, and coordinating family communication. Built for the global context where elderly parents increasingly live independently while children work in different cities, Amble transforms isolation into connection and worry into assurance.

## AI Agent & Capabilities

Amble is powered by an intelligent AI companion that understands context, remembers conversations, and proactively helps seniors maintain independence and wellness.

### Core AI Capabilities

**Conversational Intelligence**: Processes natural English, understands user intent, and provides empathetic, culturally-aware responses. Adapts communication style based on user preferences.

**Long-Term Memory & Learning**: Uses Mem0 for semantic memory to remember past conversations, personal details, and behavioral patterns. Maintains context across sessions for continuous personalization.

**Proactive Discovery**: Searches for local events and activities, provides intelligent recommendations based on time, interests, and preferences. Integrates web search through an isolated search agent architecture.

**Pattern Detection & Wellness Analysis**: Detects concerning changes in mood, activity levels, and routines. Identifies unusual spending patterns and monitors wellness trends. Generates smart alerts to family only when truly relevant.

**Multi-Modal Tool Integration**: Orchestrates expense tracking, activity logging, mood monitoring, appointment management, family connections, and local discovery through natural conversation.

### AI Architecture

- **Root Agent**: Main conversational agent with comprehensive tool access
- **Search Agent**: Isolated agent for web search (ensures stability with Gemini ADK)
- **Memory Integration**: Mem0 for semantic memory storage and retrieval
- **Observability**: Comet Opik for distributed tracing and performance metrics

## Features

**For Elderly Parents**: Voice-first budget management, AI-powered activity discovery, smart health reminders, family connection tools, and a conversational interface requiring no complex tech.

**For Adult Children**: Live activity feed, AI-generated spending insights, smart alerts for important updates, wellness dashboard with pattern analysis, and family coordination tools.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
1. Clone the repository and navigate to the project folder.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Access the application at:
   - Landing Page: http://localhost:5173
   - Parent Portal: http://localhost:5173/parent
   - Family Dashboard: http://localhost:5173/family

## Technical Stack

**Frontend**: React 18, React Router, Vite, Lucide React, CSS

**AI & Backend**: Google ADK (Agent Development Kit), Gemini Models, Mem0 (semantic memory), Comet Opik (observability), Supabase (database), FastAPI/Uvicorn, Python

## AI Memory System (Mem0 Integration)

The AI agent uses Mem0 for long-term semantic memory. After each conversation, messages are saved to Mem0. Before each agent invocation, the system performs semantic search to find the top 5 most relevant past memories, which are injected into the agent context. This enables conversational continuity, personalization, and contextual understanding across sessions.


## AI Observability (Opik Integration)

The AI agent's performance is monitored using Comet Opik for distributed tracing and metrics. Tracked metrics include memory hits, response length, and user message length. 

## Backend API

### Running the Server
```bash
cd encode_hackathon
pip install -r requirements.txt
uvicorn agent.server:app --reload --port 8000
```

### Endpoints

#### Health Check
```bash
GET /
```

#### AI Chat Endpoint
Interact with the AI companion agent:

```bash
POST /chat
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "user_id": "user123",
  "session_id": null  # optional
}
```

Response:
```json
{
  "response": "Hello! I'm doing well...",
  "session_id": "abc123",
  "user_id": "user123",
  "memories_used": 2
}
```

The AI agent automatically retrieves relevant memories, understands natural language intent, selects appropriate tools, provides empathetic responses, and saves conversation context.

### Search Architecture

Web search is implemented as an isolated AI agent wrapped using AgentTool, ensuring stability while allowing the main reasoning agent to remain deterministic and memory-safe. This prevents conflicts between Google's built-in search tools and custom function tools.


---



## License
This project is licensed under the MIT License.

---
Made for families everywhere.
