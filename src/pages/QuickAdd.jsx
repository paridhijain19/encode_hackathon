/**
 * Quick Add Page - Direct manual entries without agent
 * 
 * Allows users to manually add expenses, health records, and appointments
 * directly to the database without going through the agent.
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, Heart, Calendar, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { addExpense, addHealthRecord, addAppointment } from '../services/api'
import './QuickAdd.css'

// Tab options
const TABS = [
    { id: 'expense', label: 'Expense', icon: Wallet, color: '#5B7355' },
    { id: 'health', label: 'Health', icon: Heart, color: '#C17F59' },
    { id: 'appointment', label: 'Appointment', icon: Calendar, color: '#5B8A8A' },
]

// Category options for expenses
const EXPENSE_CATEGORIES = [
    { value: 'groceries', label: '🥦 Groceries' },
    { value: 'pharmacy', label: '💊 Pharmacy' },
    { value: 'utilities', label: '💡 Utilities' },
    { value: 'transport', label: '🚗 Transport' },
    { value: 'leisure', label: '🎨 Leisure' },
    { value: 'other', label: '📦 Other' },
]

// Health record types
const HEALTH_TYPES = [
    { value: 'blood_pressure', label: '❤️ Blood Pressure', placeholder: 'e.g., 120/80' },
    { value: 'blood_sugar', label: '🩸 Blood Sugar', placeholder: 'e.g., 100 mg/dL' },
    { value: 'weight', label: '⚖️ Weight', placeholder: 'e.g., 65 kg' },
    { value: 'temperature', label: '🌡️ Temperature', placeholder: 'e.g., 98.6°F' },
    { value: 'medication', label: '💊 Medication Taken', placeholder: 'e.g., Metformin' },
    { value: 'exercise', label: '🚶 Exercise', placeholder: 'e.g., 30 min walk' },
]

export default function QuickAdd() {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [activeTab, setActiveTab] = useState('expense')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)

    // Form states
    const [expense, setExpense] = useState({ amount: '', category: 'groceries', description: '' })
    const [health, setHealth] = useState({ type: 'blood_pressure', value: '', notes: '' })
    const [appointment, setAppointment] = useState({ title: '', date: '', time: '', location: '' })

    const userId = currentUser?.id || 'parent_user'

    // Handle expense submission
    const handleExpenseSubmit = async (e) => {
        e.preventDefault()
        if (!expense.amount) {
            setError('Please enter an amount')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await addExpense(userId, {
                amount: parseFloat(expense.amount),
                category: expense.category,
                description: expense.description || expense.category,
            })
            setSuccess(true)
            setExpense({ amount: '', category: 'groceries', description: '' })
            setTimeout(() => setSuccess(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to add expense')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle health record submission
    const handleHealthSubmit = async (e) => {
        e.preventDefault()
        if (!health.value) {
            setError('Please enter a value')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await addHealthRecord(userId, {
                type: health.type,
                value: health.value,
                notes: health.notes,
            })
            setSuccess(true)
            setHealth({ type: 'blood_pressure', value: '', notes: '' })
            setTimeout(() => setSuccess(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to add health record')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle appointment submission
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault()
        if (!appointment.title || !appointment.date) {
            setError('Please enter title and date')
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await addAppointment(userId, {
                title: appointment.title,
                date: appointment.date,
                time: appointment.time || '09:00',
                location: appointment.location,
            })
            setSuccess(true)
            setAppointment({ title: '', date: '', time: '', location: '' })
            setTimeout(() => setSuccess(false), 2000)
        } catch (err) {
            setError(err.message || 'Failed to add appointment')
        } finally {
            setIsSubmitting(false)
        }
    }

    const selectedHealthType = HEALTH_TYPES.find(t => t.value === health.type)

    return (
        <div className="quick-add-page">
            {/* Header */}
            <header className="quick-add-header">
                <Link to="/app" className="back-btn">
                    <ArrowLeft size={24} />
                </Link>
                <h1>Quick Add</h1>
            </header>

            {/* Success Toast */}
            {success && (
                <div className="success-toast">
                    <Check size={20} />
                    <span>Added successfully!</span>
                </div>
            )}

            {/* Error Toast */}
            {error && (
                <div className="error-toast">
                    <span>{error}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs-container">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ '--tab-color': tab.color }}
                    >
                        <tab.icon size={20} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Forms */}
            <div className="form-container">
                {/* Expense Form */}
                {activeTab === 'expense' && (
                    <form onSubmit={handleExpenseSubmit} className="add-form">
                        <div className="form-group">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                value={expense.amount}
                                onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
                                placeholder="e.g., 500"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <div className="category-grid">
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        className={`category-btn ${expense.category === cat.value ? 'selected' : ''}`}
                                        onClick={() => setExpense({ ...expense, category: cat.value })}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description (optional)</label>
                            <input
                                type="text"
                                value={expense.description}
                                onChange={(e) => setExpense({ ...expense, description: e.target.value })}
                                placeholder="e.g., vegetables from market"
                            />
                        </div>

                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Expense'}
                        </button>
                    </form>
                )}

                {/* Health Form */}
                {activeTab === 'health' && (
                    <form onSubmit={handleHealthSubmit} className="add-form">
                        <div className="form-group">
                            <label>Record Type</label>
                            <div className="category-grid">
                                {HEALTH_TYPES.map(type => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        className={`category-btn ${health.type === type.value ? 'selected' : ''}`}
                                        onClick={() => setHealth({ ...health, type: type.value })}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Value</label>
                            <input
                                type="text"
                                value={health.value}
                                onChange={(e) => setHealth({ ...health, value: e.target.value })}
                                placeholder={selectedHealthType?.placeholder || 'Enter value'}
                            />
                        </div>

                        <div className="form-group">
                            <label>Notes (optional)</label>
                            <input
                                type="text"
                                value={health.notes}
                                onChange={(e) => setHealth({ ...health, notes: e.target.value })}
                                placeholder="Any additional notes"
                            />
                        </div>

                        <button type="submit" className="submit-btn health" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Health Record'}
                        </button>
                    </form>
                )}

                {/* Appointment Form */}
                {activeTab === 'appointment' && (
                    <form onSubmit={handleAppointmentSubmit} className="add-form">
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                value={appointment.title}
                                onChange={(e) => setAppointment({ ...appointment, title: e.target.value })}
                                placeholder="e.g., Doctor checkup"
                                autoFocus
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={appointment.date}
                                    onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Time</label>
                                <input
                                    type="time"
                                    value={appointment.time}
                                    onChange={(e) => setAppointment({ ...appointment, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Location (optional)</label>
                            <input
                                type="text"
                                value={appointment.location}
                                onChange={(e) => setAppointment({ ...appointment, location: e.target.value })}
                                placeholder="e.g., City Hospital"
                            />
                        </div>

                        <button type="submit" className="submit-btn appointment" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Appointment'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
