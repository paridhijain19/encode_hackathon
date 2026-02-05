/**
 * API Service for Amble Backend
 * 
 * Handles all HTTP communication with the FastAPI backend.
 * Base URL: http://localhost:8000
 */

const API_BASE = 'http://localhost:8000'

/**
 * Send a message to the Amble agent (with retry for rate limits)
 * @param {string} message - User's message text
 * @param {string} userId - Unique user identifier
 * @param {string|null} sessionId - Optional session ID for conversation continuity
 * @returns {Promise<{response: string, session_id: string, user_id: string, memories_used: number}>}
 */
export async function sendMessage(message, userId = 'default_user', sessionId = null, retryCount = 0) {
    const MAX_RETRIES = 2
    const RETRY_DELAY = 3000 // 3 seconds

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                user_id: userId,
                session_id: sessionId,
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const errorMessage = errorData.detail || `HTTP ${response.status}: ${response.statusText}`

            // If session not found error, clear local session and retry
            if (errorMessage.includes('Session not found') && retryCount < MAX_RETRIES) {
                console.log('Session invalid, clearing and retrying...')
                clearSession()
                return sendMessage(message, userId, null, retryCount + 1)
            }

            // Retry on rate limit (429) or server error (500) if we have retries left
            if ((response.status === 429 || response.status === 500) && retryCount < MAX_RETRIES) {
                console.log(`Rate limited or server error, retrying in ${RETRY_DELAY / 1000}s... (attempt ${retryCount + 1}/${MAX_RETRIES})`)
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
                return sendMessage(message, userId, sessionId, retryCount + 1)
            }

            throw new Error(errorMessage)
        }

        const result = await response.json()
        // Save the session ID returned by server
        if (result.session_id) {
            saveSession(result.session_id)
        }
        return result
    } catch (error) {
        console.error('API Error (sendMessage):', error)
        throw error
    }
}

/**
 * Get current state from backend (agent status, session info, memory count)
 * @param {string} userId - User identifier
 * @returns {Promise<{status: string, user_id: string, session_id: string|null, memory_count: number, agent_ready: boolean}>}
 */
export async function getState(userId = 'default_user') {
    try {
        const response = await fetch(`${API_BASE}/api/state?user_id=${encodeURIComponent(userId)}`)

        if (!response.ok) {
            // Return default state if endpoint doesn't exist yet
            if (response.status === 404) {
                return {
                    status: 'unknown',
                    user_id: userId,
                    session_id: null,
                    memory_count: 0,
                    agent_ready: false,
                }
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API Error (getState):', error)
        // Return default state on error so UI doesn't break
        return {
            status: 'error',
            user_id: userId,
            session_id: null,
            memory_count: 0,
            agent_ready: false,
        }
    }
}

/**
 * Health check endpoint
 * @returns {Promise<{status: string, agent: string}>}
 */
export async function healthCheck() {
    try {
        const response = await fetch(`${API_BASE}/`)
        return await response.json()
    } catch (error) {
        console.error('API Error (healthCheck):', error)
        return { status: 'error', agent: 'unknown' }
    }
}

// ==================== SESSION MANAGEMENT ====================

const SESSION_KEY = 'amble_session_id'
const USER_KEY = 'amble_user_id'

/**
 * Save session ID to localStorage
 * @param {string} sessionId 
 */
export function saveSession(sessionId) {
    if (sessionId) {
        localStorage.setItem(SESSION_KEY, sessionId)
    }
}

/**
 * Get session ID from localStorage
 * @returns {string|null}
 */
export function getSession() {
    return localStorage.getItem(SESSION_KEY)
}

/**
 * Clear session (for logout/reset)
 */
export function clearSession() {
    localStorage.removeItem(SESSION_KEY)
}

/**
 * Save user ID to localStorage
 * @param {string} userId 
 */
export function saveUserId(userId) {
    if (userId) {
        localStorage.setItem(USER_KEY, userId)
    }
}

/**
 * Get user ID from localStorage (defaults to 'default_user')
 * @returns {string}
 */
export function getUserId() {
    return localStorage.getItem(USER_KEY) || 'default_user'
}


// ==================== DIRECT DATABASE ENDPOINTS (NO AGENT) ====================

/**
 * Add an expense directly to the database (no agent involved)
 * @param {string} userId - User identifier
 * @param {Object} expense - { amount: number, category: string, description: string }
 */
export async function addExpense(userId, expense) {
    try {
        const response = await fetch(`${API_BASE}/api/expenses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                amount: expense.amount,
                category: expense.category,
                description: expense.description || '',
            }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `HTTP ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API Error (addExpense):', error)
        throw error
    }
}

/**
 * Add a health record directly to the database (no agent involved)
 * @param {string} userId - User identifier  
 * @param {Object} record - { type: string, value: string, notes: string }
 */
export async function addHealthRecord(userId, record) {
    try {
        const response = await fetch(`${API_BASE}/api/health`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                activity_type: record.type,
                value: record.value,
                notes: record.notes || '',
            }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `HTTP ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API Error (addHealthRecord):', error)
        throw error
    }
}

/**
 * Add an appointment directly to the database (no agent involved)
 * @param {string} userId - User identifier
 * @param {Object} appointment - { title: string, date: string, time: string, location: string }
 */
export async function addAppointment(userId, appointment) {
    try {
        const response = await fetch(`${API_BASE}/api/appointments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                title: appointment.title,
                date: appointment.date,
                time: appointment.time || '09:00',
                location: appointment.location || '',
            }),
        })

        if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.detail || `HTTP ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API Error (addAppointment):', error)
        throw error
    }
}

/**
 * Get recent data (expenses, activities, appointments) - for displaying lists
 * @param {string} userId - User identifier
 */
export async function getRecentData(userId) {
    try {
        const response = await fetch(`${API_BASE}/api/state?user_id=${encodeURIComponent(userId)}`)

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        return await response.json()
    } catch (error) {
        console.error('API Error (getRecentData):', error)
        return {
            expenses: [],
            activities: [],
            appointments: [],
            moods: [],
        }
    }
}
