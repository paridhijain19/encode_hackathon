links 
https://google.github.io/adk-docs/sessions/memory/
https://pypi.org/project/mem0ai
https://docs.mem0.ai/api-reference/organizations-projects
https://docs.mem0.ai/api-reference/memory/add-memories
https://docs.mem0.ai/integrations/google-ai-adk
https://docs.mem0.ai/open-source/python-quickstart

---

## 🧠 **How Mem0 Works & Integration Notes (Docs to Add)**

Here’s **actual documentation text** you can copy into your project `MEMORY.md` or `PROJECT_OVERVIEW.md` under a “Memory” section, based on mem0 official docs.

---

### 📌 Memory Integration with Mem0

**Mem0** is a long-term structuring memory layer that allows the agent to store and retrieve conversation history and user-specific information across sessions. It uses semantic search and filters by user_id to provide relevant context. ([PyPI][2])

#### ✔ Installation

```bash
pip install mem0ai
```

#### ✔ Authentication

Set your API key:

```bash
export MEM0_API_KEY="your_mem0_platform_api_key"
```

You can also add `org_id` and `project_id` if using multi-project features. ([docs.mem0.ai][3])

#### ✔ Initialize Mem0 Client

```python
from mem0 import MemoryClient

mem0 = MemoryClient(api_key=os.getenv("MEM0_API_KEY"))
```

---

### 🧠 Memory Operations

#### ➤ Add / Save Memories

Mem0 allows you to save user messages plus agent replies for later retrieval. It is recommended to include both roles for better search context. ([docs.mem0.ai][4])

```python
messages = [
    {"role": "user", "content": user_message},
    {"role": "assistant", "content": assistant_response}
]
mem0.add(messages, user_id=user_id)
```

#### ➤ Search Memories

You can perform a semantic query to find the most relevant memories for the current user context:

```python
results = mem0.search(query_string, filters={"user_id": user_id})
```

* If no results, handle gracefully.
* You may limit results to top 5 or similar.

---

## 🧠 How to Use Memory in Your Agent

1. **At start of chat** → perform memory search using the latest user message as query.
2. **Pass retrieved memories** into agent context before calling the agent.
3. **After agent generates response** → save both the user message and agent reply into memory for future use.

This enhances personalization and context continuity over time.

---

## 🛠 ADK Memory Support

Google ADK provides a simple in-memory service for short-term or prototype memory, but it does not provide long-term persistence. You should integrate Mem0 as shown above to allow the agent to **remember across sessions and interactions**. ([google.github.io][1])

---

## 🧩 Example Conceptual Flow

1. User sends message to `/chat`.
2. You perform:

   ```python
   past_memories = search_memory(query=user_message, user_id=user_id)
   ```
3. Build a prompt that includes:

   * past memories
   * current user message
4. Invoke agent with enriched context.
5. After receiving agent response:

   ```python
   save_memory(user_message, agent_response, user_id)
   ```

---


[1]: https://google.github.io/adk-docs/sessions/memory "Memory - Agent Development Kit"
[2]: https://pypi.org/project/mem0ai "mem0ai"
[3]: https://docs.mem0.ai/api-reference/organizations-projects "Organizations & Projects"
[4]: https://docs.mem0.ai/api-reference/memory/add-memories "Add Memories"
