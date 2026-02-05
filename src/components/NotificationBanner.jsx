/**
 * NotificationBanner Component
 * 
 * Displays proactive notifications from the agent:
 * - Morning greetings
 * - Medication reminders
 * - Appointment reminders
 * - Check-in prompts
 */

import { useState, useEffect } from 'react'
import { X, Bell, Sun, Pill, Calendar, MessageCircle, Heart } from 'lucide-react'
import './NotificationBanner.css'

// Icon mapping for notification types
const NOTIFICATION_ICONS = {
    greeting: Sun,
    medication: Pill,
    appointment: Calendar,
    checkin: MessageCircle,
    wellness: Heart,
    default: Bell
}

// Color themes for notification types
const NOTIFICATION_THEMES = {
    greeting: { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', color: '#D97706' },
    medication: { bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', color: '#2563EB' },
    appointment: { bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', color: '#4F46E5' },
    checkin: { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', color: '#059669' },
    wellness: { bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)', color: '#DB2777' },
    default: { bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', color: '#4B5563' }
}

export default function NotificationBanner({
    notifications = [],
    onDismiss,
    onAction,
    autoHide = true
}) {
    const [visible, setVisible] = useState([])
    const [animatingOut, setAnimatingOut] = useState(new Set())

    // Show notifications one at a time with stagger
    useEffect(() => {
        if (notifications.length > 0) {
            // Show first unread notification
            const unread = notifications.filter(n => !n.is_read)
            if (unread.length > 0 && !visible.includes(unread[0].id)) {
                setVisible(prev => [...prev, unread[0].id])
            }
        }
    }, [notifications])

    // Auto-hide after delay
    useEffect(() => {
        if (!autoHide) return

        const timers = visible.map(id => {
            return setTimeout(() => {
                handleDismiss(id)
            }, 10000) // 10 seconds
        })

        return () => timers.forEach(t => clearTimeout(t))
    }, [visible, autoHide])

    const handleDismiss = (id) => {
        setAnimatingOut(prev => new Set([...prev, id]))

        setTimeout(() => {
            setVisible(prev => prev.filter(v => v !== id))
            setAnimatingOut(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
            onDismiss?.(id)
        }, 300)
    }

    const handleAction = (notification) => {
        onAction?.(notification)
        handleDismiss(notification.id)
    }

    if (visible.length === 0) return null

    return (
        <div className="notification-stack">
            {visible.map((id) => {
                const notification = notifications.find(n => n.id === id)
                if (!notification) return null

                const type = notification.type || 'default'
                const Icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default
                const theme = NOTIFICATION_THEMES[type] || NOTIFICATION_THEMES.default
                const isAnimatingOut = animatingOut.has(id)

                return (
                    <div
                        key={id}
                        className={`notification-banner ${isAnimatingOut ? 'exiting' : 'entering'}`}
                        style={{ background: theme.bg }}
                    >
                        <div className="notification-icon" style={{ color: theme.color }}>
                            <Icon size={24} />
                        </div>

                        <div className="notification-content">
                            {notification.title && (
                                <div className="notification-title" style={{ color: theme.color }}>
                                    {notification.title}
                                </div>
                            )}
                            <div className="notification-message">
                                {notification.message}
                            </div>

                            {notification.action && (
                                <button
                                    className="notification-action"
                                    onClick={() => handleAction(notification)}
                                    style={{
                                        background: theme.color,
                                        color: 'white'
                                    }}
                                >
                                    {notification.action}
                                </button>
                            )}
                        </div>

                        <button
                            className="notification-close"
                            onClick={() => handleDismiss(id)}
                            style={{ color: theme.color }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
