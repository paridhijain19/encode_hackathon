/**
 * Notifications Hook
 * 
 * Polls for proactive notifications from the agent scheduler.
 * Used for greeting messages, reminders, and check-ins.
 */

import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function useNotifications(userId) {
    const [notifications, setNotifications] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [lastFetch, setLastFetch] = useState(null)

    // Fetch notifications from API
    const fetchNotifications = useCallback(async () => {
        if (!userId) return

        try {
            const response = await fetch(`${API_BASE}/api/notifications/${userId}`)

            if (response.ok) {
                const data = await response.json()
                setNotifications(data.notifications || [])
                setError(null)
            } else {
                // API might not exist yet, that's okay
                if (response.status !== 404) {
                    setError('Failed to load notifications')
                }
            }
        } catch (err) {
            // Network error - API not available
            console.log('Notifications API not available')
        } finally {
            setLoading(false)
            setLastFetch(new Date())
        }
    }, [userId])

    // Poll every 30 seconds
    useEffect(() => {
        fetchNotifications()

        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    // Dismiss a notification
    const dismiss = useCallback(async (notificationId) => {
        try {
            await fetch(`${API_BASE}/api/notifications/${notificationId}/dismiss`, {
                method: 'POST'
            })

            // Remove from local state immediately
            setNotifications(prev => prev.filter(n => n.id !== notificationId))
        } catch (err) {
            console.error('Failed to dismiss notification:', err)
        }
    }, [])

    // Get unread count
    const unreadCount = notifications.filter(n => !n.is_read).length

    // Mark all as read
    const markAllRead = useCallback(async () => {
        try {
            await fetch(`${API_BASE}/api/notifications/${userId}/read-all`, {
                method: 'POST'
            })

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) {
            console.error('Failed to mark notifications read:', err)
        }
    }, [userId])

    return {
        notifications,
        loading,
        error,
        unreadCount,
        dismiss,
        markAllRead,
        refresh: fetchNotifications,
        lastFetch
    }
}

export default useNotifications
