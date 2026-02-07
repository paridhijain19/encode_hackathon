import { useState, useEffect, useCallback } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import {
    Home, Activity, Wallet, Heart, Bell, Users, Settings, Phone, Video,
    ChevronLeft, ChevronRight, Calendar, Clock, MapPin, TrendingUp, TrendingDown, Check, AlertCircle, MessageCircle, RefreshCw, MessageSquare
} from 'lucide-react'
import './FamilyDashboard.css'
import { useAuth } from '../context/AuthContext'
import { SignInModal, UserBadge } from '../components/SignIn'
import { subscribeToAllUpdates, unsubscribeAll } from '../services/realtime'
import VideoCall, { CallFamilyWidget } from '../components/VideoCall'

// API helper
const API_BASE = 'http://localhost:8000'
// The elder user ID is always parent_user (the one we're monitoring)
const ELDER_USER_ID = 'parent_user'

// ==================== Helper Functions ====================

function getMoodEmoji(mood) {
    const moodMap = {
        'happy': '😊', 'great': '😁', 'good': '🙂', 'okay': '😐',
        'sad': '😢', 'tired': '😴', 'anxious': '😰', 'calm': '😌',
        'peaceful': '☮️', 'excited': '🤩'
    }
    return moodMap[mood?.toLowerCase()] || '🙂'
}

function getActivityIcon(type) {
    const iconMap = {
        'walking': '🚶', 'exercise': '🏃', 'yoga': '🧘', 'medication': '💊',
        'social': '👥', 'reading': '📚', 'television': '📺', 'cooking': '🍳',
        'gardening': '🌱', 'prayer': '🙏', 'nap': '😴', 'meal': '🍽️'
    }
    return iconMap[type?.toLowerCase()] || '📋'
}

function getCategoryIcon(category) {
    const iconMap = {
        'groceries': '🛒', 'medicine': '💊', 'transportation': '🚗',
        'utilities': '💡', 'food': '🍽️', 'entertainment': '🎬',
        'healthcare': '🏥', 'other': '📦'
    }
    return iconMap[category?.toLowerCase()] || '📦'
}

function formatTime(isoString) {
    if (!isoString) return '--:--'
    try {
        return new Date(isoString).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        })
    } catch {
        return '--:--'
    }
}

function formatDate(isoString) {
    if (!isoString) return '--'
    try {
        return new Date(isoString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        })
    } catch {
        return '--'
    }
}

function aggregateExpensesByCategory(expenses) {
    const categories = {}
    for (const exp of expenses) {
        const cat = exp.category || 'Other'
        categories[cat] = (categories[cat] || 0) + (exp.amount || 0)
    }
    return Object.entries(categories)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 4)
}

// ==================== API Functions ====================

async function fetchFamilySummary() {
    try {
        const response = await fetch(`${API_BASE}/api/family/${ELDER_USER_ID}/summary`)
        if (response.ok) {
            return await response.json()
        }
    } catch (error) {
        console.error('Failed to fetch family summary:', error)
    }
    return null
}

async function fetchAlerts() {
    try {
        const response = await fetch(`${API_BASE}/api/family/${ELDER_USER_ID}/alerts`)
        if (response.ok) {
            return await response.json()
        }
    } catch (error) {
        console.error('Failed to fetch alerts:', error)
    }
    return { alerts: [], unread_count: 0 }
}

async function fetchChatHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/family/${ELDER_USER_ID}/chat-history?limit=50`)
        if (response.ok) {
            return await response.json()
        }
    } catch (error) {
        console.error('Failed to fetch chat history:', error)
    }
    return { chat_history: [], total_count: 0 }
}

async function fetchWellness() {
    try {
        const response = await fetch(`${API_BASE}/api/family/${ELDER_USER_ID}/wellness`)
        if (response.ok) {
            return await response.json()
        }
    } catch (error) {
        console.error('Failed to fetch wellness:', error)
    }
    return { recent_moods: [], recent_activities: [], wellness_score: 0 }
}

async function fetchExpenses() {
    try {
        const response = await fetch(`${API_BASE}/api/family/${ELDER_USER_ID}/expenses`)
        if (response.ok) {
            return await response.json()
        }
    } catch (error) {
        console.error('Failed to fetch expenses:', error)
    }
    return { recent_expenses: [], total_spent: 0, by_category: [] }
}

async function markAlertRead(alertId) {
    try {
        await fetch(`${API_BASE}/api/family/${ELDER_USER_ID}/alert/${alertId}/read`, {
            method: 'POST'
        })
    } catch (error) {
        console.error('Failed to mark alert read:', error)
    }
}

// ==================== Main Component ====================

function FamilyDashboard() {
    const location = useLocation()
    const [familyData, setFamilyData] = useState(null)
    const [alertsData, setAlertsData] = useState({ alerts: [], unread_count: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [realtimeConnected, setRealtimeConnected] = useState(false)
    
    // Video call state
    const [activeCall, setActiveCall] = useState(null)
    
    // Auth context - family members need to sign in
    const { currentUser, isSignedIn, isLoading: authLoading } = useAuth()
    const needsSignIn = !authLoading && !isSignedIn

    const loadData = useCallback(async () => {
        setIsLoading(true)
        const [summary, alerts] = await Promise.all([
            fetchFamilySummary(),
            fetchAlerts()
        ])
        setFamilyData(summary)
        setAlertsData(alerts)
        setIsLoading(false)
    }, [])

    // Real-time subscription handlers
    const handleRealtimeUpdate = useCallback((table, payload) => {
        console.log(`[Realtime] ${table} update:`, payload)
        
        switch (table) {
            case 'alerts':
                // Add new alert to list
                if (payload.new) {
                    setAlertsData(prev => ({
                        alerts: [payload.new, ...prev.alerts],
                        unread_count: prev.unread_count + 1
                    }))
                }
                break
            case 'moods':
            case 'activities':
            case 'expenses':
                // Refresh family data when mood/activity/expense changes
                loadData()
                break
            default:
                break
        }
    }, [loadData])

    useEffect(() => {
        loadData()
        
        // Set up real-time subscriptions
        const subscriptions = subscribeToAllUpdates(ELDER_USER_ID, {
            onAlerts: (payload) => handleRealtimeUpdate('alerts', payload),
            onActivities: (payload) => handleRealtimeUpdate('activities', payload),
            onMoods: (payload) => handleRealtimeUpdate('moods', payload),
            onExpenses: (payload) => handleRealtimeUpdate('expenses', payload)
        })
        
        if (subscriptions) {
            setRealtimeConnected(true)
        }
        
        // Fallback refresh every 60 seconds (increased since we have realtime)
        const interval = setInterval(loadData, 60000)
        
        return () => {
            clearInterval(interval)
            unsubscribeAll(subscriptions)
        }
    }, [loadData, handleRealtimeUpdate])

    // Video call handlers
    const handleStartCall = (member, callType) => {
        setActiveCall({
            recipientId: member.id,
            recipientName: member.name,
            callType
        })
    }

    const handleEndCall = () => {
        setActiveCall(null)
    }

    const navItems = [
        { id: 'home', path: '/family', icon: Home, label: 'Overview' },
        { id: 'chats', path: '/family/chats', icon: MessageSquare, label: 'Chats' },
        { id: 'activity', path: '/family/activity', icon: Activity, label: 'Routine' },
        { id: 'budget', path: '/family/budget', icon: Wallet, label: 'Expenses' },
        { id: 'health', path: '/family/health', icon: Heart, label: 'Wellness' },
        { id: 'alerts', path: '/family/alerts', icon: Bell, label: 'Alerts', badge: alertsData.unread_count > 0 ? alertsData.unread_count : null },
        { id: 'family', path: '/family/network', icon: Users, label: 'Circle' },
    ]

    // Derive parent data from backend or use defaults
    const parentData = {
        name: familyData?.user_profile?.name || 'Mom',
        location: familyData?.user_profile?.location || 'Home',
        status: familyData?.last_interaction ? `Active ${getTimeAgo(familyData.last_interaction)}` : 'Active recently',
        avatar: '👩‍🦳',
    }

    const isActive = (path) => {
        if (path === '/family') return location.pathname === '/family'
        return location.pathname.startsWith(path)
    }

    return (
        <div className="family-dashboard">
            {/* Video Call Overlay */}
            {activeCall && (
                <VideoCall
                    callType={activeCall.callType}
                    recipientId={activeCall.recipientId}
                    recipientName={activeCall.recipientName}
                    onClose={handleEndCall}
                />
            )}

            {/* Sign-In Modal - shows when not signed in */}
            {needsSignIn && (
                <SignInModal 
                    mode="family" 
                    onClose={null}
                />
            )}

            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="back-btn">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="brand">
                        <span className="brand-icon">🌿</span>
                        <span className="brand-text">amble</span>
                        {realtimeConnected && <span className="realtime-indicator" title="Real-time connected">●</span>}
                    </div>
                    <button className="refresh-btn" onClick={loadData} title="Refresh data">
                        <RefreshCw size={18} className={isLoading ? 'spin' : ''} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-parent">
                    <div className="parent-avatar">{parentData.avatar}</div>
                    <div className="parent-info">
                        <h4>{parentData.name}</h4>
                        <p>📍 {parentData.location}</p>
                        <span className="status online">● Active</span>
                    </div>
                </div>

                <div className="sidebar-actions">
                    <button 
                        className="action-btn call"
                        onClick={() => handleStartCall({ id: ELDER_USER_ID, name: parentData.name }, 'audio')}
                    >
                        <Phone size={18} />
                        <span>Call</span>
                    </button>
                    <button 
                        className="action-btn video"
                        onClick={() => handleStartCall({ id: ELDER_USER_ID, name: parentData.name }, 'video')}
                    >
                        <Video size={18} />
                        <span>Video</span>
                    </button>
                </div>

                {/* Family member badge and settings */}
                <div className="sidebar-footer">
                    <UserBadge />
                    <Link to="/settings" className="settings-link">
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <Routes>
                    <Route path="/" element={<DashboardHome data={parentData} familyData={familyData} alertsData={alertsData} isLoading={isLoading} onStartCall={handleStartCall} />} />
                    <Route path="/chats" element={<ChatHistory />} />
                    <Route path="/activity" element={<ActivityFeed />} />
                    <Route path="/budget" element={<BudgetInsights />} />
                    <Route path="/health" element={<HealthDashboard />} />
                    <Route path="/alerts" element={<AlertsView />} />
                    <Route path="/network" element={<FamilyNetwork data={parentData} familyData={familyData} onStartCall={handleStartCall} />} />
                </Routes>
            </main>

            {/* Mobile floating call button */}
            <button 
                className="mobile-call-fab"
                onClick={() => handleStartCall({ id: ELDER_USER_ID, name: parentData.name }, 'video')}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: '#5B8A8A',
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 900,
                    cursor: 'pointer'
                }}
            >
                <Video size={24} />
            </button>
            <style>{`
                @media screen and (max-width: 768px) {
                    .mobile-call-fab { display: flex !important; }
                }
            `}</style>
        </div>
    )
}

// Helper function to get relative time
function getTimeAgo(isoString) {
    if (!isoString) return 'recently'
    const date = new Date(isoString)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
}

/* Dashboard Home */
function DashboardHome({ data, familyData, alertsData, isLoading }) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    // Derive stats from actual data when available
    const latestMood = familyData?.recent_moods?.[familyData.recent_moods.length - 1]
    const todayActivities = familyData?.recent_activities?.filter(a => {
        const actDate = new Date(a.timestamp || a.date)
        const today = new Date()
        return actDate.toDateString() === today.toDateString()
    }) || []

    const stats = [
        { label: 'Routine Score', value: `${Math.min(100, 70 + todayActivities.length * 5)}%`, trend: todayActivities.length > 2 ? '+4%' : '', icon: '📅', color: 'green' },
        { label: 'Mood', value: latestMood?.rating || 'Good', icon: getMoodEmoji(latestMood?.rating), color: 'yellow' },
        { label: 'Social', value: todayActivities.length > 2 ? 'High' : 'Normal', sublabel: `${todayActivities.length} activities`, icon: '👥', color: 'blue' },
        { label: 'Alerts', value: alertsData.unread_count > 0 ? `${alertsData.unread_count} new` : 'None', icon: '🔔', color: alertsData.unread_count > 0 ? 'pink' : 'green' },
    ]

    // Format activities for timeline display
    const timelineActivities = (familyData?.recent_activities || [])
        .slice(-5)
        .reverse()
        .map(a => ({
            time: formatTime(a.timestamp || a.date),
            activity: a.description || a.activity_type || 'Activity logged',
            icon: getActivityIcon(a.activity_type)
        }))
    
    // If no real data, show placeholder
    const displayActivities = timelineActivities.length > 0 ? timelineActivities : [
        { time: '--:--', activity: 'No recent activities', icon: '📋' }
    ]

    // Calculate budget from real expenses
    const expenses = familyData?.recent_expenses || []
    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
    const budgetData = {
        spent: totalSpent,
        total: 1200, // Default budget, could be from user settings
        categories: aggregateExpensesByCategory(expenses)
    }

    // Get recent alerts for display
    const alerts = (alertsData.alerts || []).slice(0, 3).map(a => ({
        type: a.type === 'success' ? 'success' : a.type === 'warning' ? 'warning' : 'info',
        message: a.message,
        time: getTimeAgo(a.timestamp)
    }))

    return (
        <div className="dashboard-home">
            <div className="page-header">
                <div>
                    <h1>Welcome, David 👋</h1>
                    <p>Here's how {data.name} is doing today</p>
                </div>
                <div className="header-date">
                    <Calendar size={18} />
                    <span>{currentDate}</span>
                    {isLoading && <span className="loading-indicator">Refreshing...</span>}
                </div>
            </div>

            {/* Status Cards */}
            <div className="status-cards">
                {stats.map((stat, idx) => (
                    <div key={idx} className={`status-card ${stat.color}`}>
                        <div className="card-icon">{stat.icon}</div>
                        <div className="card-content">
                            <span className="card-value">{stat.value}</span>
                            <span className="card-label">{stat.label}</span>
                            {stat.trend && <span className="card-trend up">{stat.trend}</span>}
                            {stat.sublabel && <span className="card-sublabel" style={{ fontSize: '0.75rem', color: '#7A7267', marginTop: '4px' }}>{stat.sublabel}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Grid */}
            <div className="dashboard-grid">
                {/* Today's Activity */}
                <div className="card">
                    <div className="card-header">
                        <h2>Timeline</h2>
                        <Link to="/family/activity" className="see-all">View All <ChevronRight size={16} /></Link>
                    </div>
                    <div className="timeline">
                        {displayActivities.map((activity, idx) => (
                            <div key={idx} className="timeline-item">
                                <span className="timeline-time">{activity.time}</span>
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <span className="timeline-icon">{activity.icon}</span>
                                    <span className="timeline-text">{activity.activity}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Budget Overview */}
                <div className="card">
                    <div className="card-header">
                        <h2>Expenses</h2>
                        <Link to="/family/budget" className="see-all">Details <ChevronRight size={16} /></Link>
                    </div>
                    <div className="budget-overview">
                        <div className="budget-circle">
                            <svg viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#E8E4DD" strokeWidth="8" />
                                <circle
                                    cx="50" cy="50" r="40" fill="none"
                                    stroke="#C17F59" strokeWidth="8"
                                    strokeDasharray={`${(budgetData.spent / budgetData.total) * 251} 251`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="budget-center">
                                <span className="spent">${budgetData.spent}</span>
                                <span className="of">of</span>
                                <span className="total">${budgetData.total}</span>
                            </div>
                        </div>
                        <div className="budget-breakdown">
                            {budgetData.categories.map((cat, idx) => (
                                <div key={idx} className="budget-item">
                                    <span className="item-name">
                                        <span>{cat.name}</span>
                                        <span className="item-amount">${cat.amount}</span>
                                    </span>
                                    <div className="item-bar">
                                        <div className="bar-fill" style={{ width: `${(cat.amount / 500) * 100}%`, background: idx === 0 ? '#5B7355' : idx === 1 ? '#C17F59' : '#5B8A8A' }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="card">
                    <div className="card-header">
                        <h2>Insights</h2>
                        <Link to="/family/alerts" className="see-all">All <ChevronRight size={16} /></Link>
                    </div>
                    <div className="alerts-list">
                        {alerts.map((alert, idx) => (
                            <div key={idx} className={`alert-item ${alert.type}`}>
                                <div className="alert-icon">
                                    {alert.type === 'success' ? <Check size={14} /> : '!'}
                                </div>
                                <div className="alert-content">
                                    <p>{alert.message}</p>
                                    <span className="alert-time">{alert.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-bar">
                <button className="quick-action">📞 Call Mom</button>
                <button className="quick-action">💬 Message Circle</button>
                <button className="quick-action">📅 Schedule Visit</button>
            </div>
        </div>
    )
}

/* Chat History - View elder's conversations with Amble */
function ChatHistory() {
    const [chatData, setChatData] = useState({ chat_history: [], total_count: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadChats = async () => {
            setIsLoading(true)
            const data = await fetchChatHistory()
            setChatData(data)
            setIsLoading(false)
        }
        loadChats()
    }, [])

    const formatTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const formatDateHeader = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        
        if (date.toDateString() === today.toDateString()) return 'Today'
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }

    // Group messages by date
    const groupedChats = chatData.chat_history.reduce((groups, chat) => {
        const dateKey = new Date(chat.timestamp).toDateString()
        if (!groups[dateKey]) groups[dateKey] = []
        groups[dateKey].push(chat)
        return groups
    }, {})

    return (
        <div className="chat-history">
            <div className="page-header">
                <div>
                    <h1>💬 Conversation History</h1>
                    <p>View your loved one's chats with Amble ({chatData.total_count} conversations)</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading conversations...</p>
                </div>
            ) : chatData.chat_history.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>No conversations yet. Chats will appear here once your loved one starts talking to Amble.</p>
                </div>
            ) : (
                <div className="chat-thread-container" style={{
                    background: '#F5F3EF',
                    borderRadius: '16px',
                    padding: '16px',
                    maxHeight: '70vh',
                    overflowY: 'auto'
                }}>
                    {Object.entries(groupedChats).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([dateKey, chats]) => (
                        <div key={dateKey}>
                            {/* Date Header */}
                            <div style={{
                                textAlign: 'center',
                                padding: '12px 0',
                                position: 'sticky',
                                top: 0,
                                zIndex: 1
                            }}>
                                <span style={{
                                    background: '#E8E4DD',
                                    padding: '6px 16px',
                                    borderRadius: '16px',
                                    fontSize: '0.8rem',
                                    color: '#7A7267',
                                    fontWeight: '500'
                                }}>
                                    {formatDateHeader(chats[0].timestamp)}
                                </span>
                            </div>
                            
                            {/* Messages for this date */}
                            {chats.map((chat, idx) => (
                                <div key={idx} style={{ marginBottom: '16px' }}>
                                    {/* User Message (Elder) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{
                                            maxWidth: '75%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end'
                                        }}>
                                            <div style={{
                                                background: '#5B8A8A',
                                                color: 'white',
                                                padding: '12px 16px',
                                                borderRadius: '18px 18px 4px 18px',
                                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                            }}>
                                                <p style={{ margin: 0, lineHeight: 1.4 }}>{chat.user_message}</p>
                                            </div>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#9A9088',
                                                marginTop: '4px',
                                                marginRight: '4px'
                                            }}>
                                                Mom • {formatTime(chat.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Agent Response (Amble) */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start'
                                    }}>
                                        <div style={{
                                            maxWidth: '75%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                                                <span style={{ fontSize: '1.5rem' }}>🌿</span>
                                                <div style={{
                                                    background: 'white',
                                                    color: '#524C44',
                                                    padding: '12px 16px',
                                                    borderRadius: '18px 18px 18px 4px',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                                                }}>
                                                    <p style={{ margin: 0, lineHeight: 1.4 }}>{chat.agent_response}</p>
                                                </div>
                                            </div>
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                color: '#9A9088',
                                                marginTop: '4px',
                                                marginLeft: '36px'
                                            }}>
                                                Amble
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* Activity Feed - Real activity data */
function ActivityFeed() {
    const [activityData, setActivityData] = useState({ recent_activities: [] })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            const data = await fetchWellness()
            setActivityData(data)
            setIsLoading(false)
        }
        loadData()
    }, [])

    return (
        <div className="activity-feed">
            <div className="page-header">
                <div>
                    <h1>📅 Daily Routine</h1>
                    <p>Track activities and habits</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading activities...</p>
                </div>
            ) : (
                <>
                    <div className="stats-row">
                        <div className="stat-card">
                            <span className="stat-value">{activityData.total_activity_minutes_week || 0}</span>
                            <span className="stat-label">Minutes Active (7 days)</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{activityData.recent_activities?.length || 0}</span>
                            <span className="stat-label">Activities Logged</span>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="card-header">
                            <h2>Recent Activities</h2>
                        </div>
                        <div className="activity-list">
                            {activityData.recent_activities?.length === 0 ? (
                                <p style={{ padding: '1rem', color: '#7A7267' }}>No activities recorded yet.</p>
                            ) : (
                                activityData.recent_activities?.map((activity, idx) => (
                                    <div key={idx} className="activity-item">
                                        <div className="activity-icon">{getActivityIcon(activity.activity_type)}</div>
                                        <div className="activity-details">
                                            <h4>{activity.activity_name || activity.activity_type}</h4>
                                            <p>{activity.duration_minutes} minutes • {formatDate(activity.timestamp)}</p>
                                            {activity.notes && <small>{activity.notes}</small>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/* Budget Insights - Real expense data */
function BudgetInsights() {
    const [expenseData, setExpenseData] = useState({ recent_expenses: [], total_spent: 0, by_category: [] })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            const data = await fetchExpenses()
            setExpenseData(data)
            setIsLoading(false)
        }
        loadData()
    }, [])

    return (
        <div className="budget-insights">
            <div className="page-header">
                <div>
                    <h1>💰 Financial Health</h1>
                    <p>Track expenses and spending patterns</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading expenses...</p>
                </div>
            ) : (
                <>
                    <div className="stats-row">
                        <div className="stat-card highlight">
                            <span className="stat-value">₹{expenseData.total_spent}</span>
                            <span className="stat-label">Total Spent</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{expenseData.expense_count || 0}</span>
                            <span className="stat-label">Transactions</span>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        <div className="card">
                            <div className="card-header">
                                <h2>By Category</h2>
                            </div>
                            <div className="category-breakdown">
                                {expenseData.by_category?.map((cat, idx) => (
                                    <div key={idx} className="category-item">
                                        <span className="category-icon">{getCategoryIcon(cat.category)}</span>
                                        <span className="category-name">{cat.category}</span>
                                        <span className="category-amount">₹{cat.amount}</span>
                                        <div className="category-bar">
                                            <div 
                                                className="bar-fill" 
                                                style={{ 
                                                    width: `${(cat.amount / expenseData.total_spent) * 100}%`,
                                                    background: idx === 0 ? '#5B7355' : idx === 1 ? '#C17F59' : '#5B8A8A'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2>Recent Transactions</h2>
                            </div>
                            <div className="expense-list">
                                {expenseData.recent_expenses?.slice(-10).reverse().map((exp, idx) => (
                                    <div key={idx} className="expense-item">
                                        <span className="expense-icon">{getCategoryIcon(exp.category)}</span>
                                        <div className="expense-details">
                                            <span className="expense-desc">{exp.description}</span>
                                            <span className="expense-date">{formatDate(exp.timestamp)}</span>
                                        </div>
                                        <span className="expense-amount">₹{exp.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/* Health Dashboard - Real wellness data */
function HealthDashboard() {
    const [wellnessData, setWellnessData] = useState({ recent_moods: [], recent_activities: [], wellness_score: 0 })
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            const data = await fetchWellness()
            setWellnessData(data)
            setIsLoading(false)
        }
        loadData()
    }, [])

    return (
        <div className="health-dashboard">
            <div className="page-header">
                <div>
                    <h1>❤️ Wellness Monitor</h1>
                    <p>Track mood, energy, and overall wellbeing</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading wellness data...</p>
                </div>
            ) : (
                <>
                    <div className="stats-row">
                        <div className="stat-card highlight">
                            <span className="stat-value">{wellnessData.wellness_score}</span>
                            <span className="stat-label">Wellness Score</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{wellnessData.avg_energy_level || 0}/10</span>
                            <span className="stat-label">Avg Energy</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value" style={{ textTransform: 'capitalize' }}>{wellnessData.mood_trend || 'stable'}</span>
                            <span className="stat-label">Mood Trend</span>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2>Recent Moods</h2>
                        </div>
                        <div className="mood-list">
                            {wellnessData.recent_moods?.length === 0 ? (
                                <p style={{ padding: '1rem', color: '#7A7267' }}>No mood data recorded yet.</p>
                            ) : (
                                wellnessData.recent_moods?.slice(-10).reverse().map((mood, idx) => (
                                    <div key={idx} className="mood-item">
                                        <span className="mood-emoji">{getMoodEmoji(mood.mood)}</span>
                                        <div className="mood-details">
                                            <h4 style={{ textTransform: 'capitalize' }}>{mood.mood}</h4>
                                            <p>Energy: {mood.energy_level}/10 • {formatDate(mood.timestamp)}</p>
                                            {mood.details && <small>{mood.details}</small>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

/* Alerts View - Real alerts data */
function AlertsView() {
    const [alertsData, setAlertsData] = useState({ alerts: [], unread_count: 0 })
    const [familyAlerts, setFamilyAlerts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            const [alerts, summary] = await Promise.all([
                fetchAlerts(),
                fetchFamilySummary()
            ])
            setAlertsData(alerts)
            setFamilyAlerts(summary?.alerts || [])
            setIsLoading(false)
        }
        loadData()
    }, [])

    // Combine system alerts and family alerts
    const allAlerts = [...(alertsData.alerts || []), ...(familyAlerts || [])]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    return (
        <div className="alerts-view">
            <div className="page-header">
                <div>
                    <h1>🔔 Smart Alerts</h1>
                    <p>AI-detected insights and notifications ({allAlerts.length} total)</p>
                </div>
            </div>
            
            {isLoading ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <p>Loading alerts...</p>
                </div>
            ) : allAlerts.length === 0 ? (
                <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>No alerts yet. Amble will notify you of important updates here.</p>
                </div>
            ) : (
                <div className="alerts-list-full">
                    {allAlerts.map((alert, idx) => (
                        <div key={idx} className={`alert-card ${alert.urgency || 'low'}`}>
                            <div className="alert-header">
                                <span className={`alert-urgency ${alert.urgency || 'low'}`}>
                                    {alert.urgency === 'critical' ? '🚨' : alert.urgency === 'high' ? '⚠️' : 'ℹ️'}
                                    {alert.urgency || 'info'}
                                </span>
                                <span className="alert-time">{formatDate(alert.timestamp)}</span>
                            </div>
                            <p className="alert-message">{alert.message}</p>
                            {alert.category && <span className="alert-category">{alert.category}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/* Family Network - Show family members and coordination */
function FamilyNetwork({ data, familyData }) {
    const familyMembers = familyData?.user_profile?.family_members || []
    const longTermMemory = familyData?.long_term_memory || []
    
    // Extract family facts from long-term memory
    const familyFacts = longTermMemory.filter(m => m.category === 'family')

    return (
        <div className="family-network">
            <div className="page-header">
                <div>
                    <h1>👨‍👩‍👧‍👦 Family Circle</h1>
                    <p>Coordinate care with loved ones</p>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2>About {data.name}</h2>
                </div>
                <div className="profile-summary">
                    <div className="profile-avatar">{data.avatar}</div>
                    <div className="profile-details">
                        <h3>{data.name}</h3>
                        <p>📍 {data.location}</p>
                        <p>Age: {familyData?.user_profile?.age || '--'}</p>
                        <p>Interests: {familyData?.user_profile?.interests?.join(', ') || 'Not specified'}</p>
                    </div>
                </div>
            </div>

            {familyFacts.length > 0 && (
                <div className="card">
                    <div className="card-header">
                        <h2>Family Notes</h2>
                    </div>
                    <div className="family-facts">
                        {familyFacts.map((fact, idx) => (
                            <div key={idx} className="fact-item">
                                <span className="fact-icon">💭</span>
                                <p>{fact.fact}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <h2>Care Circle Members</h2>
                </div>
                {familyMembers.length === 0 ? (
                    <p style={{ padding: '1rem', color: '#7A7267' }}>
                        No family members added yet. Use the invite feature to add family members.
                    </p>
                ) : (
                    <div className="family-members-list">
                        {familyMembers.map((member, idx) => (
                            <div key={idx} className="family-member">
                                <div className="member-avatar">👤</div>
                                <div className="member-info">
                                    <h4>{member.name}</h4>
                                    <p>{member.relation}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default FamilyDashboard
