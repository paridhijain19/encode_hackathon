import { useState } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import {
    Home, Activity, Wallet, Heart, Bell, Users, Settings, Phone, Video,
    ChevronLeft, ChevronRight, Calendar, Clock, MapPin, TrendingUp, TrendingDown, Check, AlertCircle, MessageCircle
} from 'lucide-react'
import './FamilyDashboard.css'

function FamilyDashboard() {
    const location = useLocation()

    const navItems = [
        { id: 'home', path: '/family', icon: Home, label: 'Overview' },
        { id: 'activity', path: '/family/activity', icon: Activity, label: 'Routine' },
        { id: 'budget', path: '/family/budget', icon: Wallet, label: 'Expenses' },
        { id: 'health', path: '/family/health', icon: Heart, label: 'Wellness' },
        { id: 'alerts', path: '/family/alerts', icon: Bell, label: 'Alerts' },
        { id: 'family', path: '/family/network', icon: Users, label: 'Circle' },
    ]

    const parentData = {
        name: 'Mom',
        location: 'Home',
        status: 'Active 10m ago',
        avatar: '👩‍🦳',
    }

    const isActive = (path) => {
        if (path === '/family') return location.pathname === '/family'
        return location.pathname.startsWith(path)
    }

    return (
        <div className="family-dashboard">
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <Link to="/" className="back-btn">
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

                <div className="sidebar-parent">
                    <div className="parent-avatar">{parentData.avatar}</div>
                    <div className="parent-info">
                        <h4>{parentData.name}</h4>
                        <p>📍 {parentData.location}</p>
                        <span className="status online">● Active</span>
                    </div>
                </div>

                <div className="sidebar-actions">
                    <button className="action-btn call">
                        <Phone size={18} />
                        <span>Call</span>
                    </button>
                    <button className="action-btn video">
                        <Video size={18} />
                        <span>Video</span>
                    </button>
                </div>

                <div className="sidebar-footer">
                    <Link to="#" className="settings-link">
                        <Settings size={18} />
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <Routes>
                    <Route path="/" element={<DashboardHome data={parentData} />} />
                    <Route path="/activity" element={<ActivityFeed />} />
                    <Route path="/budget" element={<BudgetInsights />} />
                    <Route path="/health" element={<HealthDashboard />} />
                    <Route path="/alerts" element={<AlertsView />} />
                    <Route path="/network" element={<FamilyNetwork data={parentData} />} />
                </Routes>
            </main>
        </div>
    )
}

/* Dashboard Home */
function DashboardHome({ data }) {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    const stats = [
        { label: 'Routine Score', value: '92%', trend: '+4%', icon: '📅', color: 'green' },
        { label: 'Mood', value: 'Happy', icon: '😊', color: 'yellow' },
        { label: 'Social', value: 'High', sublabel: '3 Interactions', icon: '👥', color: 'blue' },
        { label: 'Meds', value: 'On Track', trend: '100%', icon: '💊', color: 'pink' },
    ]

    const todayActivities = [
        { time: '8:00 AM', activity: 'Morning walk completed (30m)', icon: '🚶' },
        { time: '9:30 AM', activity: 'Medication taken on time', icon: '💊' },
        { time: '11:00 AM', activity: 'Attended Book Club', icon: '📚' },
        { time: '2:15 PM', activity: 'Afternoon nap', icon: '😴' },
    ]

    const budgetData = {
        spent: 850,
        total: 1200,
        categories: [
            { name: 'Groceries', amount: 350 },
            { name: 'Pharmacy', amount: 150 },
            { name: 'Utilities', amount: 200 },
        ]
    }

    const alerts = [
        { type: 'success', message: 'Mom attended her social club today! 🎉', time: '2h ago' },
        { type: 'warning', message: 'Slightly less active than usual yesterday', time: 'Yesterday' },
    ]

    return (
        <div className="dashboard-home">
            <div className="page-header">
                <div>
                    <h1>Welcome, David 👋</h1>
                    <p>Here's how Mom is doing today</p>
                </div>
                <div className="header-date">
                    <Calendar size={18} />
                    <span>{currentDate}</span>
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
                        {todayActivities.map((activity, idx) => (
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

/* Activity Feed */
function ActivityFeed() {
    return (
        <div className="activity-feed">
            <div className="page-header">
                <div>
                    <h1>Daily Routine</h1>
                    <p>Track activities and habits</p>
                </div>
            </div>
            <div className="card">
                <div style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>Detailed activity log visualization would go here.</p>
                </div>
            </div>
        </div>
    )
}

/* Budget Insights */
function BudgetInsights() {
    return (
        <div className="budget-insights">
            <div className="page-header">
                <div>
                    <h1>Financial Health</h1>
                    <p>Manage expenses and budget</p>
                </div>
            </div>
            <div className="card">
                <div style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>Detailed expense breakdown and charts would go here.</p>
                </div>
            </div>
        </div>
    )
}

/* Health Dashboard */
function HealthDashboard() {
    return (
        <div className="health-dashboard">
            <div className="page-header">
                <div>
                    <h1>Wellness Monitor</h1>
                    <p>Medication, vitals, and appointments</p>
                </div>
            </div>
            <div className="card">
                <div style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>Comprehensive health data and trends would go here.</p>
                </div>
            </div>
        </div>
    )
}

/* Alerts View */
function AlertsView() {
    return (
        <div className="alerts-view">
            <div className="page-header">
                <div>
                    <h1>Smart Alerts</h1>
                    <p>AI-detected insights and notifications</p>
                </div>
            </div>
            <div className="card">
                <div style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>List of all historical alerts and insights would go here.</p>
                </div>
            </div>
        </div>
    )
}

/* Family Network */
function FamilyNetwork({ data }) {
    return (
        <div className="family-network">
            <div className="page-header">
                <div>
                    <h1>Family Circle</h1>
                    <p>Coordinate care with loved ones</p>
                </div>
            </div>
            <div className="card">
                <div style={{ padding: '2rem', textAlign: 'center', color: '#7A7267' }}>
                    <p>Family contact list and coordination tools would go here.</p>
                </div>
            </div>
        </div>
    )
}

export default FamilyDashboard
