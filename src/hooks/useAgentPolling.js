/**
 * useAgentPolling Hook
 * 
 * Polls backend for state updates (agent status, memory count, data).
 * Stops polling when page is not visible to save resources.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getState, getUserId } from '../services/api'

const DEFAULT_STATE = {
    status: 'unknown',
    user_id: '',
    session_id: null,
    memoryCount: 0,
    agentReady: false,
    // Data from backend
    expenses: [],
    activities: [],
    appointments: [],
    moods: [],
    userProfile: {},
    lastUpdated: null,
}

export function useAgentPolling(interval = 5000) {
    const [state, setState] = useState(DEFAULT_STATE)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    
    const intervalRef = useRef(null)
    const userId = getUserId()

    /**
     * Fetch state from backend
     */
    const fetchState = useCallback(async () => {
        // Don't fetch if page is hidden
        if (document.hidden) return

        setLoading(true)
        try {
            const data = await getState(userId)
            // Map snake_case to camelCase
            setState({
                status: data.status,
                user_id: data.user_id,
                session_id: data.session_id,
                memoryCount: data.memory_count || 0,
                agentReady: data.agent_ready || false,
                // Data from data.json
                expenses: data.expenses || [],
                activities: data.activities || [],
                appointments: data.appointments || [],
                moods: data.moods || [],
                userProfile: data.user_profile || {},
                lastUpdated: data.last_updated || new Date().toISOString(),
            })
            setError(null)
        } catch (err) {
            console.error('State polling error:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [userId])

    /**
     * Manual refresh
     */
    const refresh = useCallback(() => {
        fetchState()
    }, [fetchState])

    // Start/stop polling based on visibility
    useEffect(() => {
        // Initial fetch
        fetchState()

        // Set up interval
        intervalRef.current = setInterval(fetchState, interval)

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Stop polling when hidden
                if (intervalRef.current) {
                    clearInterval(intervalRef.current)
                    intervalRef.current = null
                }
            } else {
                // Resume polling when visible
                fetchState() // Immediate fetch
                intervalRef.current = setInterval(fetchState, interval)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [fetchState, interval])

    // Computed values for convenience
    const totalExpensesToday = state.expenses
        .filter(e => e.timestamp?.startsWith(new Date().toISOString().split('T')[0]))
        .reduce((sum, e) => sum + (e.amount || 0), 0)
    
    const latestMood = state.moods.slice(-1)[0] || null
    
    const upcomingAppointments = state.appointments.filter(
        a => a.status !== 'cancelled' && new Date(a.date_time) > new Date()
    )

    return {
        ...state,
        loading,
        error,
        refresh,
        // Computed
        totalExpensesToday,
        latestMood,
        upcomingAppointments,
    }
}

export default useAgentPolling
