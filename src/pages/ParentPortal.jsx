import { useState } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import {
    Home, Wallet, Heart, Activity, Users, Mic, Phone, Camera,
    Calendar, Clock, ChevronLeft, Volume2, Plus, Check, X, Sun, Moon
} from 'lucide-react'
import './ParentPortal.css'

function ParentPortal() {
    const location = useLocation()
    const [isListening, setIsListening] = useState(false)

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    })

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const navItems = [
        { path: '/parent', icon: Home, label: 'Home' },
        { path: '/parent/budget', icon: Wallet, label: 'Budget' },
        { path: '/parent/health', icon: Heart, label: 'Health' },
        { path: '/parent/activities', icon: Activity, label: 'Activities' },
        { path: '/parent/family', icon: Users, label: 'Family' },
    ]

    const isActive = (path) => {
        if (path === '/parent') return location.pathname === '/parent'
        return location.pathname.startsWith(path)
    }

    return (
        <div className="parent-portal">
            {/* Header */}
            <header className="portal-header">
                <Link to="/" className="back-btn">
                    <ChevronLeft size={24} />
                </Link>
                <div className="header-content">
                    <div className="greeting-section">
                        <h1>{getGreeting()}, Mom!</h1>
                    </div>
                    <p className="date-text">{currentDate}</p>
                </div>
                <button className="speak-btn">
                    <Volume2 size={24} />
                </button>
            </header>

            {/* Main Content */}
            <main className="portal-main">
                <Routes>
                    <Route path="/" element={<HomeView />} />
                    <Route path="/budget" element={<BudgetView />} />
                    <Route path="/health" element={<HealthView />} />
                    <Route path="/activities" element={<ActivitiesView />} />
                    <Route path="/family" element={<FamilyView />} />
                </Routes>
            </main>

            {/* Voice FAB */}
            <button
                className={`voice-fab ${isListening ? 'listening' : ''}`}
                onClick={() => setIsListening(!isListening)}
            >
                <Mic size={28} />
                <span>Speak</span>
            </button>

            {/* Bottom Navigation */}
            <nav className="bottom-nav">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                    >
                        <item.icon size={26} />
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    )
}

/* Home View */
function HomeView() {
    const quickActions = [
        { icon: '💊', label: 'Took Meds', color: '#5B7355' },
        { icon: '📞', label: 'Call Son', color: '#5B8A8A' },
        { icon: '🚶', label: 'Walk Done', color: '#C17F59' },
        { icon: '📝', label: 'Add Expense', color: '#9CAF88' },
    ]

    const todaySchedule = [
        { time: '7:30 AM', activity: 'Morning Walk in Park', icon: '🌳', done: true },
        { time: '9:00 AM', activity: 'Blood Pressure Meds', icon: '💊', done: true },
        { time: '11:00 AM', activity: 'Tea with Mrs. Gupta', icon: '🍵', done: true },
        { time: '4:00 PM', activity: 'Virtual Yoga Class', icon: '🧘', done: false },
        { time: '8:00 PM', activity: 'Video Call with Sarah', icon: '📱', done: false },
    ]

    return (
        <div className="home-view">
            {/* Wellness Check */}
            <section className="section-card" style={{ background: 'linear-gradient(135deg, #FAF9F7 0%, #F5F3EF 100%)', border: '1px solid #E8E4DD' }}>
                <div className="section-header">
                    <h2>🌿 Daily Wellness</h2>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#524C44' }}>You're doing great nicely today!</p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A7267' }}>3 of 5 goals completed</p>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #9CAF88', color: '#3D4F38', fontWeight: 'bold' }}>
                        60%
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
                {quickActions.map((action, idx) => (
                    <button
                        key={idx}
                        className="quick-action-card"
                        style={{ backgroundColor: action.color }}
                    >
                        <span className="action-icon">{action.icon}</span>
                        <span className="action-label">{action.label}</span>
                    </button>
                ))}
            </div>

            {/* Today's Schedule */}
            <section className="section-card">
                <div className="section-header">
                    <h2>📅 Today's Plan</h2>
                    <Link to="#" className="see-all">See Full Day</Link>
                </div>
                <div className="schedule-list">
                    {todaySchedule.map((item, idx) => (
                        <div key={idx} className={`schedule-item ${item.done ? 'done' : ''}`}>
                            <span className="schedule-time">{item.time}</span>
                            <span className="schedule-icon">{item.icon}</span>
                            <span className="schedule-activity">{item.activity}</span>
                            <button className="schedule-check">
                                {item.done ? <Check size={20} /> : <div className="check-empty" />}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Daily Tip */}
            <section className="tip-card">
                <span className="tip-icon">💡</span>
                <p>Stay hydrated! Drinking water before meals helps digestion.</p>
            </section>
        </div>
    )
}

/* Budget View */
function BudgetView() {
    const categories = [
        { name: 'Groceries', spent: 450, budget: 600, icon: '🥦', color: '#5B7355' },
        { name: 'Pharmacy', spent: 120, budget: 200, icon: '💊', color: '#C17F59' },
        { name: 'Utilities', spent: 180, budget: 250, icon: '💡', color: '#5B8A8A' },
        { name: 'Leisure', spent: 85, budget: 150, icon: '🎨', color: '#9CAF88' },
    ]

    const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0)
    const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0)

    return (
        <div className="budget-view">
            {/* Budget Overview */}
            <div className="budget-overview-card">
                <div className="budget-circle">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#E8E4DD" strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r="45" fill="none"
                            stroke="#C17F59" strokeWidth="8"
                            strokeDasharray={`${(totalSpent / totalBudget) * 283} 283`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="budget-center">
                        <span className="spent">${totalSpent}</span>
                        <span className="of">of</span>
                        <span className="total">${totalBudget}</span>
                    </div>
                </div>
                <div className="budget-info">
                    <h3>Monthly Expenses</h3>
                    <p className="remaining">${totalBudget - totalSpent} remaining</p>
                </div>
            </div>

            {/* Categories */}
            <section className="section-card">
                <h2>💰 By Category</h2>
                <div className="category-list">
                    {categories.map((cat, idx) => (
                        <div key={idx} className="category-item">
                            <div className="category-info">
                                <span className="category-icon">{cat.icon}</span>
                                <span className="category-name">{cat.name}</span>
                            </div>
                            <div className="category-bar">
                                <div
                                    className="bar-fill"
                                    style={{
                                        width: `${(cat.spent / cat.budget) * 100}%`,
                                        backgroundColor: cat.color
                                    }}
                                />
                            </div>
                            <span className="category-amount">${cat.spent}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Add Expense */}
            <button className="add-expense-btn">
                <Plus size={24} />
                <span>Add New Expense</span>
            </button>
        </div>
    )
}

/* Health View */
function HealthView() {
    const medicines = [
        { name: 'Lisinopril (BP)', time: '9:00 AM', taken: true },
        { name: 'Metformin', time: '2:00 PM', taken: false },
        { name: 'Vitamin D3', time: '8:00 PM', taken: false },
    ]

    const appointments = [
        { doctor: 'Dr. Emily Chen (Cardiology)', date: 'Jan 25', time: '10:00 AM', location: 'City Medical Center' },
    ]

    return (
        <div className="health-view">
            {/* Today's Medicines */}
            <section className="section-card">
                <h2>💊 Today's Meds</h2>
                <div className="medicine-list">
                    {medicines.map((med, idx) => (
                        <div key={idx} className={`medicine-item ${med.taken ? 'taken' : ''}`}>
                            <div className="medicine-info">
                                <span className="medicine-name">{med.name}</span>
                                <span className="medicine-time">{med.time}</span>
                            </div>
                            <button className={`medicine-check ${med.taken ? 'checked' : ''}`}>
                                {med.taken ? <Check size={24} /> : <div className="check-empty"></div>}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Vitals Log */}
            <section className="section-card">
                <h2>🩺 Quick Check-in</h2>
                <div className="health-log-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>❤️ Record BP</button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>🩸 Blood Sugar</button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>⚖️ Weight</button>
                    <button className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>🌡️ Temperature</button>
                </div>
            </section>

            {/* Upcoming Appointments */}
            <section className="section-card">
                <h2>🏥 Doctor Visits</h2>
                {appointments.map((apt, idx) => (
                    <div key={idx} className="appointment-card" style={{ padding: '12px', background: '#FAF9F7', borderRadius: '12px', marginTop: '12px' }}>
                        <div className="appointment-date" style={{ display: 'flex', gap: '8px', color: '#5B7355', fontWeight: '600', marginBottom: '8px' }}>
                            <Calendar size={20} />
                            <span>{apt.date}</span>
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{apt.doctor}</h3>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#7A7267' }}><Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> {apt.time}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#7A7267' }}>📍 {apt.location}</p>
                    </div>
                ))}
            </section>
        </div>
    )
}

/* Activities View */
function ActivitiesView() {
    const categories = ['All', '🧘 Yoga', '🎨 Art', '📚 Book Club', '🚶 Walking']
    const activities = [
        { name: 'Morning Park Yoga', time: 'Daily 7:00 AM', distance: '0.5 miles', icon: '🧘' },
        { name: 'Community Book Club', time: 'Wed 4:00 PM', distance: '1.2 miles', icon: '📚' },
        { name: 'Senior Art Class', time: 'Fri 10:00 AM', distance: '2.0 miles', icon: '🎨' },
    ]

    return (
        <div className="activities-view">
            {/* Category Filters */}
            <div className="category-filters" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px' }}>
                {categories.map((cat, idx) => (
                    <button key={idx} className={`filter-btn ${idx === 0 ? 'active' : ''}`}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: idx === 0 ? 'none' : '1px solid #E8E4DD',
                            background: idx === 0 ? '#5B7355' : 'white',
                            color: idx === 0 ? 'white' : '#524C44',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer'
                        }}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Activities List */}
            <section className="section-card">
                <h2>📍 Near You</h2>
                <div className="activities-list">
                    {activities.map((activity, idx) => (
                        <div key={idx} className="activity-card">
                            <span className="activity-icon">{activity.icon}</span>
                            <div className="activity-info">
                                <h3>{activity.name}</h3>
                                <p style={{ color: '#7A7267', fontSize: '0.9rem' }}>{activity.time}</p>
                                <span className="distance-tag">{activity.distance}</span>
                            </div>
                            <button className="join-btn">View</button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Suggestion */}
            <div className="suggestion-card" style={{ background: '#EAE2D0', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                <h3 style={{ color: '#524C44', marginBottom: '8px' }}>✨ Just for You</h3>
                <p style={{ color: '#7A7267', marginBottom: '16px' }}>Since you like Yoga, you might enjoy the new meditation group starting this weekend!</p>
                <button className="btn btn-primary" style={{ width: '100%' }}>Explore Details</button>
            </div>
        </div>
    )
}

/* Family View */
function FamilyView() {
    const familyMembers = [
        { name: 'David (Son)', relation: 'Son', lastCall: 'Yesterday', avatar: '👨' },
        { name: 'Sarah (Daughter)', relation: 'Daughter', lastCall: '3 days ago', avatar: '👩' },
        { name: 'Grandkids', relation: 'Family', lastCall: '1 week ago', avatar: '👶' },
    ]

    return (
        <div className="family-view">
            {/* Quick Call */}
            <section className="section-card">
                <h2>📞 Quick Call</h2>
                <div className="family-grid">
                    {familyMembers.map((member, idx) => (
                        <button key={idx} className="family-member-card">
                            <span className="member-avatar">{member.avatar}</span>
                            <span className="member-name">{member.name}</span>
                            <span className="member-relation">{member.relation}</span>
                            <span className="last-call" style={{ fontSize: '0.75rem', color: '#A8A093' }}>Last: {member.lastCall}</span>
                            <Phone size={20} className="call-icon" style={{ marginTop: '8px', color: '#5B8A8A' }} />
                        </button>
                    ))}
                </div>
            </section>

            {/* Video Call */}
            <button className="video-call-btn" style={{ background: '#5B8A8A' }}>
                <Camera size={24} />
                <span>Start Video Call</span>
            </button>

            {/* Photo Share */}
            <section className="section-card">
                <h2>📸 Share a Moment</h2>
                <div className="photo-actions" style={{ display: 'flex', gap: '16px' }}>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '20px', flexDirection: 'column', gap: '8px' }}>
                        <Camera size={32} />
                        <span>Take Photo</span>
                    </button>
                    <button className="btn btn-outline" style={{ flex: 1, padding: '20px', flexDirection: 'column', gap: '8px' }}>
                        <span>🖼️</span>
                        <span>Gallery</span>
                    </button>
                </div>
            </section>

            {/* Voice Message */}
            <section className="section-card">
                <h2>🎤 Voice Note</h2>
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <button className="voice-message-btn" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#C17F59', border: 'none', color: 'white', cursor: 'pointer', boxShadow: '0 4px 12px rgba(193, 127, 89, 0.4)' }}>
                        <Mic size={32} />
                    </button>
                    <p className="voice-hint" style={{ marginTop: '16px', color: '#7A7267' }}>Tap to record a message for the family group</p>
                </div>
            </section>
        </div>
    )
}

export default ParentPortal
