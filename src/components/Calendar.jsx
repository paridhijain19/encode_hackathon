/**
 * Calendar Component for Amble
 * 
 * Visual calendar for viewing appointments, medications, and activities.
 * Designed for elderly users with large touch targets and clear visual hierarchy.
 */

import { useState, useEffect, useMemo } from 'react'
import {
    ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Clock, MapPin, Plus, X, Check, AlertCircle
} from 'lucide-react'
import './Calendar.css'

// ============================================================
// Main Calendar Component
// ============================================================

export default function Calendar({ 
    appointments = [], 
    activities = [], 
    medications = [],
    onAddAppointment,
    onEditAppointment,
    onDeleteAppointment
}) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [view, setView] = useState('month') // 'month', 'week', 'day'
    const [showAddModal, setShowAddModal] = useState(false)

    // Get calendar grid for current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        const days = []
        
        // Add days from previous month
        const startDay = firstDay.getDay()
        for (let i = startDay - 1; i >= 0; i--) {
            const date = new Date(year, month, -i)
            days.push({ date, isCurrentMonth: false })
        }
        
        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i)
            days.push({ date, isCurrentMonth: true })
        }
        
        // Add days from next month
        const endDay = lastDay.getDay()
        for (let i = 1; i < 7 - endDay; i++) {
            const date = new Date(year, month + 1, i)
            days.push({ date, isCurrentMonth: false })
        }
        
        return days
    }, [currentDate])

    // Get events for a specific date
    const getEventsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0]
        
        const dayAppointments = appointments.filter(apt => {
            const aptDate = new Date(apt.date_time || apt.date).toISOString().split('T')[0]
            return aptDate === dateStr
        })
        
        const dayActivities = activities.filter(act => {
            const actDate = new Date(act.timestamp || act.date).toISOString().split('T')[0]
            return actDate === dateStr
        })
        
        // Filter medications by day of week
        const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]
        const dayMedications = medications.filter(med => 
            med.days?.includes(dayOfWeek)
        )
        
        return {
            appointments: dayAppointments,
            activities: dayActivities,
            medications: dayMedications
        }
    }

    // Navigate months
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
        setSelectedDate(new Date())
    }

    // Check if date is today
    const isToday = (date) => {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    // Check if date is selected
    const isSelected = (date) => {
        return date.toDateString() === selectedDate.toDateString()
    }

    // Format date for display
    const formatMonth = (date) => {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        })
    }

    // Get selected day events
    const selectedEvents = getEventsForDate(selectedDate)

    return (
        <div className="calendar-container">
            {/* Calendar Header */}
            <div className="calendar-header">
                <div className="calendar-nav">
                    <button className="nav-btn" onClick={goToPrevMonth}>
                        <ChevronLeft size={20} />
                    </button>
                    <h2>{formatMonth(currentDate)}</h2>
                    <button className="nav-btn" onClick={goToNextMonth}>
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="calendar-actions">
                    <button className="today-btn" onClick={goToToday}>
                        Today
                    </button>
                    <button className="add-btn" onClick={() => setShowAddModal(true)}>
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            <div className="calendar-body">
                {/* Calendar Grid */}
                <div className="calendar-grid">
                    {/* Day headers */}
                    <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="weekday">{day}</div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="calendar-days">
                        {calendarDays.map((day, idx) => {
                            const events = getEventsForDate(day.date)
                            const hasEvents = events.appointments.length > 0 || 
                                              events.activities.length > 0 ||
                                              events.medications.length > 0

                            return (
                                <button
                                    key={idx}
                                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} 
                                               ${isToday(day.date) ? 'today' : ''} 
                                               ${isSelected(day.date) ? 'selected' : ''}`}
                                    onClick={() => setSelectedDate(day.date)}
                                >
                                    <span className="day-number">{day.date.getDate()}</span>
                                    {hasEvents && (
                                        <div className="event-dots">
                                            {events.appointments.length > 0 && <span className="dot appointment"></span>}
                                            {events.medications.length > 0 && <span className="dot medication"></span>}
                                            {events.activities.length > 0 && <span className="dot activity"></span>}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Selected Day Details */}
                <div className="selected-day-panel">
                    <h3>
                        {selectedDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </h3>

                    <div className="events-list">
                        {/* Medications */}
                        {selectedEvents.medications.length > 0 && (
                            <div className="event-section">
                                <h4>💊 Medications</h4>
                                {selectedEvents.medications.map((med, idx) => (
                                    <div key={idx} className="event-item medication">
                                        <div className="event-time">
                                            {med.times?.join(', ') || 'Time not set'}
                                        </div>
                                        <div className="event-details">
                                            <span className="event-title">{med.name}</span>
                                            <span className="event-subtitle">{med.dosage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Appointments */}
                        {selectedEvents.appointments.length > 0 && (
                            <div className="event-section">
                                <h4>📅 Appointments</h4>
                                {selectedEvents.appointments.map((apt, idx) => (
                                    <div key={idx} className="event-item appointment">
                                        <div className="event-time">
                                            {formatTime(apt.date_time || apt.date)}
                                        </div>
                                        <div className="event-details">
                                            <span className="event-title">{apt.title}</span>
                                            {apt.location && (
                                                <span className="event-subtitle">
                                                    <MapPin size={12} /> {apt.location}
                                                </span>
                                            )}
                                        </div>
                                        {onDeleteAppointment && (
                                            <button 
                                                className="delete-btn"
                                                onClick={() => onDeleteAppointment(apt.id)}
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Activities */}
                        {selectedEvents.activities.length > 0 && (
                            <div className="event-section">
                                <h4>🏃 Activities</h4>
                                {selectedEvents.activities.map((act, idx) => (
                                    <div key={idx} className="event-item activity">
                                        <div className="event-time">
                                            {formatTime(act.timestamp || act.date)}
                                        </div>
                                        <div className="event-details">
                                            <span className="event-title">
                                                {act.activity_name || act.activity_type}
                                            </span>
                                            <span className="event-subtitle">
                                                {act.duration_minutes} minutes
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {selectedEvents.appointments.length === 0 && 
                         selectedEvents.activities.length === 0 && 
                         selectedEvents.medications.length === 0 && (
                            <div className="empty-day">
                                <CalendarIcon size={32} />
                                <p>No events scheduled for this day</p>
                                <button 
                                    className="add-event-btn"
                                    onClick={() => setShowAddModal(true)}
                                >
                                    <Plus size={16} /> Add Appointment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Appointment Modal */}
            {showAddModal && (
                <AddAppointmentModal
                    selectedDate={selectedDate}
                    onClose={() => setShowAddModal(false)}
                    onAdd={(appointment) => {
                        if (onAddAppointment) {
                            onAddAppointment(appointment)
                        }
                        setShowAddModal(false)
                    }}
                />
            )}
        </div>
    )
}

// ============================================================
// Add Appointment Modal
// ============================================================

function AddAppointmentModal({ selectedDate, onClose, onAdd }) {
    const [formData, setFormData] = useState({
        title: '',
        date: selectedDate.toISOString().split('T')[0],
        time: '10:00',
        location: '',
        notes: '',
        reminder: '1hour'
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!formData.title) return

        const dateTime = new Date(`${formData.date}T${formData.time}`)
        
        onAdd({
            title: formData.title,
            date_time: dateTime.toISOString(),
            location: formData.location,
            notes: formData.notes,
            reminder: formData.reminder
        })
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Add Appointment</h3>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Title *</label>
                        <input
                            type="text"
                            placeholder="e.g., Doctor's Appointment"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Time</label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={e => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Location</label>
                        <input
                            type="text"
                            placeholder="e.g., City Hospital"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Reminder</label>
                        <select
                            value={formData.reminder}
                            onChange={e => setFormData({ ...formData, reminder: e.target.value })}
                        >
                            <option value="15min">15 minutes before</option>
                            <option value="30min">30 minutes before</option>
                            <option value="1hour">1 hour before</option>
                            <option value="1day">1 day before</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notes</label>
                        <textarea
                            placeholder="Any additional details..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            <Check size={18} /> Add Appointment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ============================================================
// Compact Calendar Widget
// ============================================================

export function CalendarWidget({ appointments = [], onViewAll }) {
    const today = new Date()
    const upcomingWeek = []
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        upcomingWeek.push(date)
    }

    const getAppointmentsForDate = (date) => {
        const dateStr = date.toISOString().split('T')[0]
        return appointments.filter(apt => {
            const aptDate = new Date(apt.date_time || apt.date).toISOString().split('T')[0]
            return aptDate === dateStr
        })
    }

    return (
        <div className="calendar-widget">
            <div className="widget-header">
                <h3><CalendarIcon size={18} /> This Week</h3>
                {onViewAll && (
                    <button className="view-all-btn" onClick={onViewAll}>
                        View Calendar
                    </button>
                )}
            </div>

            <div className="week-strip">
                {upcomingWeek.map((date, idx) => {
                    const dateAppointments = getAppointmentsForDate(date)
                    const isToday = date.toDateString() === today.toDateString()

                    return (
                        <div key={idx} className={`day-card ${isToday ? 'today' : ''}`}>
                            <span className="day-name">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="day-num">{date.getDate()}</span>
                            {dateAppointments.length > 0 && (
                                <span className="event-count">
                                    {dateAppointments.length}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Upcoming appointments preview */}
            <div className="upcoming-list">
                {appointments.slice(0, 3).map((apt, idx) => (
                    <div key={idx} className="upcoming-item">
                        <div className="upcoming-date">
                            {new Date(apt.date_time || apt.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="upcoming-details">
                            <span className="upcoming-title">{apt.title}</span>
                            <span className="upcoming-time">
                                {new Date(apt.date_time || apt.date).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
