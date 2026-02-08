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
import { UserBadge, SignInModal } from '../components/SignIn'
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
    const { currentUser, isSignedIn, isLoading: authLoading } = useAuth()
    const location = useLocation()
    const userId = currentUser?.id || null
    const [userData, setUserData] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showSignIn, setShowSignIn] = useState(false)

    // Show sign-in gate if not authenticated
    useEffect(() => {
        if (!authLoading && !isSignedIn) {
            setShowSignIn(true)
        } else {
            setShowSignIn(false)
        }
    }, [authLoading, isSignedIn])

    // Determine back navigation path
    const getBackPath = () => {
        if (location.pathname === '/dashboard') {
            return '/' // Go to home page from main dashboard
        }
        return '/dashboard' // Go to dashboard from sub-pages
    }

    // Load user data
    useEffect(() => {
        if (!userId) {
            setIsLoading(false)
            return
        }
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
            {/* Sign-in gate */}
            {showSignIn && <SignInModal mode="all" onClose={null} />}

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
                    <UserBadge showName={true} />
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

// Activity View Component
function ActivityView({ userData }) {
    const activities = userData?.activities || []
    const todayActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp).toDateString()
        const today = new Date().toDateString()
        return activityDate === today
    })
    const weekActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return activityDate >= weekAgo
    })

    const totalDuration = weekActivities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)

    return (
        <div className="view-container">
            <div className="page-header">
                <div>
                    <h1>Activities & Exercise</h1>
                    <p>Track your daily movements and activities</p>
                </div>
            </div>

            <div className="status-cards">
                <div className="status-card">
                    <div className="card-icon activity">
                        <Activity size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{todayActivities.length}</h3>
                        <p>Today's Activities</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <Clock size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{totalDuration} min</h3>
                        <p>This Week</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{weekActivities.length}</h3>
                        <p>Weekly Count</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-card">
                <div className="card-header">
                    <h3>All Activities</h3>
                    <span className="count-badge">{activities.length} total</span>
                </div>
                <div className="activity-list">
                    {activities.length > 0 ? activities.map((activity, index) => (
                        <div key={index} className="activity-item detailed">
                            <span className="activity-icon">
                                {getActivityIcon(activity.activity_type)}
                            </span>
                            <div className="activity-info">
                                <span className="activity-name">
                                    {activity.activity_name || activity.activity_type}
                                </span>
                                <span className="activity-meta">
                                    {formatTime(activity.timestamp)}
                                    {activity.duration_minutes && ` • ${activity.duration_minutes} min`}
                                </span>
                            </div>
                            {activity.notes && (
                                <span className="activity-notes">{activity.notes}</span>
                            )}
                        </div>
                    )) : (
                        <div className="empty-state">
                            <Activity size={48} />
                            <p>No activities recorded yet</p>
                            <Link to="/app" className="cta-link">Start tracking with Amble</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function HealthView({ userData }) {
    const moods = userData?.moods || []
    const latestMood = moods[0]
    const weekMoods = moods.filter(mood => {
        const moodDate = new Date(mood.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return moodDate >= weekAgo
    })

    const avgEnergy = weekMoods.length > 0 
        ? (weekMoods.reduce((sum, m) => sum + (m.energy_level || 5), 0) / weekMoods.length).toFixed(1)
        : '5.0'

    return (
        <div className="view-container">
            <div className="page-header">
                <div>
                    <h1>Health & Wellness</h1>
                    <p>Monitor your mood and wellbeing</p>
                </div>
            </div>

            <div className="status-cards">
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
                    <div className="card-icon">
                        <Heart size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{avgEnergy}/10</h3>
                        <p>Avg Energy Level</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{weekMoods.length}</h3>
                        <p>Check-ins This Week</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-card">
                <div className="card-header">
                    <h3>Mood History</h3>
                    <span className="count-badge">{moods.length} entries</span>
                </div>
                <div className="mood-list">
                    {moods.length > 0 ? moods.map((mood, index) => (
                        <div key={index} className="mood-item">
                            <span className="mood-emoji-large">
                                {getMoodEmoji(mood.rating)}
                            </span>
                            <div className="mood-info">
                                <span className="mood-rating">{mood.rating}</span>
                                <span className="mood-time">{formatTime(mood.timestamp)}</span>
                                <span className="mood-energy">Energy: {mood.energy_level || 5}/10</span>
                            </div>
                            {mood.notes && (
                                <span className="mood-notes">{mood.notes}</span>
                            )}
                        </div>
                    )) : (
                        <div className="empty-state">
                            <Heart size={48} />
                            <p>No mood entries yet</p>
                            <Link to="/app" className="cta-link">Share how you're feeling</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function BudgetView({ userData }) {
    const expenses = userData?.expenses || []
    const todayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.timestamp).toDateString()
        const today = new Date().toDateString()
        return expenseDate === today
    })
    const weekExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return expenseDate >= weekAgo
    })

    const todayTotal = todayExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    const weekTotal = weekExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    const allTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)

    // Category breakdown
    const categories = {}
    expenses.forEach(exp => {
        const cat = exp.category || 'other'
        categories[cat] = (categories[cat] || 0) + (parseFloat(exp.amount) || 0)
    })

    return (
        <div className="view-container">
            <div className="page-header">
                <div>
                    <h1>Expenses & Budget</h1>
                    <p>Track your spending and manage finances</p>
                </div>
            </div>

            <div className="status-cards">
                <div className="status-card">
                    <div className="card-icon expense">
                        <Wallet size={24} />
                    </div>
                    <div className="card-content">
                        <h3>₹{todayTotal.toFixed(0)}</h3>
                        <p>Today's Spending</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="card-content">
                        <h3>₹{weekTotal.toFixed(0)}</h3>
                        <p>This Week</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{expenses.length}</h3>
                        <p>Total Transactions</p>
                    </div>
                </div>
            </div>

            {Object.keys(categories).length > 0 && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Spending by Category</h3>
                    </div>
                    <div className="category-breakdown">
                        {Object.entries(categories)
                            .sort((a, b) => b[1] - a[1])
                            .map(([category, amount]) => (
                                <div key={category} className="category-item">
                                    <span className="category-name">{category}</span>
                                    <span className="category-amount">₹{amount.toFixed(0)}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            <div className="dashboard-card">
                <div className="card-header">
                    <h3>All Expenses</h3>
                    <span className="count-badge">₹{allTotal.toFixed(0)} total</span>
                </div>
                <div className="expense-list">
                    {expenses.length > 0 ? expenses.map((expense, index) => (
                        <div key={index} className="expense-item detailed">
                            <div className="expense-info">
                                <span className="expense-category">{expense.category}</span>
                                <span className="expense-time">{formatTime(expense.timestamp)}</span>
                            </div>
                            <span className="expense-amount">₹{parseFloat(expense.amount).toFixed(0)}</span>
                            {expense.description && (
                                <span className="expense-description">{expense.description}</span>
                            )}
                        </div>
                    )) : (
                        <div className="empty-state">
                            <Wallet size={48} />
                            <p>No expenses tracked yet</p>
                            <Link to="/app" className="cta-link">Tell Amble about your spending</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function FamilyView({ userData }) {
    const profile = userData?.user_profile || {}
    const familyMembers = profile.family_members || []
    const appointments = userData?.appointments || []

    return (
        <div className="view-container">
            <div className="page-header">
                <div>
                    <h1>Family & Connections</h1>
                    <p>Stay connected with your loved ones</p>
                </div>
            </div>

            <div className="status-cards">
                <div className="status-card">
                    <div className="card-icon family">
                        <Phone size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{familyMembers.length}</h3>
                        <p>Family Members</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <Calendar size={24} />
                    </div>
                    <div className="card-content">
                        <h3>{appointments.length}</h3>
                        <p>Appointments</p>
                    </div>
                </div>
                <div className="status-card">
                    <div className="card-icon">
                        <Video size={24} />
                    </div>
                    <div className="card-content">
                        <h3>0</h3>
                        <p>Scheduled Calls</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-card">
                <div className="card-header">
                    <h3>Family Members</h3>
                    <Link to="/family" className="view-all">
                        Family Portal <ArrowRight size={16} />
                    </Link>
                </div>
                <div className="family-list">
                    {familyMembers.length > 0 ? familyMembers.map((member, index) => (
                        <div key={index} className="family-item">
                            <span className="family-avatar">{member.avatar || '👤'}</span>
                            <div className="family-info">
                                <span className="family-name">{member.name}</span>
                                <span className="family-relation">{member.relation}</span>
                            </div>
                            {member.phone && (
                                <a href={`tel:${member.phone}`} className="family-action">
                                    <Phone size={18} />
                                </a>
                            )}
                        </div>
                    )) : (
                        <div className="empty-state">
                            <Phone size={48} />
                            <p>No family members added yet</p>
                            <Link to="/onboarding" className="cta-link">Add family members</Link>
                        </div>
                    )}
                </div>
            </div>

            {appointments.length > 0 && (
                <div className="dashboard-card">
                    <div className="card-header">
                        <h3>Upcoming Appointments</h3>
                    </div>
                    <div className="appointment-list">
                        {appointments.map((appointment, index) => (
                            <div key={index} className="appointment-item detailed">
                                <div className="appointment-time">
                                    <Clock size={16} />
                                    <span>{formatTime(appointment.date_time)}</span>
                                </div>
                                <div className="appointment-info">
                                    <span className="appointment-title">{appointment.title}</span>
                                    <span className="appointment-type">{appointment.type}</span>
                                    {appointment.location && (
                                        <span className="appointment-location">📍 {appointment.location}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}