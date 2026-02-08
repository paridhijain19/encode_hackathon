/**
 * useAgent Hook
 * 
 * Main hook for interacting with the Amble agent.
 * Manages conversation state, session persistence, and API calls.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { sendMessage, getSession, saveSession, clearSession, getUserId } from '../services/api'

export function useAgent(overrideUserId = null) {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [sessionId, setSessionId] = useState(null)
    const [memoriesUsed, setMemoriesUsed] = useState(0)

    // Use override if provided, otherwise fall back to localStorage
    const userId = overrideUserId || getUserId()

    // Track the previous user to detect changes
    const prevUserIdRef = useRef(userId)

    // Reset messages and session when user changes
    useEffect(() => {
        console.log('[useAgent] User changed to:', userId, 'from:', prevUserIdRef.current)

        // If user actually changed (not just initial mount), clear the old session
        if (prevUserIdRef.current !== userId) {
            console.log('[useAgent] Clearing session for user change')
            clearSession()
            setSessionId(null)
        }

        prevUserIdRef.current = userId
        setMessages([])
        setError(null)
        setMemoriesUsed(0)
    }, [userId])

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

            // Show more helpful error message based on the error type
            let errorText = "I'm sorry, I couldn't process that right now. Please try again."
            if (err.message && err.message.includes('429')) {
                errorText = "I'm getting too many requests right now. Please wait a minute and try again. 🙏"
            } else if (err.message && err.message.includes('500')) {
                errorText = "Something went wrong on my end. Please wait a moment and try again."
            }

            // Add error message to conversation
            const errorMsg = {
                role: 'agent',
                text: errorText,
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

    /**
     * Manually add a message to the conversation history
     * Useful for voice transcripts or other non-API messages
     */
    const addMessage = useCallback((message) => {
        setMessages((prev) => [...prev, {
            role: message.role || 'user',
            text: message.text,
            timestamp: new Date().toISOString(),
            isError: message.isError || false
        }])
    }, [])

    return {
        messages,
        chat,
        addMessage,
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
