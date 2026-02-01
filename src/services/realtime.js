/**
 * Supabase Realtime Service for Amble
 * 
 * Provides real-time updates using Supabase's realtime subscriptions.
 * Used for live updates in the Family Dashboard.
 */

import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null

/**
 * Initialize Supabase client
 */
export function initSupabase() {
    if (supabase) return supabase
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.log('[Supabase] Not configured - realtime disabled')
        return null
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        realtime: {
            params: {
                eventsPerSecond: 10
            }
        }
    })

    console.log('[Supabase] Client initialized')
    return supabase
}

/**
 * Get the Supabase client
 */
export function getSupabase() {
    if (!supabase) {
        initSupabase()
    }
    return supabase
}

/**
 * Subscribe to alerts for a specific elder user
 * @param {string} elderUserId - Elder user ID to monitor
 * @param {Function} onAlert - Callback when new alert is received
 * @returns {Object} Subscription object
 */
export function subscribeToAlerts(elderUserId, onAlert) {
    const client = getSupabase()
    if (!client) {
        console.log('[Supabase] Cannot subscribe - not configured')
        return null
    }

    const channel = client
        .channel(`alerts:${elderUserId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'alerts',
                filter: `user_id=eq.${elderUserId}`
            },
            (payload) => {
                console.log('[Supabase] New alert:', payload.new)
                onAlert(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to activities for a specific user
 * @param {string} userId - User ID to monitor
 * @param {Function} onActivity - Callback when new activity is recorded
 * @returns {Object} Subscription object
 */
export function subscribeToActivities(userId, onActivity) {
    const client = getSupabase()
    if (!client) return null

    const channel = client
        .channel(`activities:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'activities',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('[Supabase] New activity:', payload.new)
                onActivity(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to moods for a specific user
 * @param {string} userId - User ID to monitor
 * @param {Function} onMood - Callback when new mood is recorded
 * @returns {Object} Subscription object
 */
export function subscribeToMoods(userId, onMood) {
    const client = getSupabase()
    if (!client) return null

    const channel = client
        .channel(`moods:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'moods',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('[Supabase] New mood:', payload.new)
                onMood(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to expenses for a specific user
 * @param {string} userId - User ID to monitor
 * @param {Function} onExpense - Callback when new expense is recorded
 * @returns {Object} Subscription object
 */
export function subscribeToExpenses(userId, onExpense) {
    const client = getSupabase()
    if (!client) return null

    const channel = client
        .channel(`expenses:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'expenses',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('[Supabase] New expense:', payload.new)
                onExpense(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to chat history for a specific user
 * @param {string} userId - User ID to monitor
 * @param {Function} onChat - Callback when new chat is recorded
 * @returns {Object} Subscription object
 */
export function subscribeToChatHistory(userId, onChat) {
    const client = getSupabase()
    if (!client) return null

    const channel = client
        .channel(`chat:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_history',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                console.log('[Supabase] New chat:', payload.new)
                onChat(payload.new)
            }
        )
        .subscribe()

    return channel
}

/**
 * Subscribe to all updates for an elder user
 * @param {string} elderUserId - Elder user ID to monitor
 * @param {Object} callbacks - Object with callback functions
 * @returns {Object} Object with all subscriptions
 */
export function subscribeToAllUpdates(elderUserId, callbacks) {
    const subscriptions = {}

    if (callbacks.onAlert) {
        subscriptions.alerts = subscribeToAlerts(elderUserId, callbacks.onAlert)
    }
    if (callbacks.onActivity) {
        subscriptions.activities = subscribeToActivities(elderUserId, callbacks.onActivity)
    }
    if (callbacks.onMood) {
        subscriptions.moods = subscribeToMoods(elderUserId, callbacks.onMood)
    }
    if (callbacks.onExpense) {
        subscriptions.expenses = subscribeToExpenses(elderUserId, callbacks.onExpense)
    }
    if (callbacks.onChat) {
        subscriptions.chat = subscribeToChatHistory(elderUserId, callbacks.onChat)
    }

    return subscriptions
}

/**
 * Unsubscribe from a channel
 * @param {Object} channel - Channel subscription to remove
 */
export function unsubscribe(channel) {
    const client = getSupabase()
    if (!client || !channel) return

    client.removeChannel(channel)
}

/**
 * Unsubscribe from all channels
 * @param {Object} subscriptions - Object with all subscriptions
 */
export function unsubscribeAll(subscriptions) {
    if (!subscriptions) return

    Object.values(subscriptions).forEach(channel => {
        if (channel) {
            unsubscribe(channel)
        }
    })
}

/**
 * Check if Supabase realtime is available
 */
export function isRealtimeAvailable() {
    return supabase !== null
}

export default {
    initSupabase,
    getSupabase,
    subscribeToAlerts,
    subscribeToActivities,
    subscribeToMoods,
    subscribeToExpenses,
    subscribeToChatHistory,
    subscribeToAllUpdates,
    unsubscribe,
    unsubscribeAll,
    isRealtimeAvailable
}
