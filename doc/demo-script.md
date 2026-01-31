# Demo Script — Amble Hackathon (2 Minutes)

> **Goal**: Show voice interaction, auto-sync, and memory in action.

---

## Setup Before Demo

1. Backend running: `uvicorn agent.server:app --port 8000`
2. Frontend running: `npm run dev` → http://localhost:5173/parent
3. Clear browser cache for fresh state
4. Have phone/microphone ready

---

## Scene 1: Introduction (15 sec)

**Narrator says:**
> "Meet Amble — an AI companion for elderly care. Let's see how it helps Mom manage her day."

**Screen shows:**
- Landing page briefly
- Navigate to Parent Portal

---

## Scene 2: Voice Interaction (30 sec)

**Action:**
1. Click the **Speak** button (voice FAB)
2. Say: **"Good morning! I just took my walks in the park for 30 minutes"**

**Expected Response (spoken + displayed):**
> "Wonderful! A 30-minute walk in the park — that's lovely for your health!"

**Screen shows:**
- Voice recording animation
- Agent chat overlay appears
- Response bubble + TTS speaks

---

## Scene 3: Expense Tracking (30 sec)

**Action:**
1. Click **Speak** again
2. Say: **"I spent 500 rupees on vegetables at the market"**

**Expected Response:**
> "Noted! ₹500 for vegetables. Your spending today is ₹500."

**Action:**
1. Navigate to **Budget** tab

**Screen shows:**
- Budget page now shows ₹500 in Groceries category
- Pie chart updated (if implemented)

---

## Scene 4: Memory Demonstration (30 sec)

**Action:**
1. Go back to Home
2. Click **Speak**
3. Say: **"What did I do today?"**

**Expected Response:**
> "Today you had a lovely 30-minute walk in the park and spent ₹500 on vegetables. You're doing great!"

**Points to highlight:**
- Agent remembers earlier conversation
- Personalized summary

---

## Scene 5: Family Connection (15 sec)

**Action:**
1. Click **Speak**
2. Say: **"Send my son a message that I completed my walk today"**

**Expected Response:**
> "I've shared this update with your family: 'Mom completed her morning walk today!'"

**Narrator says:**
> "Family members stay connected without constant check-ins."

---

## Closing Statement (10 sec)

**Narrator says:**
> "Amble: Simple voice interactions, automatic tracking, and family peace of mind."

---

## Backup Demo Flow (If Voice Fails)

If microphone doesn't work, type these in chat:

1. "I just walked for 30 minutes"
2. "I spent 500 on groceries"
3. "What did I do today?"
4. "Tell my family I'm doing well"

---

## Key Demo Tips

| Do | Don't |
|----|-------|
| Speak clearly and slowly | Rush through interactions |
| Pause to let TTS finish | Talk over the agent |
| Show page updates | Skip to next scene too fast |
| Have backup typed commands | Rely only on voice |
