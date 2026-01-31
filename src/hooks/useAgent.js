/**
 * useAgent Hook
 * 
 * Main hook for interacting with the Amble agent.
 * Manages conversation state, session persistence, and API calls.
 */

import { useState, useCallback, useEffect } from 'react'
import { sendMessage, getSession, saveSession, getUserId } from '../services/api'

export function useAgent() {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sessionId, setSessionId] = useState(() => getSession())
    const [memoriesUsed, setMemoriesUsed] = useState(0)

    const userId = getUserId()

    /**
     * Send a message to the agent and get response
     * @param {string} userMessage - User's text input
     * @returns {Promise<{response: string, memories_used: number}>}
     */
    const chat = useCallback(async (userMessage) => {
        if (!userMessage?.trim()) return null

        setLoading(true)
        setError(null)

        // Add user message to conversation immediately (optimistic UI)
        const userMsg = {
            role: 'user',
            text: userMessage.trim(),
            timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, userMsg])

        try {
            const result = await sendMessage(userMessage.trim(), userId, sessionId)

            // Update session ID if changed
            if (result.session_id && result.session_id !== sessionId) {
                setSessionId(result.session_id)
                saveSession(result.session_id)
            }

            // Track memory usage
            setMemoriesUsed(result.memories_used || 0)

            // Add agent response to conversation
            const agentMsg = {
                role: 'agent',
                text: result.response,
                timestamp: new Date().toISOString(),
                memoriesUsed: result.memories_used || 0,
            }
            setMessages((prev) => [...prev, agentMsg])

            return result
        } catch (err) {
            console.error('Agent chat error:', err)
            setError(err.message || 'Failed to get response from Amble')

            // Add error message to conversation
            const errorMsg = {
                role: 'agent',
                text: "I'm sorry, I couldn't process that right now. Please try again.",
                timestamp: new Date().toISOString(),
                isError: true,
            }
            setMessages((prev) => [...prev, errorMsg])

            return null
        } finally {
            setLoading(false)
        }
    }, [userId, sessionId])

    /**
     * Clear conversation history (keeps session)
     */
    const clearMessages = useCallback(() => {
        setMessages([])
        setError(null)
    }, [])

    /**
     * Reset session (new conversation)
     */
    const resetSession = useCallback(() => {
        setSessionId(null)
        setMessages([])
        setError(null)
        setMemoriesUsed(0)
        localStorage.removeItem('amble_session_id')
    }, [])

    /**
     * Get the last agent response
     */
    const lastResponse = messages.filter(m => m.role === 'agent').slice(-1)[0]?.text || null

    return {
        messages,
        chat,
        loading,
        error,
        sessionId,
        memoriesUsed,
        clearMessages,
        resetSession,
        lastResponse,
    }
}

export default useAgent
