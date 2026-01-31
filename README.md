# Amble - Elder Care and Connection Agent

Amble is a web application designed to help elderly parents live independently while keeping their adult children connected and informed.

## Features

### For Elderly Parents
- Voice-Based Budget Management: Record expenses through voice commands.
- Activity Discovery: Find local groups and events.
- Health Reminders: Schedules for medicine and appointments.
- Family Connection: Simple controls for calling and sharing photos.

### For Adult Children
- Live Activity Feed: Monitor daily activities and events.
- Spending Insights: Track how funds are being used.
- Smart Alerts: Receive notifications for important updates.
- Family Coordination: Manage visits and responsibilities with siblings.

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

## Project Structure
- src/pages: Application screens (Landing, Parent Portal, Family Dashboard).
- src/components: Reusable UI components.
- src/index.css: Core design system and global styles.

## Technical Stack
- React 18: UI development.
- React Router: Navigation.
- Vite: Build tool.
- Lucide React: Icons.
- CSS: Styling with variables for consistent design.

## Future Plans
- Voice Recognition Integration using Web Speech API.
- Real-time notifications for alerts.
- Video calling integration.

---

## 🧠 Memory System (Mem0 Integration)

Amble uses **Mem0** for long-term semantic memory, allowing the agent to remember users across sessions.

### How It Works
1. **Store**: After each conversation turn, both user message and agent response are saved to Mem0 with `user_id` scope.
2. **Retrieve**: Before each agent invocation, the system performs a semantic search to find the top 5 most relevant past memories.
3. **Inject**: Retrieved memories are prepended to the agent context, giving the agent awareness of past conversations.

### Why This Matters
- **Continuity**: Seniors don't need to repeat themselves ("My daughter lives in Pune").
- **Personalization**: The agent learns preferences, health conditions, and family details over time.
- **Measurable**: Memory hits are logged via Opik for evaluation.

### Environment Variables
```bash
MEM0_API_KEY=your_mem0_api_key
```

---

## 🔍 Observability (Opik Integration)

Amble uses **Comet Opik** for distributed tracing and metrics.

### Tracked Metrics
| Metric | Description |
|--------|-------------|
| `memory_hits` | Number of memories retrieved for context |
| `has_memory` | Binary flag (1 if memories were found) |
| `response_length` | Length of agent response |
| `user_message_length` | Length of user input |

### Viewing Traces
Traces are automatically sent to Comet Opik. View them at:
- Project: `amble-companion`
- Dashboard: https://www.comet.com/opik

---

## 🚀 Backend API

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

#### Chat
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

### Search Architecture

Due to limitations in Gemini’s tool-calling system, web search is implemented as an isolated agent wrapped using AgentTool.  
This ensures stability while allowing the main reasoning agent to remain deterministic and memory-safe.


---



## License
This project is licensed under the MIT License.

---
Made for families everywhere.
