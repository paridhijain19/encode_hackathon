import { useState, useCallback, useEffect } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import {
    Home, Wallet, Heart, Activity, Users, Mic, Phone, Camera,
    Calendar, Clock, ChevronLeft, Volume2, Plus, Check, X, Sun, Moon,
    Send, AlertCircle, Bell, MessageCircle, Share2, PhoneOff, Video
} from 'lucide-react'
import './ParentPortal.css'
import VoiceButton from '../components/VoiceButton'
import AgentChat from '../components/AgentChat'
import { ErrorBoundary, ErrorMessage } from '../components/ErrorBoundary'
import { LoadingCard } from '../components/LoadingSpinner'
import { Modal, InputModal } from '../components/Modal'
import { useAgent } from '../hooks/useAgent'
import { useAgentPolling } from '../hooks/useAgentPolling'
import { useAuth } from '../context/AuthContext'
import { SignInModal, UserBadge } from '../components/SignIn'
import { startVoiceCall, startVideoCall, endCall, isCometChatAvailable, initCometChat } from '../services/cometchat'

function ParentPortal() {
    const location = useLocation()
    const [isChatOpen, setIsChatOpen] = useState(false)
    const [toast, setToast] = useState(null)
    const [showSignIn, setShowSignIn] = useState(false)
    
    // Auth context
    const { currentUser, isSignedIn, isLoading: authLoading } = useAuth()
    
    // Agent integration - use the signed-in user's ID
    const agent = useAgent(currentUser?.id)
    const agentState = useAgentPolling(5000, currentUser?.id) // Poll every 5 seconds

    // Show sign-in modal if not signed in
    const needsSignIn = !authLoading && !isSignedIn

    // Toast helper
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }, [])

    // Enhanced chat that shows toast feedback
    const chatWithFeedback = useCallback(async (message) => {
        const result = await agent.chat(message)
        if (result?.response) {
            showToast('Done! ✨', 'success')
            // Refresh state after action
            setTimeout(() => agentState.refresh(), 500)
        }
        return result
    }, [agent, showToast, agentState])

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

    // Get user name from profile
    const userName = agentState.userProfile?.name?.split(' ')[0] || 'Mom'

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
            {/* Sign-In Modal - shows when not signed in */}
            {needsSignIn && (
                <SignInModal 
                    mode="parent" 
                    onClose={null} 
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`toast toast-${toast.type}`} style={{
                    position: 'fixed',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.type === 'success' ? '#5B7355' : toast.type === 'error' ? '#C17F59' : '#5B8A8A',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '25px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1100,
                    animation: 'slideDown 0.3s ease',
                    fontWeight: '500'
                }}>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header className="portal-header">
                <Link to="/" className="back-btn">
                    <ChevronLeft size={24} />
                </Link>
                <div className="header-content">
                    <div className="greeting-section">
                        <h1>{getGreeting()}, {currentUser?.name || userName}!</h1>
                    </div>
                    <p className="date-text">{currentDate}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <UserBadge />
                    <button className="speak-btn" onClick={() => setIsChatOpen(true)} title="Talk to Amble">
                        <Volume2 size={24} />
                    </button>
                </div>
            </header>

            {/* Error display if polling fails */}
            {agentState.error && (
                <div style={{ padding: '0 16px' }}>
                    <ErrorMessage 
                        message="Couldn't connect to Amble. Some features may be limited." 
                        onRetry={agentState.refresh}
                    />
                </div>
            )}

            {/* Main Content */}
            <main className="portal-main">
                <ErrorBoundary fallbackMessage="We're having trouble loading this page.">
                    <Routes>
                        <Route path="/" element={
                            <HomeView 
                                agentState={agentState} 
                                onQuickAction={chatWithFeedback} 
                                loading={agentState.loading} 
                                showToast={showToast}
                            />
                        } />
                        <Route path="/budget" element={
                            <BudgetView 
                                expenses={agentState.expenses} 
                                loading={agentState.loading} 
                                onAction={chatWithFeedback}
                                showToast={showToast}
                            />
                        } />
                        <Route path="/health" element={
                            <HealthView 
                                activities={agentState.activities} 
                                appointments={agentState.upcomingAppointments} 
                                onAction={chatWithFeedback}
                                showToast={showToast}
                            />
                        } />
                        <Route path="/activities" element={
                            <ActivitiesView 
                                activities={agentState.activities} 
                                onAction={chatWithFeedback}
                                showToast={showToast}
                            />
                        } />
                        <Route path="/family" element={
                            <FamilyView 
                                agentState={agentState}
                                onAction={chatWithFeedback}
                                showToast={showToast}
                            />
                        } />
                    </Routes>
                </ErrorBoundary>
            </main>

            {/* Voice FAB - Opens Chat */}
            <VoiceButton 
                onClick={() => setIsChatOpen(true)}
                isLoading={agent.loading}
            />

            {/* Agent Chat Overlay */}
            <AgentChat
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                messages={agent.messages}
                onSendMessage={agent.chat}
                isLoading={agent.loading}
                error={agent.error}
                memoryCount={agentState?.memoryCount || 0}
            />

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
function HomeView({ agentState, onQuickAction, loading }) {
    const quickActions = [
        { icon: '💊', label: 'Took Meds', color: '#5B7355', message: 'I just took my morning medications' },
        { icon: '📞', label: 'Call Son', color: '#5B8A8A', message: 'Can you help me call my son?' },
        { icon: '🚶', label: 'Walk Done', color: '#C17F59', message: 'I just finished my morning walk for 30 minutes' },
        { icon: '📝', label: 'Add Expense', color: '#9CAF88', message: 'I want to add an expense' },
    ]

    const handleQuickAction = async (action) => {
        if (onQuickAction) {
            await onQuickAction(action.message)
        }
    }

    // Calculate wellness from activities
    const todayActivities = agentState?.activities?.filter(a => 
        a.timestamp?.startsWith(new Date().toISOString().split('T')[0])
    ) || []
    const completedGoals = todayActivities.length
    const totalGoals = 5
    const wellnessPercent = Math.min(100, Math.round((completedGoals / totalGoals) * 100))

    // Generate schedule from activities and appointments
    const todaySchedule = [
        ...(agentState?.activities?.slice(-3).map(a => ({
            time: new Date(a.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            activity: a.activity_name || a.description || 'Activity',
            icon: a.activity_type === 'exercise' ? '🚶' : a.activity_type === 'medication' ? '💊' : '✨',
            done: true
        })) || []),
        ...(agentState?.upcomingAppointments?.slice(0, 2).map(a => ({
            time: new Date(a.date_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
            activity: a.title,
            icon: '🏥',
            done: false
        })) || [])
    ]

    // Fallback schedule if no data
    const displaySchedule = todaySchedule.length > 0 ? todaySchedule : [
        { time: '7:30 AM', activity: 'Morning Walk in Park', icon: '🌳', done: false },
        { time: '9:00 AM', activity: 'Blood Pressure Meds', icon: '💊', done: false },
        { time: '4:00 PM', activity: 'Virtual Yoga Class', icon: '🧘', done: false },
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
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: '#524C44' }}>
                            {completedGoals > 0 ? "You're doing great today!" : "Let's start your day!"}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#7A7267' }}>
                            {completedGoals} of {totalGoals} goals completed
                        </p>
                    </div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${wellnessPercent >= 60 ? '#9CAF88' : '#E8E4DD'}`, color: '#3D4F38', fontWeight: 'bold' }}>
                        {wellnessPercent}%
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
                        onClick={() => handleQuickAction(action)}
                        disabled={loading}
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
                    {displaySchedule.map((item, idx) => (
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
function BudgetView({ expenses, loading, onAction, showToast }) {
    const [showAddModal, setShowAddModal] = useState(false)
    const [newExpense, setNewExpense] = useState({ amount: '', category: 'groceries', description: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Group expenses by category
    const categoryBudgets = {
        groceries: { budget: 600, icon: '🥦', color: '#5B7355', name: 'Groceries' },
        vegetables: { budget: 600, icon: '🥦', color: '#5B7355', name: 'Groceries' },
        pharmacy: { budget: 200, icon: '💊', color: '#C17F59', name: 'Pharmacy' },
        medicine: { budget: 200, icon: '💊', color: '#C17F59', name: 'Pharmacy' },
        utilities: { budget: 250, icon: '💡', color: '#5B8A8A', name: 'Utilities' },
        leisure: { budget: 150, icon: '🎨', color: '#9CAF88', name: 'Leisure' },
        other: { budget: 200, icon: '📦', color: '#7A7267', name: 'Other' },
    }

    // Calculate spending by category from actual expenses
    const spendingByCategory = {}
    expenses.forEach(e => {
        const cat = (e.category || 'other').toLowerCase()
        const mappedCat = categoryBudgets[cat]?.name || 'Other'
        spendingByCategory[mappedCat] = (spendingByCategory[mappedCat] || 0) + (e.amount || 0)
    })

    // Build categories array
    const uniqueCategories = ['Groceries', 'Pharmacy', 'Utilities', 'Leisure', 'Other']
    const categories = uniqueCategories.map(name => {
        const config = Object.values(categoryBudgets).find(c => c.name === name) || categoryBudgets.other
        return {
            name,
            spent: spendingByCategory[name] || 0,
            budget: config.budget,
            icon: config.icon,
            color: config.color
        }
    }).filter(c => c.spent > 0 || c.name === 'Groceries') // Show groceries always, others only if spent

    const totalSpent = Object.values(spendingByCategory).reduce((sum, v) => sum + v, 0)
    const totalBudget = categories.reduce((sum, c) => sum + c.budget, 0) || 1200

    const handleAddExpense = async () => {
        if (!newExpense.amount || isNaN(parseFloat(newExpense.amount))) {
            showToast('Please enter a valid amount', 'error')
            return
        }
        setIsSubmitting(true)
        try {
            const message = `I spent ${newExpense.amount} rupees on ${newExpense.category}${newExpense.description ? ` for ${newExpense.description}` : ''}`
            await onAction(message)
            setShowAddModal(false)
            setNewExpense({ amount: '', category: 'groceries', description: '' })
        } catch (err) {
            showToast('Failed to add expense', 'error')
        }
        setIsSubmitting(false)
    }

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
                            strokeDasharray={`${Math.min(100, (totalSpent / totalBudget) * 100) * 2.83} 283`}
                            strokeLinecap="round"
                            transform="rotate(-90 50 50)"
                        />
                    </svg>
                    <div className="budget-center">
                        <span className="spent">₹{totalSpent.toFixed(0)}</span>
                        <span className="of">of</span>
                        <span className="total">₹{totalBudget}</span>
                    </div>
                </div>
                <div className="budget-info">
                    <h3>Monthly Expenses</h3>
                    <p className="remaining">₹{Math.max(0, totalBudget - totalSpent).toFixed(0)} remaining</p>
                </div>
            </div>

            {/* Categories */}
            <section className="section-card">
                <h2>💰 By Category</h2>
                {loading && <p style={{ color: '#7A7267', fontSize: '0.9rem' }}>Loading...</p>}
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
                                        width: `${Math.min(100, (cat.spent / cat.budget) * 100)}%`,
                                        backgroundColor: cat.color
                                    }}
                                />
                            </div>
                            <span className="category-amount">₹{cat.spent.toFixed(0)}</span>
                        </div>
                    ))}
                    {categories.length === 0 && !loading && (
                        <p style={{ color: '#7A7267', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                            No expenses yet. Say "I spent 500 rupees on groceries" to start tracking!
                        </p>
                    )}
                </div>
            </section>

            {/* Recent Transactions */}
            {expenses.length > 0 && (
                <section className="section-card">
                    <h2>📋 Recent</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {expenses.slice(-5).reverse().map((e, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #E8E4DD' }}>
                                <span style={{ color: '#524C44' }}>{e.description || e.category}</span>
                                <span style={{ fontWeight: '600', color: '#C17F59' }}>₹{e.amount}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Add Expense */}
            <button className="add-expense-btn" onClick={() => setShowAddModal(true)}>
                <Plus size={24} />
                <span>Add New Expense</span>
            </button>

            {/* Add Expense Modal */}
            <Modal isOpen={showAddModal} title="Add Expense" onClose={() => setShowAddModal(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#524C44', fontWeight: '500' }}>Amount (₹)</label>
                            <input
                                type="number"
                                placeholder="e.g., 500"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: '2px solid #E8E4DD',
                                    borderRadius: '12px',
                                    fontSize: '1.1rem',
                                    outline: 'none'
                                }}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#524C44', fontWeight: '500' }}>Category</label>
                            <select
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: '2px solid #E8E4DD',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    background: 'white',
                                    outline: 'none'
                                }}
                            >
                                <option value="groceries">🥦 Groceries</option>
                                <option value="pharmacy">💊 Pharmacy / Medicine</option>
                                <option value="utilities">💡 Utilities</option>
                                <option value="leisure">🎨 Leisure</option>
                                <option value="other">📦 Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#524C44', fontWeight: '500' }}>Description (optional)</label>
                            <input
                                type="text"
                                placeholder="e.g., vegetables from market"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: '2px solid #E8E4DD',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    outline: 'none'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleAddExpense}
                            disabled={isSubmitting}
                            style={{
                                padding: '16px',
                                background: isSubmitting ? '#A8A093' : '#5B7355',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: isSubmitting ? 'wait' : 'pointer',
                                marginTop: '8px'
                            }}
                        >
                            {isSubmitting ? 'Adding...' : '✓ Add Expense'}
                        </button>
                    </div>
                </Modal>
        </div>
    )
}

/* Health View */
function HealthView({ activities, appointments, onAction, showToast }) {
    const [recordingVital, setRecordingVital] = useState(null)
    const [vitalValue, setVitalValue] = useState('')

    // Extract medication activities from today
    const today = new Date().toISOString().split('T')[0]
    const medActivities = activities.filter(a => 
        a.activity_type === 'medication' && a.timestamp?.startsWith(today)
    )
    
    // Default medicines list (would come from user profile in production)
    const medicines = [
        { name: 'Lisinopril (BP)', time: '9:00 AM', taken: medActivities.some(a => a.activity_name?.toLowerCase().includes('lisinopril')) },
        { name: 'Metformin', time: '2:00 PM', taken: medActivities.some(a => a.activity_name?.toLowerCase().includes('metformin')) },
        { name: 'Vitamin D3', time: '8:00 PM', taken: medActivities.some(a => a.activity_name?.toLowerCase().includes('vitamin')) },
    ]

    const handleMedTaken = async (med) => {
        if (onAction && !med.taken) {
            await onAction(`I just took my ${med.name} medication`)
            showToast(`${med.name} marked as taken ✓`, 'success')
        }
    }

    const vitals = [
        { key: 'bp', icon: '❤️', label: 'Blood Pressure', placeholder: '120/80', message: (v) => `My blood pressure is ${v}` },
        { key: 'sugar', icon: '🩸', label: 'Blood Sugar', placeholder: '100', message: (v) => `My blood sugar is ${v}` },
        { key: 'weight', icon: '⚖️', label: 'Weight', placeholder: '65 kg', message: (v) => `My weight is ${v} kg` },
        { key: 'temp', icon: '🌡️', label: 'Temperature', placeholder: '98.6', message: (v) => `My temperature is ${v}` },
    ]

    const handleVitalSubmit = async (vital) => {
        if (!vitalValue.trim()) {
            showToast('Please enter a value', 'error')
            return
        }
        await onAction(vital.message(vitalValue))
        showToast(`${vital.label} recorded: ${vitalValue}`, 'success')
        setRecordingVital(null)
        setVitalValue('')
    }

    // Format appointments
    const displayAppointments = appointments.length > 0 ? appointments : [
        { title: 'Dr. Emily Chen (Cardiology)', date_time: '2026-02-15T10:00:00', location: 'City Medical Center' },
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
                            <button 
                                className={`medicine-check ${med.taken ? 'checked' : ''}`}
                                onClick={() => handleMedTaken(med)}
                                style={{ transition: 'all 0.2s' }}
                            >
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
                    {vitals.map((vital) => (
                        <button 
                            key={vital.key}
                            className="btn btn-outline" 
                            style={{ justifyContent: 'flex-start' }} 
                            onClick={() => setRecordingVital(vital)}
                        >
                            {vital.icon} {vital.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Vital Input Modal */}
            <Modal isOpen={!!recordingVital} title={recordingVital ? `Record ${recordingVital.label}` : ''} onClose={() => { setRecordingVital(null); setVitalValue('') }}>
                {recordingVital && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'center', fontSize: '3rem' }}>{recordingVital.icon}</div>
                        <input
                            type="text"
                            placeholder={recordingVital.placeholder}
                            value={vitalValue}
                            onChange={(e) => setVitalValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                border: '2px solid #E8E4DD',
                                borderRadius: '12px',
                                fontSize: '1.2rem',
                                textAlign: 'center',
                                outline: 'none'
                            }}
                            autoFocus
                        />
                        <button
                            onClick={() => handleVitalSubmit(recordingVital)}
                            style={{
                                padding: '16px',
                                background: '#5B7355',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            ✓ Record
                        </button>
                    </div>
                )}
            </Modal>

            {/* Upcoming Appointments */}
            <section className="section-card">
                <h2>🏥 Doctor Visits</h2>
                {displayAppointments.map((apt, idx) => {
                    const aptDate = new Date(apt.date_time)
                    return (
                        <div key={idx} className="appointment-card" style={{ padding: '12px', background: '#FAF9F7', borderRadius: '12px', marginTop: '12px' }}>
                            <div className="appointment-date" style={{ display: 'flex', gap: '8px', color: '#5B7355', fontWeight: '600', marginBottom: '8px' }}>
                                <Calendar size={20} />
                                <span>{aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem' }}>{apt.title}</h3>
                            <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#7A7267' }}>
                                <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} /> 
                                {aptDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#7A7267' }}>📍 {apt.location || 'Location TBD'}</p>
                        </div>
                    )
                })}
            </section>

            {/* Emergency Contact */}
            <section className="section-card" style={{ background: '#FFF5F5', border: '1px solid #FFD4D4' }}>
                <h2 style={{ color: '#C17F59' }}>🚨 Emergency</h2>
                <p style={{ color: '#7A7267', marginBottom: '12px' }}>If you need immediate help:</p>
                <button
                    onClick={() => showToast('Calling emergency contact...', 'info')}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: '#C17F59',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }}
                >
                    <Phone size={20} /> Call Family
                </button>
            </section>
        </div>
    )
}

/* Activities View */
function ActivitiesView({ activities, onAction, showToast }) {
    const [activeCategory, setActiveCategory] = useState('All')
    const [showLogModal, setShowLogModal] = useState(false)
    const [newActivity, setNewActivity] = useState({ type: 'walking', duration: '30' })

    const categories = ['All', '🧘 Yoga', '🎨 Art', '📚 Reading', '🚶 Walking']
    
    // Map activities to display format
    const getActivityIcon = (type) => {
        const icons = {
            'exercise': '🚶',
            'walking': '🚶',
            'yoga': '🧘',
            'meditation': '🧘',
            'social': '👥',
            'reading': '📚',
            'art': '🎨',
            'medication': '💊',
        }
        return icons[type?.toLowerCase()] || '✨'
    }

    // Filter activities by category
    const filteredActivities = activities.filter(a => {
        if (activeCategory === 'All') return true
        const typeMatch = activeCategory.toLowerCase().includes(a.activity_type?.toLowerCase())
        return typeMatch
    })

    // Recent activities from backend
    const recentActivities = filteredActivities.slice(-8).reverse().map(a => ({
        name: a.activity_name || a.description || 'Activity',
        time: new Date(a.timestamp).toLocaleString([], { 
            weekday: 'short', 
            hour: 'numeric', 
            minute: '2-digit' 
        }),
        duration: a.duration_minutes ? `${a.duration_minutes} min` : '',
        icon: getActivityIcon(a.activity_type),
        type: a.activity_type
    }))

    // Suggested activities (static for now)
    const suggestedActivities = [
        { name: 'Morning Park Yoga', time: 'Daily 7:00 AM', distance: '0.5 miles', icon: '🧘' },
        { name: 'Community Book Club', time: 'Wed 4:00 PM', distance: '1.2 miles', icon: '📚' },
        { name: 'Senior Art Class', time: 'Fri 10:00 AM', distance: '2.0 miles', icon: '🎨' },
    ]

    const handleLogActivity = async () => {
        const message = `I just did ${newActivity.type} for ${newActivity.duration} minutes`
        await onAction(message)
        showToast(`${newActivity.type} logged! Great job! 🎉`, 'success')
        setShowLogModal(false)
        setNewActivity({ type: 'walking', duration: '30' })
    }

    return (
        <div className="activities-view">
            {/* Category Filters */}
            <div className="category-filters" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '16px' }}>
                {categories.map((cat, idx) => (
                    <button 
                        key={idx} 
                        className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            border: activeCategory === cat ? 'none' : '1px solid #E8E4DD',
                            background: activeCategory === cat ? '#5B7355' : 'white',
                            color: activeCategory === cat ? 'white' : '#524C44',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}>
                        {cat}
                    </button>
                ))}
            </div>

            {/* Quick Log Button */}
            <button 
                onClick={() => setShowLogModal(true)}
                style={{
                    width: '100%',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #9CAF88 0%, #5B7355 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '16px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 12px rgba(91, 115, 85, 0.3)'
                }}
            >
                <Plus size={24} /> Log Activity
            </button>

            {/* Recent Activities from tracking */}
            <section className="section-card">
                <h2>✅ Your Activities</h2>
                {recentActivities.length > 0 ? (
                    <div className="activities-list">
                        {recentActivities.map((activity, idx) => (
                            <div key={idx} className="activity-card">
                                <span className="activity-icon">{activity.icon}</span>
                                <div className="activity-info">
                                    <h3>{activity.name}</h3>
                                    <p style={{ color: '#7A7267', fontSize: '0.9rem' }}>{activity.time}</p>
                                    {activity.duration && <span className="distance-tag">{activity.duration}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px 0', color: '#7A7267' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🏃‍♀️</p>
                        <p>No activities yet today.</p>
                        <p style={{ fontSize: '0.9rem' }}>Say "I did yoga for 30 minutes" or tap Log Activity above!</p>
                    </div>
                )}
            </section>

            {/* Suggested Activities */}
            <section className="section-card">
                <h2>📍 Near You</h2>
                <div className="activities-list">
                    {suggestedActivities.map((activity, idx) => (
                        <div key={idx} className="activity-card">
                            <span className="activity-icon">{activity.icon}</span>
                            <div className="activity-info">
                                <h3>{activity.name}</h3>
                                <p style={{ color: '#7A7267', fontSize: '0.9rem' }}>{activity.time}</p>
                                <span className="distance-tag">{activity.distance}</span>
                            </div>
                            <button 
                                className="join-btn"
                                onClick={() => showToast(`Added ${activity.name} to your list!`, 'success')}
                            >
                                Join
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Suggestion */}
            <div className="suggestion-card" style={{ background: '#EAE2D0', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                <h3 style={{ color: '#524C44', marginBottom: '8px' }}>✨ Just for You</h3>
                <p style={{ color: '#7A7267', marginBottom: '16px' }}>Since you like Yoga, you might enjoy the new meditation group starting this weekend!</p>
                <button 
                    className="btn btn-primary" 
                    style={{ width: '100%' }}
                    onClick={() => showToast('Details sent to your chat!', 'info')}
                >
                    Explore Details
                </button>
            </div>

            {/* Log Activity Modal */}
            <Modal isOpen={showLogModal} title="Log Activity" onClose={() => setShowLogModal(false)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#524C44', fontWeight: '500' }}>Activity Type</label>
                            <select
                                value={newActivity.type}
                                onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: '2px solid #E8E4DD',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    background: 'white'
                                }}
                            >
                                <option value="walking">🚶 Walking</option>
                                <option value="yoga">🧘 Yoga</option>
                                <option value="reading">📚 Reading</option>
                                <option value="art">🎨 Art / Crafts</option>
                                <option value="social">👥 Social Activity</option>
                                <option value="exercise">💪 Exercise</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#524C44', fontWeight: '500' }}>Duration (minutes)</label>
                            <input
                                type="number"
                                value={newActivity.duration}
                                onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    border: '2px solid #E8E4DD',
                                    borderRadius: '12px',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>
                        <button
                            onClick={handleLogActivity}
                            style={{
                                padding: '16px',
                                background: '#5B7355',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                marginTop: '8px'
                            }}
                        >
                            ✓ Log Activity
                        </button>
                    </div>
                </Modal>
        </div>
    )
}

/* Family View - Chat with Family Members */
function FamilyView({ agentState, onAction, showToast }) {
    const [familyContacts, setFamilyContacts] = useState([])
    const [selectedContact, setSelectedContact] = useState(null)
    const [messages, setMessages] = useState([])
    const [messageText, setMessageText] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)
    const [isInCall, setIsInCall] = useState(false)
    const [callType, setCallType] = useState(null) // 'voice' or 'video'
    
    const { currentUser } = useAuth()
    const elderUserId = currentUser?.id || 'parent_user'

    // Load family contacts
    useEffect(() => {
        const loadContacts = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                const response = await fetch(`${apiBase}/api/family/${elderUserId}/contacts`)
                if (response.ok) {
                    const data = await response.json()
                    setFamilyContacts(data.contacts || [])
                    // Auto-select first contact if available
                    if (data.contacts?.length > 0 && !selectedContact) {
                        setSelectedContact(data.contacts[0])
                    }
                }
            } catch (error) {
                console.error('Failed to load contacts:', error)
                // Use default contacts
                setFamilyContacts([
                    { id: 'family_sarah', name: 'Sarah', avatar: '👩', relation: 'Daughter' },
                    { id: 'family_david', name: 'David', avatar: '👨', relation: 'Son' },
                ])
            }
            setIsLoading(false)
        }
        loadContacts()
    }, [elderUserId])

    // Load messages when contact is selected
    useEffect(() => {
        if (!selectedContact) return
        
        const loadMessages = async () => {
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
                const response = await fetch(
                    `${apiBase}/api/family/${elderUserId}/messages?family_member_id=${selectedContact.id}`
                )
                if (response.ok) {
                    const data = await response.json()
                    setMessages(data.messages || [])
                    
                    // Mark messages as read
                    fetch(`${apiBase}/api/family/${elderUserId}/messages/${selectedContact.id}/read?reader_id=${elderUserId}`, {
                        method: 'POST'
                    }).catch(() => {})
                }
            } catch (error) {
                console.error('Failed to load messages:', error)
            }
        }
        loadMessages()
        
        // Poll for new messages every 5 seconds
        const interval = setInterval(loadMessages, 5000)
        return () => clearInterval(interval)
    }, [selectedContact, elderUserId])

    const handleSendMessage = async () => {
        if (!messageText.trim() || !selectedContact) return
        
        setIsSending(true)
        const newMessage = {
            id: Date.now(),
            sender_id: elderUserId,
            message: messageText,
            message_type: 'text',
            created_at: new Date().toISOString(),
            read: false
        }
        
        // Optimistically add message
        setMessages(prev => [...prev, newMessage])
        setMessageText('')
        
        try {
            const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
            await fetch(`${apiBase}/api/family/${elderUserId}/messages/${selectedContact.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: elderUserId,
                    message: messageText,
                    message_type: 'text'
                })
            })
            showToast(`Message sent to ${selectedContact.name}! 💌`, 'success')
        } catch (error) {
            console.error('Failed to send message:', error)
            showToast('Message sent (offline mode)', 'info')
        }
        setIsSending(false)
    }

    const handleVideoCall = async () => {
        if (!selectedContact) return
        
        showToast(`Starting video call with ${selectedContact.name}...`, 'info')
        setCallType('video')
        setIsInCall(true)
        
        // Try CometChat first
        const result = await startVideoCall(selectedContact.id)
        if (result.success) {
            showToast(`Connected to ${selectedContact.name}! 📹`, 'success')
        } else if (result.fallback) {
            // CometChat not available - show simulated call UI
            showToast(`Video call with ${selectedContact.name} (Demo Mode)`, 'info')
        } else {
            showToast('Could not connect call. Please try again.', 'error')
            setIsInCall(false)
        }
    }

    const handleVoiceCall = async () => {
        if (!selectedContact) return
        
        showToast(`Calling ${selectedContact.name}...`, 'info')
        setCallType('voice')
        setIsInCall(true)
        
        // Try CometChat first
        const result = await startVoiceCall(selectedContact.id)
        if (result.success) {
            showToast(`Connected to ${selectedContact.name}! 📞`, 'success')
        } else if (result.fallback) {
            // CometChat not available - show simulated call UI
            showToast(`Voice call with ${selectedContact.name} (Demo Mode)`, 'info')
        } else {
            showToast('Could not connect call. Please try again.', 'error')
            setIsInCall(false)
        }
    }

    const handleEndCall = async () => {
        setIsInCall(false)
        setCallType(null)
        showToast('Call ended', 'info')
        // Try to end CometChat call if active
        try {
            await endCall()
        } catch (e) {
            // Ignore errors
        }
    }

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        
        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    }

    if (isLoading) {
        return (
            <div className="family-view" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading family contacts...</p>
            </div>
        )
    }

    // Call overlay UI
    if (isInCall) {
        return (
            <div className="family-view" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: 'calc(100vh - 200px)',
                background: callType === 'video' ? '#1a1a2e' : 'linear-gradient(135deg, #5B8A8A 0%, #3d5c5c 100%)',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '24px',
                padding: '24px'
            }}>
                {/* Video placeholder or avatar */}
                <div style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: callType === 'video' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    animation: 'pulse 2s infinite'
                }}>
                    {selectedContact?.avatar || '👤'}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.5rem' }}>
                        {selectedContact?.name}
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>
                        {callType === 'video' ? '📹 Video Call' : '📞 Voice Call'} in progress...
                    </p>
                </div>

                {/* Call controls */}
                <div style={{ display: 'flex', gap: '20px', marginTop: '32px' }}>
                    <button
                        onClick={handleEndCall}
                        style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            background: '#e74c3c',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)'
                        }}
                    >
                        <PhoneOff size={28} />
                    </button>
                </div>
                
                <p style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '0.85rem',
                    marginTop: '24px'
                }}>
                    Tap the red button to end the call
                </p>
            </div>
        )
    }

    return (
        <div className="family-view" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 200px)', 
            maxHeight: 'calc(100vh - 200px)',
            gap: '0' 
        }}>
            {/* Contact Selector - scrollable horizontally on mobile */}
            <div style={{ 
                display: 'flex', 
                gap: '8px', 
                padding: '10px 12px',
                overflowX: 'auto',
                borderBottom: '1px solid #E8E4DD',
                background: '#FAF9F7',
                flexShrink: 0,
                WebkitOverflowScrolling: 'touch'
            }}>
                {familyContacts.map((contact) => (
                    <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: '10px 14px',
                            borderRadius: '14px',
                            border: selectedContact?.id === contact.id ? '2px solid #5B8A8A' : '2px solid transparent',
                            background: selectedContact?.id === contact.id ? '#E8F4F4' : 'white',
                            cursor: 'pointer',
                            minWidth: '70px',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ fontSize: '1.75rem', marginBottom: '2px' }}>{contact.avatar}</span>
                        <span style={{ fontWeight: '600', color: '#524C44', fontSize: '0.8rem' }}>{contact.name}</span>
                        <span style={{ fontSize: '0.65rem', color: '#7A7267' }}>{contact.relation}</span>
                    </button>
                ))}
            </div>

            {selectedContact ? (
                <>
                    {/* Chat Header with Call Buttons - Mobile optimized */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'white',
                        borderBottom: '1px solid #E8E4DD',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '2rem' }}>{selectedContact.avatar}</span>
                            <div>
                                <h3 style={{ margin: 0, color: '#524C44', fontSize: '1rem' }}>{selectedContact.name}</h3>
                                <span style={{ fontSize: '0.75rem', color: '#7A7267' }}>{selectedContact.relation}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={handleVoiceCall}
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: '#5B8A8A',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Phone size={18} />
                            </button>
                            <button 
                                onClick={handleVideoCall}
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '50%',
                                    background: '#5B7355',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Video size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Container - Scrollable, mobile optimized */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: '#F5F3EF',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {messages.length === 0 ? (
                            <div style={{ 
                                textAlign: 'center', 
                                padding: '30px 16px',
                                color: '#7A7267'
                            }}>
                                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>💬</span>
                                <p style={{ margin: 0, fontSize: '0.95rem' }}>No messages yet with {selectedContact.name}</p>
                                <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>Send a message to start the conversation!</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => {
                                    const isFromMe = msg.sender_id === elderUserId
                                    const showDate = idx === 0 || 
                                        new Date(msg.created_at).toDateString() !== new Date(messages[idx-1].created_at).toDateString()
                                    
                                    return (
                                        <div key={msg.id || idx}>
                                            {showDate && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '6px',
                                                    margin: '6px 0'
                                                }}>
                                                    <span style={{
                                                        background: '#E8E4DD',
                                                        padding: '3px 10px',
                                                        borderRadius: '10px',
                                                        fontSize: '0.7rem',
                                                        color: '#7A7267'
                                                    }}>
                                                        {new Date(msg.created_at).toLocaleDateString('en-US', { 
                                                            weekday: 'short', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: isFromMe ? 'flex-end' : 'flex-start',
                                                marginBottom: '3px'
                                            }}>
                                                <div style={{
                                                    maxWidth: '85%',
                                                    padding: '10px 14px',
                                                    borderRadius: isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                    background: isFromMe ? '#5B8A8A' : 'white',
                                                    color: isFromMe ? 'white' : '#524C44',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                                    fontSize: '0.95rem'
                                                }}>
                                                    <p style={{ margin: 0, lineHeight: 1.35 }}>{msg.message}</p>
                                                    <span style={{
                                                        display: 'block',
                                                        fontSize: '0.65rem',
                                                        marginTop: '3px',
                                                        opacity: 0.7,
                                                        textAlign: 'right'
                                                    }}>
                                                        {formatMessageTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>

                    {/* Message Input - Mobile optimized */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '10px 12px',
                        background: 'white',
                        borderTop: '1px solid #E8E4DD',
                        flexShrink: 0
                    }}>
                        <input
                            type="text"
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={`Message ${selectedContact.name}...`}
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                border: '2px solid #E8E4DD',
                                borderRadius: '24px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                minWidth: 0
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#5B8A8A'}
                            onBlur={(e) => e.target.style.borderColor = '#E8E4DD'}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!messageText.trim() || isSending}
                            style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '50%',
                                background: messageText.trim() ? '#5B7355' : '#E8E4DD',
                                border: 'none',
                                color: messageText.trim() ? 'white' : '#7A7267',
                                cursor: messageText.trim() ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </div>

                    {/* Quick Actions - Mobile scrollable */}
                    <div style={{
                        display: 'flex',
                        gap: '6px',
                        padding: '8px 12px',
                        background: 'white',
                        flexShrink: 0,
                        overflowX: 'auto',
                        WebkitOverflowScrolling: 'touch'
                    }}>
                        {['❤️ Love you!', '📞 Call me', '☀️ Good morning', '💭 Miss you'].map((quick) => (
                            <button
                                key={quick}
                                onClick={() => setMessageText(quick)}
                                style={{
                                    padding: '6px 12px',
                                    background: '#FAF9F7',
                                    border: '1px solid #E8E4DD',
                                    borderRadius: '18px',
                                    fontSize: '0.8rem',
                                    color: '#524C44',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}
                            >
                                {quick}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '12px',
                    color: '#7A7267',
                    padding: '20px'
                }}>
                    <Users size={40} />
                    <p style={{ margin: 0, fontSize: '0.95rem', textAlign: 'center' }}>Select a family member to start chatting</p>
                </div>
            )}

            {/* Emergency Alert - Fixed at bottom, mobile optimized */}
            <div style={{
                padding: '10px 12px',
                background: '#FFF5F5',
                borderTop: '1px solid #FFD4D4',
                flexShrink: 0
            }}>
                <button
                    onClick={async () => {
                        showToast('Alert sent to all family members!', 'info')
                        await onAction('Send an alert to all my family members that I need help')
                    }}
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: '#C17F59',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }}
                >
                    <Bell size={18} /> Emergency Alert to All Family
                </button>
            </div>
        </div>
    )
}

export default ParentPortal
