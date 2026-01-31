# Frontend Design — Amble Hackathon

> **Goal**: Design the frontend architecture to connect with backend agent.

---

## 1. Component Architecture

### New Components to Create

```
src/
├── components/
│   ├── AgentChat/
│   │   ├── AgentChat.jsx        # Chat overlay component
│   │   ├── AgentChat.css
│   │   ├── ChatMessage.jsx      # Single message bubble
│   │   └── VoiceButton.jsx      # Animated voice FAB
│   │
│   ├── SmartUI/
│   │   ├── DynamicCard.jsx      # Renders agent-generated cards
│   │   ├── QuickAction.jsx      # Action buttons that talk to agent
│   │   └── DataList.jsx         # Lists that sync with agent
│   │
│   └── shared/
│       ├── LoadingSpinner.jsx
│       └── ErrorBoundary.jsx
│
├── hooks/
│   ├── useVoiceInput.js         # Web Speech STT
│   ├── useTextToSpeech.js       # Web Speech TTS
│   ├── useAgent.js              # Main agent communication hook
│   └── useAgentPolling.js       # Poll backend for state updates
│
├── services/
│   └── api.js                   # HTTP client for backend
│
└── context/
    └── AgentContext.jsx         # Global agent state
```

---

## 2. Data Flow Design

### Voice Conversation Flow

```
┌─────────────────┐
│  User taps      │
│  "Speak" FAB    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useVoiceInput   │ ◄── Web Speech API (STT)
│ starts listening│
└────────┬────────┘
         │ transcript
         ▼
┌─────────────────┐
│ api.chat()      │ ──► POST /chat { message, user_id }
│ sends to backend│
└────────┬────────┘
         │ response
         ▼
┌─────────────────┐
│ Display in      │
│ AgentChat       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ useTextToSpeech │ ◄── Web Speech API (TTS)
│ speaks response │
└─────────────────┘
```

### Agent → Pages Auto-Update Flow

```
User: "I spent $50 on groceries"
         │
         ▼
┌─────────────────┐
│ Agent calls     │
│ track_expense() │ ──► Saves to data.json
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Response:       │
│ "Noted! $50..." │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AgentContext    │
│ triggers poll   │ ──► GET /api/state
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BudgetView      │
│ re-renders      │ ◄── New expense appears!
└─────────────────┘
```

---

## 3. Voice Integration Design

### useVoiceInput Hook

```javascript
// src/hooks/useVoiceInput.js
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  
  const startListening = () => {
    const recognition = new webkitSpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    
    recognition.onresult = (event) => {
      setTranscript(event.results[0][0].transcript)
    }
    
    recognition.start()
    setIsListening(true)
  }
  
  return { isListening, transcript, startListening, stopListening }
}
```

### useTextToSpeech Hook

```javascript
// src/hooks/useTextToSpeech.js
export function useTextToSpeech() {
  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9  // Slightly slower for elderly
    utterance.pitch = 1.0
    speechSynthesis.speak(utterance)
  }
  
  return { speak }
}
```

---

## 4. Smart UI Strategy

### What AI Generates vs Pre-built

| Element | AI Provides | Frontend Renders With |
|---------|-------------|----------------------|
| Expense summary | `{ total: 835, by_category: {...} }` | Chart.js pie chart |
| Today's schedule | `[{ time, activity, done }]` | Existing schedule list |
| Meds list | `[{ name, time, taken }]` | Existing checkbox list |
| Activity suggestions | `[{ title, desc, icon }]` | Card component |
| Chat responses | `"Noted! $50..."` | Message bubble |
| Alerts | `{ type, message }` | Toast notification |

### DynamicCard Component

```jsx
// Renders different UI based on agent response type
function DynamicCard({ data }) {
  switch (data.type) {
    case 'expense_summary':
      return <BudgetChart data={data.by_category} />
    case 'schedule':
      return <ScheduleList items={data.items} />
    case 'suggestion':
      return <SuggestionCard {...data} />
    default:
      return <TextCard text={data.message} />
  }
}
```

---

## 5. AgentChat Component Design

### Chat Overlay (appears when talking to agent)

```
┌──────────────────────────────────┐
│ ╳                     Amble 🌿   │  ← Header with close
├──────────────────────────────────┤
│                                  │
│  ┌────────────────────────┐      │
│  │ How can I help you     │      │  ← Agent bubble (left)
│  │ today?                 │      │
│  └────────────────────────┘      │
│                                  │
│      ┌────────────────────────┐  │
│      │ I spent $50 on        │  │  ← User bubble (right)
│      │ groceries             │  │
│      └────────────────────────┘  │
│                                  │
│  ┌────────────────────────┐      │
│  │ Noted! $50 for         │      │
│  │ groceries. Total today │      │
│  │ is $85.                │      │
│  └────────────────────────┘      │
│                                  │
├──────────────────────────────────┤
│  ┌──────────────────┐  🎤        │  ← Input + voice button
│  │ Type or speak... │            │
│  └──────────────────┘            │
└──────────────────────────────────┘
```

### Elderly-Friendly Design Rules

- **Font size**: 18px minimum, 24px for headers
- **Touch targets**: 56px minimum height
- **Contrast**: 4.5:1 ratio minimum
- **Voice button**: Always visible, prominent
- **Simple language**: "Speak" not "Voice Input"

---

## 6. Page-Specific Integration

### Home Page (`/parent`)

| UI Element | Data Source | Update Trigger |
|------------|-------------|----------------|
| Wellness % | Poll `/api/state` | After agent interaction |
| Quick actions | Static buttons | Call agent on click |
| Today's plan | Poll `/api/state` | After agent interaction |

### Budget Page (`/parent/budget`)

| UI Element | Data Source | Update Trigger |
|------------|-------------|----------------|
| Pie chart | `get_expense_summary()` via poll | After "track expense" |
| Category bars | Same as above | Same |
| Add button | Opens modal → calls agent | User click |

### Health Page (`/parent/health`)

| UI Element | Data Source | Notes |
|------------|-------------|-------|
| Meds list | Static for now | Backend needs meds tool |
| Check buttons | Call agent | "Mark Lisinopril as taken" |

---

## 7. State Management

### AgentContext

```jsx
const AgentContext = createContext()

function AgentProvider({ children }) {
  const [messages, setMessages] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState({
    expenses: [],
    activities: [],
    appointments: []
  })
  
  const sendMessage = async (text) => {
    setMessages(prev => [...prev, { role: 'user', text }])
    const response = await api.chat(text)
    setMessages(prev => [...prev, { role: 'agent', text: response.response }])
    
    // Trigger state refresh
    await refreshState()
  }
  
  const refreshState = async () => {
    const data = await api.getState()
    setState(data)
  }
  
  return (
    <AgentContext.Provider value={{ messages, sendMessage, state, isOpen, setIsOpen }}>
      {children}
    </AgentContext.Provider>
  )
}
```

---

## 8. Libraries Needed

| Package | Purpose | Size |
|---------|---------|------|
| None new | Voice uses native Web Speech API | 0kb |
| (optional) chart.js | Budget charts | Already have inline SVG |
| (optional) react-hot-toast | Notifications | 3kb |

**Decision**: Use existing inline SVG for charts. No new dependencies.
