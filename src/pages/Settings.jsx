/**
 * Settings Page for Amble
 * 
 * Allows users to configure:
 * - Notification preferences
 * - Emergency contacts
 * - Medication reminders
 * - Privacy settings
 * - Account settings
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    ChevronLeft, Bell, Shield, Heart, Users, Clock,
    Save, Phone, Mail, AlertCircle, Check, Plus, X,
    Volume2, Vibrate, Moon, Sun
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Settings.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ============================================================
// Main Settings Component
// ============================================================

export default function Settings() {
    const navigate = useNavigate()
    const { currentUser, signOut, isParent } = useAuth()
    const [activeSection, setActiveSection] = useState('notifications')
    const [isSaving, setIsSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState(null)
    
    // Settings state
    const [settings, setSettings] = useState({
        notifications: {
            emailAlerts: true,
            pushNotifications: true,
            smsAlerts: false,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            alertTypes: {
                wellness: true,
                activity: true,
                medication: true,
                emergency: true
            }
        },
        medications: [],
        emergencyContacts: [],
        privacy: {
            shareLocation: true,
            shareMood: true,
            shareActivities: true,
            shareExpenses: false
        }
    })

    // Load settings on mount
    useEffect(() => {
        loadSettings()
    }, [currentUser])

    const loadSettings = async () => {
        if (!currentUser) return
        
        try {
            const response = await fetch(`${API_BASE}/api/settings/${currentUser.id}`)
            if (response.ok) {
                const data = await response.json()
                // Backend returns the settings object directly
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }))
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error)
        }
    }

    const saveSettings = async () => {
        if (!currentUser) return
        
        setIsSaving(true)
        try {
            const response = await fetch(`${API_BASE}/api/settings/${currentUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            
            if (response.ok) {
                setSaveMessage({ type: 'success', text: 'Settings saved!' })
            } else {
                setSaveMessage({ type: 'error', text: 'Failed to save settings' })
            }
        } catch (error) {
            setSaveMessage({ type: 'error', text: 'Connection error' })
        } finally {
            setIsSaving(false)
            setTimeout(() => setSaveMessage(null), 3000)
        }
    }

    const sections = [
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'medications', icon: Heart, label: 'Medications' },
        { id: 'emergency', icon: Phone, label: 'Emergency Contacts' },
        { id: 'privacy', icon: Shield, label: 'Privacy' },
        { id: 'account', icon: Users, label: 'Account' },
    ]

    const handleSignOut = () => {
        signOut()
        navigate('/')
    }

    return (
        <div className="settings-page">
            {/* Header */}
            <header className="settings-header">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1>Settings</h1>
                <button 
                    className="save-btn" 
                    onClick={saveSettings}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : <><Save size={18} /> Save</>}
                </button>
            </header>

            {/* Save message toast */}
            {saveMessage && (
                <div className={`save-toast ${saveMessage.type}`}>
                    {saveMessage.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {saveMessage.text}
                </div>
            )}

            <div className="settings-layout">
                {/* Sidebar */}
                <nav className="settings-nav">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}
                        >
                            <section.icon size={20} />
                            <span>{section.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Content */}
                <main className="settings-content">
                    {activeSection === 'notifications' && (
                        <NotificationSettings 
                            settings={settings.notifications}
                            onChange={(notif) => setSettings(prev => ({ ...prev, notifications: notif }))}
                        />
                    )}
                    {activeSection === 'medications' && (
                        <MedicationSettings 
                            medications={settings.medications}
                            onChange={(meds) => setSettings(prev => ({ ...prev, medications: meds }))}
                        />
                    )}
                    {activeSection === 'emergency' && (
                        <EmergencyContactSettings 
                            contacts={settings.emergencyContacts}
                            onChange={(contacts) => setSettings(prev => ({ ...prev, emergencyContacts: contacts }))}
                        />
                    )}
                    {activeSection === 'privacy' && (
                        <PrivacySettings 
                            settings={settings.privacy}
                            onChange={(privacy) => setSettings(prev => ({ ...prev, privacy: privacy }))}
                        />
                    )}
                    {activeSection === 'account' && (
                        <div className="settings-section">
                            <h2>Account</h2>
                            {currentUser && (
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '20px', background: '#FAF9F7', borderRadius: '12px',
                                    marginBottom: '24px'
                                }}>
                                    <span style={{ fontSize: '2.5rem' }}>{currentUser.avatar}</span>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px' }}>{currentUser.name}</h3>
                                        <p style={{ margin: 0, color: '#7A7267', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                                            {currentUser.role}
                                        </p>
                                        <p style={{ margin: '2px 0 0', color: '#A8A093', fontSize: '0.8rem' }}>
                                            ID: {currentUser.id}
                                        </p>
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={handleSignOut}
                                style={{
                                    width: '100%', padding: '14px 24px', background: '#C17F59',
                                    color: 'white', border: 'none', borderRadius: '12px',
                                    fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}

// ============================================================
// Notification Settings Section
// ============================================================

function NotificationSettings({ settings, onChange }) {
    const handleToggle = (key) => {
        onChange({ ...settings, [key]: !settings[key] })
    }

    const handleAlertTypeToggle = (type) => {
        onChange({
            ...settings,
            alertTypes: {
                ...settings.alertTypes,
                [type]: !settings.alertTypes[type]
            }
        })
    }

    return (
        <div className="settings-section">
            <h2><Bell size={20} /> Notification Preferences</h2>
            
            <div className="setting-group">
                <h3>Channels</h3>
                
                <label className="toggle-setting">
                    <span>
                        <Mail size={18} />
                        Email Alerts
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.emailAlerts}
                        onChange={() => handleToggle('emailAlerts')}
                    />
                    <span className="toggle"></span>
                </label>

                <label className="toggle-setting">
                    <span>
                        <Bell size={18} />
                        Push Notifications
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.pushNotifications}
                        onChange={() => handleToggle('pushNotifications')}
                    />
                    <span className="toggle"></span>
                </label>

                <label className="toggle-setting">
                    <span>
                        <Vibrate size={18} />
                        SMS Alerts
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.smsAlerts}
                        onChange={() => handleToggle('smsAlerts')}
                    />
                    <span className="toggle"></span>
                </label>
            </div>

            <div className="setting-group">
                <h3>Alert Types</h3>
                
                {Object.entries(settings.alertTypes || {}).map(([type, enabled]) => (
                    <label key={type} className="toggle-setting">
                        <span style={{ textTransform: 'capitalize' }}>
                            {type} Alerts
                        </span>
                        <input 
                            type="checkbox" 
                            checked={enabled}
                            onChange={() => handleAlertTypeToggle(type)}
                        />
                        <span className="toggle"></span>
                    </label>
                ))}
            </div>

            <div className="setting-group">
                <h3>Quiet Hours</h3>
                
                <label className="toggle-setting">
                    <span>
                        <Moon size={18} />
                        Enable Quiet Hours
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.quietHoursEnabled}
                        onChange={() => handleToggle('quietHoursEnabled')}
                    />
                    <span className="toggle"></span>
                </label>

                {settings.quietHoursEnabled && (
                    <div className="time-range">
                        <div className="time-input">
                            <label>Start</label>
                            <input 
                                type="time" 
                                value={settings.quietHoursStart}
                                onChange={(e) => onChange({ ...settings, quietHoursStart: e.target.value })}
                            />
                        </div>
                        <span>to</span>
                        <div className="time-input">
                            <label>End</label>
                            <input 
                                type="time" 
                                value={settings.quietHoursEnd}
                                onChange={(e) => onChange({ ...settings, quietHoursEnd: e.target.value })}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================
// Medication Settings Section
// ============================================================

function MedicationSettings({ medications, onChange }) {
    const [showForm, setShowForm] = useState(false)
    const [newMed, setNewMed] = useState({
        name: '',
        dosage: '',
        times: ['08:00'],
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        notes: ''
    })

    const addMedication = () => {
        if (!newMed.name) return
        
        onChange([...medications, { ...newMed, id: Date.now() }])
        setNewMed({
            name: '',
            dosage: '',
            times: ['08:00'],
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            notes: ''
        })
        setShowForm(false)
    }

    const removeMedication = (id) => {
        onChange(medications.filter(m => m.id !== id))
    }

    const addTime = () => {
        setNewMed({ ...newMed, times: [...newMed.times, '12:00'] })
    }

    const removeTime = (index) => {
        setNewMed({ ...newMed, times: newMed.times.filter((_, i) => i !== index) })
    }

    const toggleDay = (day) => {
        if (newMed.days.includes(day)) {
            setNewMed({ ...newMed, days: newMed.days.filter(d => d !== day) })
        } else {
            setNewMed({ ...newMed, days: [...newMed.days, day] })
        }
    }

    const dayLabels = {
        mon: 'M', tue: 'T', wed: 'W', thu: 'T', fri: 'F', sat: 'S', sun: 'S'
    }

    return (
        <div className="settings-section">
            <h2><Heart size={20} /> Medication Reminders</h2>
            
            <p className="section-description">
                Set up reminders for your medications. Amble will remind you at the scheduled times.
            </p>

            {/* Existing medications */}
            <div className="medication-list">
                {medications.length === 0 ? (
                    <p className="empty-state">No medications added yet.</p>
                ) : (
                    medications.map(med => (
                        <div key={med.id} className="medication-card">
                            <div className="med-info">
                                <h4>{med.name}</h4>
                                <p>{med.dosage}</p>
                                <p className="med-times">
                                    <Clock size={14} />
                                    {med.times.join(', ')}
                                </p>
                            </div>
                            <button 
                                className="remove-btn"
                                onClick={() => removeMedication(med.id)}
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add medication form */}
            {showForm ? (
                <div className="medication-form">
                    <h3>Add Medication</h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Medication Name</label>
                            <input 
                                type="text"
                                placeholder="e.g., Blood Pressure Medicine"
                                value={newMed.name}
                                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Dosage</label>
                            <input 
                                type="text"
                                placeholder="e.g., 1 tablet"
                                value={newMed.dosage}
                                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Reminder Times</label>
                        <div className="times-list">
                            {newMed.times.map((time, index) => (
                                <div key={index} className="time-chip">
                                    <input 
                                        type="time"
                                        value={time}
                                        onChange={(e) => {
                                            const newTimes = [...newMed.times]
                                            newTimes[index] = e.target.value
                                            setNewMed({ ...newMed, times: newTimes })
                                        }}
                                    />
                                    {newMed.times.length > 1 && (
                                        <button onClick={() => removeTime(index)}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button className="add-time-btn" onClick={addTime}>
                                <Plus size={14} /> Add Time
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Days</label>
                        <div className="days-selector">
                            {Object.entries(dayLabels).map(([day, label]) => (
                                <button
                                    key={day}
                                    className={`day-btn ${newMed.days.includes(day) ? 'active' : ''}`}
                                    onClick={() => toggleDay(day)}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Notes (optional)</label>
                        <input 
                            type="text"
                            placeholder="e.g., Take with food"
                            value={newMed.notes}
                            onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
                        />
                    </div>

                    <div className="form-actions">
                        <button className="cancel-btn" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                        <button className="submit-btn" onClick={addMedication}>
                            <Plus size={18} /> Add Medication
                        </button>
                    </div>
                </div>
            ) : (
                <button className="add-btn" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Add Medication
                </button>
            )}
        </div>
    )
}

// ============================================================
// Emergency Contact Settings Section
// ============================================================

function EmergencyContactSettings({ contacts, onChange }) {
    const [showForm, setShowForm] = useState(false)
    const [newContact, setNewContact] = useState({
        name: '',
        relation: '',
        phone: '',
        email: '',
        isPrimary: false
    })

    const addContact = () => {
        if (!newContact.name || !newContact.phone) return
        
        const contact = { ...newContact, id: Date.now() }
        
        // If this is primary, unset other primary contacts
        let updatedContacts = contacts
        if (newContact.isPrimary) {
            updatedContacts = contacts.map(c => ({ ...c, isPrimary: false }))
        }
        
        onChange([...updatedContacts, contact])
        setNewContact({
            name: '',
            relation: '',
            phone: '',
            email: '',
            isPrimary: false
        })
        setShowForm(false)
    }

    const removeContact = (id) => {
        onChange(contacts.filter(c => c.id !== id))
    }

    const setPrimary = (id) => {
        onChange(contacts.map(c => ({ ...c, isPrimary: c.id === id })))
    }

    return (
        <div className="settings-section">
            <h2><Phone size={20} /> Emergency Contacts</h2>
            
            <p className="section-description">
                Add family members or caregivers who should be contacted in case of emergencies.
            </p>

            {/* Existing contacts */}
            <div className="contacts-list">
                {contacts.length === 0 ? (
                    <p className="empty-state">No emergency contacts added yet.</p>
                ) : (
                    contacts.map(contact => (
                        <div key={contact.id} className={`contact-card ${contact.isPrimary ? 'primary' : ''}`}>
                            <div className="contact-info">
                                <h4>
                                    {contact.name}
                                    {contact.isPrimary && <span className="primary-badge">Primary</span>}
                                </h4>
                                <p>{contact.relation}</p>
                                <p><Phone size={14} /> {contact.phone}</p>
                                {contact.email && <p><Mail size={14} /> {contact.email}</p>}
                            </div>
                            <div className="contact-actions">
                                {!contact.isPrimary && (
                                    <button 
                                        className="set-primary-btn"
                                        onClick={() => setPrimary(contact.id)}
                                    >
                                        Set Primary
                                    </button>
                                )}
                                <button 
                                    className="remove-btn"
                                    onClick={() => removeContact(contact.id)}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add contact form */}
            {showForm ? (
                <div className="contact-form">
                    <h3>Add Emergency Contact</h3>
                    
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name *</label>
                            <input 
                                type="text"
                                placeholder="Contact name"
                                value={newContact.name}
                                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Relationship</label>
                            <input 
                                type="text"
                                placeholder="e.g., Son, Daughter"
                                value={newContact.relation}
                                onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Phone Number *</label>
                            <input 
                                type="tel"
                                placeholder="+91 XXXXX XXXXX"
                                value={newContact.phone}
                                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input 
                                type="email"
                                placeholder="email@example.com"
                                value={newContact.email}
                                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <label className="toggle-setting">
                        <span>Set as Primary Contact</span>
                        <input 
                            type="checkbox" 
                            checked={newContact.isPrimary}
                            onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                        />
                        <span className="toggle"></span>
                    </label>

                    <div className="form-actions">
                        <button className="cancel-btn" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                        <button className="submit-btn" onClick={addContact}>
                            <Plus size={18} /> Add Contact
                        </button>
                    </div>
                </div>
            ) : (
                <button className="add-btn" onClick={() => setShowForm(true)}>
                    <Plus size={18} /> Add Emergency Contact
                </button>
            )}
        </div>
    )
}

// ============================================================
// Privacy Settings Section
// ============================================================

function PrivacySettings({ settings, onChange }) {
    const handleToggle = (key) => {
        onChange({ ...settings, [key]: !settings[key] })
    }

    return (
        <div className="settings-section">
            <h2><Shield size={20} /> Privacy Settings</h2>
            
            <p className="section-description">
                Control what information is shared with your family members.
            </p>

            <div className="setting-group">
                <h3>Data Sharing with Family</h3>
                
                <label className="toggle-setting">
                    <span>
                        Share Location Activity
                        <small>Family can see your general location</small>
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.shareLocation}
                        onChange={() => handleToggle('shareLocation')}
                    />
                    <span className="toggle"></span>
                </label>

                <label className="toggle-setting">
                    <span>
                        Share Mood Updates
                        <small>Family can see your mood history</small>
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.shareMood}
                        onChange={() => handleToggle('shareMood')}
                    />
                    <span className="toggle"></span>
                </label>

                <label className="toggle-setting">
                    <span>
                        Share Daily Activities
                        <small>Family can see what you've been doing</small>
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.shareActivities}
                        onChange={() => handleToggle('shareActivities')}
                    />
                    <span className="toggle"></span>
                </label>

                <label className="toggle-setting">
                    <span>
                        Share Expense Information
                        <small>Family can see your spending</small>
                    </span>
                    <input 
                        type="checkbox" 
                        checked={settings.shareExpenses}
                        onChange={() => handleToggle('shareExpenses')}
                    />
                    <span className="toggle"></span>
                </label>
            </div>

            <div className="privacy-note">
                <AlertCircle size={18} />
                <p>
                    <strong>Note:</strong> Emergency alerts are always sent regardless of these settings. 
                    Your safety is our priority.
                </p>
            </div>
        </div>
    )
}
