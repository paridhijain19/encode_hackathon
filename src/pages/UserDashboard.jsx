/**
 * User Dashboard - Personal wellness and activity dashboard
 * 
 * A comprehensive dashboard for elderly users to track their daily activities,
 * health metrics, expenses, and stay connected with family.
 */

import { useState, useEffect } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import {
    Home, Activity, Wallet, Heart, MessageCircle, Settings, Phone, Video,
    ChevronLeft, Calendar, Clock, TrendingUp, Plus, User, ArrowRight
} from 'lucide-react'
import './UserDashboard.css'
import { useAuth } from '../context/AuthContext'
import { getState } from '../services/api'

// Helper functions
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

function formatTime(isoString) {
    if (!isoString) return '--:--'
    try {
        return new Date(isoString).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        })
    } catch {
        return '--:--'
    }
}

// Main Dashboard Component
export default function UserDashboard() {
    const { currentUser } = useAuth()
    const location = useLocation()
    const userId = currentUser?.id || 'default_user'
    const [userData, setUserData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Determine back navigation path
    const getBackPath = () => {
        if (location.pathname === '/dashboard') {
            return '/' // Go to home page from main dashboard
        }
        return '/dashboard' // Go to dashboard from sub-pages
    }

    // Load user data
    useEffect(() => {
        async function loadUserData() {
            try {
                setIsLoading(true)
                const data = await getState(userId)
                setUserData(data)
            } catch (error) {
                console.error('Failed to load user data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        loadUserData()
    }, [userId])

    const navItems = [
        { id: 'home', path: '/dashboard', icon: Home, label: 'Overview' },
        { id: 'chat', path: '/app', icon: MessageCircle, label: 'Chat with Amble' },
        { id: 'activity', path: '/dashboard/activity', icon: Activity, label: 'Activities' },
        { id: 'health', path: '/dashboard/health', icon: Heart, label: 'Health' },
        { id: 'budget', path: '/dashboard/budget', icon: Wallet, label: 'Expenses' },
        { id: 'family', path: '/dashboard/family', icon: Phone, label: 'Family' },
    ]

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard'
        return location.pathname.startsWith(path)
    }

    const userName = userData?.user_profile?.name || 'Friend'
    const userLocation = userData?.user_profile?.location || 'Home'

    return (
        <div className="user-dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <Link to={getBackPath()} className="back-btn">
                        <ChevronLeft size={20} />
                    </Link>
                    <div className="brand">
                        <span className="brand-icon">🌿</span>
                        <span className="brand-text">amble</span>
                    </div>
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
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="user-avatar">
                        <User size={24} />
                    </div>
                    <div className="user-info">
                        <h4>{userName}</h4>
                        <p>📍 {userLocation}</p>
                        <span className="status online">● Active</span>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <Link to="/app/settings" className="settings-link">
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <Routes>
                    <Route path="/" element={<DashboardHome userData={userData} isLoading={isLoading} />} />
                    <Route path="/activity" element={<ActivityView userData={userData} />} />
                    <Route path="/health" element={<HealthView userData={userData} />} />
                    <Route path="/budget" element={<BudgetView userData={userData} />} />
                    <Route path="/family" element={<FamilyView userData={userData} />} />
                </Routes>
            </main>
        </div>
    )
}

// Dashboard Home Component
function DashboardHome({ userData, isLoading }) {
    const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    })

    const userName = userData?.user_profile?.name || 'Friend'
    const recentActivities = (userData?.activities || []).slice(0, 3)
    const recentExpenses = (userData?.expenses || []).slice(0, 3)
    const latestMood = userData?.moods?.[0]
    const upcomingAppointments = (userData?.appointments || []).slice(0, 2)

    // Calculate daily stats
    const todayActivities = (userData?.activities || []).filter(activity => {
        const activityDate = new Date(activity.timestamp).toDateString()
        const today = new Date().toDateString()
        return activityDate === today
    }).length

    const todayExpenses = (userData?.expenses || []).filter(expense => {
        const expenseDate = new Date(expense.timestamp).toDateString()
        const today = new Date().toDateString()
        return expenseDate === today
    }).reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)

    return (
        <div className="dashboard-home">
            <div className="page-header">
                <div>
                    <h1>Good day, {userName}! 👋</h1>
                    <p>Here's your wellness overview for today</p>
                </div>
                <div className="header-date">
                    <Calendar size={18} />
                    <span>{currentDate}</span>
                    {isLoading && <span className="loading-indicator">Loading...</span>}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="status-cards">
                <div className="status-card">
                    <div className="card-icon activity">
                        <Activity size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{todayActivities}</h3>
                        <p>Activities Today</p>
                    </div>
                </div>

                <div className="status-card">
                    <div className="card-icon mood">
                        <span className="mood-emoji">
                            {latestMood ? getMoodEmoji(latestMood.rating) : '🙂'}
                        </span>
                    </div>
                    <div className="card-content">
                        <h3>{latestMood?.rating || 'Good'}</h3>
                        <p>Current Mood</p>
                    </div>
                </div>

                <div className="status-card">
                    <div className="card-icon expense">
                        <Wallet size={24} />
                    </div>
                    <div className="card-content">
                        <h3>₹{todayExpenses.toFixed(0)}</h3>
                        <p>Spent Today</p>
                    </div>
                </div>

                <div className="status-card">
                    <div className="card-icon family">
                        <Phone size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{userData?.family_members?.length || 0}</h3>
                        <p>Family Connected</p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
                {/* Recent Activities */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Recent Activities</h3>
                        <Link to="/dashboard/activity" className="view-all">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="activity-list">
                        {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <span className="activity-icon">
                                    {getActivityIcon(activity.activity_type)}
                                </span>
                                <div className="activity-info">
                                    <span className="activity-name">
                                        {activity.activity_name || activity.activity_type}
                                    </span>
                                    <span className="activity-time">
                                        {formatTime(activity.timestamp)}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">
                                <p>No activities recorded yet</p>
                                <Link to="/app" className="cta-link">Start chatting with Amble</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming Appointments */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Upcoming</h3>
                        <Link to="/app/quick-add" className="view-all">
                            Add <Plus size={16} />
                        </Link>
                    </div>
                    <div className="appointment-list">
                        {upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment, index) => (
                            <div key={index} className="appointment-item">
                                <div className="appointment-time">
                                    <Clock size={16} />
                                    <span>{formatTime(appointment.date_time)}</span>
                                </div>
                                <div className="appointment-info">
                                    <span className="appointment-title">{appointment.title}</span>
                                    <span className="appointment-type">{appointment.type}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">
                                <p>No upcoming appointments</p>
                                <Link to="/app" className="cta-link">Ask Amble to schedule something</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Recent Expenses</h3>
                        <Link to="/dashboard/budget" className="view-all">
                            View All <ArrowRight size={16} />
                        </Link>
                    </div>
                    <div className="expense-list">
                        {recentExpenses.length > 0 ? recentExpenses.map((expense, index) => (
                            <div key={index} className="expense-item">
                                <span className="expense-category">{expense.category}</span>
                                <span className="expense-amount">₹{expense.amount}</span>
                            </div>
                        )) : (
                            <div className="empty-state">
                                <p>No expenses tracked yet</p>
                                <Link to="/app" className="cta-link">Tell Amble about your spending</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Quick Actions</h3>
                    </div>
                    <div className="quick-actions">
                        <Link to="/app" className="action-btn primary">
                            <MessageCircle size={20} />
                            <span>Chat with Amble</span>
                        </Link>
                        <Link to="/app/quick-add" className="action-btn secondary">
                            <Plus size={20} />
                            <span>Quick Add</span>
                        </Link>
                        <Link to="/family" className="action-btn secondary">
                            <Phone size={20} />
                            <span>Family Portal</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Placeholder components for other views
function ActivityView({ userData }) {
    return (
        <div className="view-container">
            <h1>Activities</h1>
            <p>Your activity history and tracking</p>
        </div>
    )
}

function HealthView({ userData }) {
    return (
        <div className="view-container">
            <h1>Health & Wellness</h1>
            <p>Your health metrics and mood tracking</p>
        </div>
    )
}

function BudgetView({ userData }) {
    return (
        <div className="view-container">
            <h1>Expenses & Budget</h1>
            <p>Your spending overview and budget tracking</p>
        </div>
    )
}

function FamilyView({ userData }) {
    return (
        <div className="view-container">
            <h1>Family & Connections</h1>
            <p>Stay connected with your loved ones</p>
        </div>
    )
}