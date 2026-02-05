/**
 * Onboarding Flow for Amble
 * 
 * Multi-step onboarding for new elderly users:
 * 1. Welcome - Introduction to Amble
 * 2. Profile - Name, age, location
 * 3. Interests - Select interests/hobbies
 * 4. Family - Add family members
 * 5. Complete - Ready to use
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    ChevronRight, ChevronLeft, User, MapPin, Heart, Users,
    Sparkles, Check, Plus, X, Mail, Send, Loader, Mic, MicOff
} from 'lucide-react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import './Onboarding.css'

// API helper
const API_BASE = 'http://localhost:8000'

async function saveOnboardingData(data) {
    try {
        const response = await fetch(`${API_BASE}/api/onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        return response.ok
    } catch (error) {
        console.error('Onboarding save error:', error)
        return false
    }
}

async function sendFamilyInvite(elderUserId, familyMember) {
    try {
        const response = await fetch(`${API_BASE}/api/invite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                elder_user_id: elderUserId,
                family_email: familyMember.email,
                family_name: familyMember.name,
                relation: familyMember.relation
            })
        })
        return response.ok
    } catch (error) {
        console.error('Invite send error:', error)
        return false
    }
}

// ============================================================
// Main Onboarding Component
// ============================================================

export default function Onboarding() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [currentStep, setCurrentStep] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    // Form data across all steps
    const [formData, setFormData] = useState({
        // Profile
        name: '',
        age: '',
        location: '',
        // Interests
        interests: [],
        // Family members
        familyMembers: []
    })

    // Check for invite acceptance
    const inviteToken = searchParams.get('invite')

    useEffect(() => {
        if (inviteToken) {
            // Handle family member accepting invite
            navigate(`/invite/accept?token=${inviteToken}`)
        }
    }, [inviteToken, navigate])

    const steps = [
        { id: 'welcome', title: 'Welcome', component: WelcomeStep },
        { id: 'profile', title: 'Profile', component: ProfileStep },
        { id: 'interests', title: 'Interests', component: InterestsStep },
        { id: 'family', title: 'Family', component: FamilyStep },
        { id: 'complete', title: 'Complete', component: CompleteStep }
    ]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleComplete = async () => {
        setIsLoading(true)

        // Save profile data
        const success = await saveOnboardingData(formData)

        // Send family invites
        for (const member of formData.familyMembers) {
            if (member.email) {
                await sendFamilyInvite('default_user', member)
            }
        }

        setIsLoading(false)

        if (success) {
            // Navigate to main app
            navigate('/parent')
        }
    }

    const updateFormData = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const CurrentStepComponent = steps[currentStep].component

    return (
        <div className="onboarding">
            {/* Progress indicator */}
            <div className="onboarding-progress">
                {steps.map((step, idx) => (
                    <div
                        key={step.id}
                        className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'completed' : ''}`}
                    />
                ))}
            </div>

            {/* Step content */}
            <div className="onboarding-content">
                <CurrentStepComponent
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={handleNext}
                    onBack={handleBack}
                    onComplete={handleComplete}
                    isLoading={isLoading}
                    isFirstStep={currentStep === 0}
                    isLastStep={currentStep === steps.length - 1}
                />
            </div>
        </div>
    )
}


// ============================================================
// Step 1: Welcome
// ============================================================

function WelcomeStep({ onNext }) {
    return (
        <div className="step-content welcome-step">
            <div className="welcome-icon">🌿</div>
            <h1>Welcome to Amble</h1>
            <p className="welcome-tagline">
                Your friendly companion for daily living
            </p>

            <div className="welcome-features">
                <div className="feature">
                    <span className="feature-icon">💬</span>
                    <span>Talk naturally with your voice</span>
                </div>
                <div className="feature">
                    <span className="feature-icon">📊</span>
                    <span>Track expenses, health & activities</span>
                </div>
                <div className="feature">
                    <span className="feature-icon">👨‍👩‍👧</span>
                    <span>Stay connected with family</span>
                </div>
                <div className="feature">
                    <span className="feature-icon">🔔</span>
                    <span>Gentle reminders when you need them</span>
                </div>
            </div>

            <button className="primary-btn" onClick={onNext}>
                Get Started <ChevronRight size={20} />
            </button>
        </div>
    )
}


// ============================================================
// Step 2: Profile
// ============================================================

function ProfileStep({ formData, updateFormData, onNext, onBack }) {
    const [errors, setErrors] = useState({})
    const [activeField, setActiveField] = useState(null) // 'name' or 'location'
    const voice = useVoiceInput()

    // Handle voice transcript
    useEffect(() => {
        if (voice.transcript && activeField) {
            updateFormData(activeField, voice.transcript)
            setActiveField(null)
            voice.clearTranscript()
        }
    }, [voice.transcript, activeField])

    const toggleVoice = (field) => {
        if (voice.isListening) {
            voice.stopListening()
            setActiveField(null)
        } else {
            setActiveField(field)
            voice.startListening()
        }
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.name.trim()) newErrors.name = 'Please enter your name'
        if (!formData.location.trim()) newErrors.location = 'Please enter your city'

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validate()) onNext()
    }

    return (
        <div className="step-content profile-step">
            <div className="step-header">
                <User size={32} className="step-icon" />
                <h2>Tell us about yourself</h2>
                <p>This helps Amble personalize your experience</p>
            </div>

            <div className="form-group">
                <label>What should we call you?</label>
                <div className="voice-input-group">
                    <input
                        type="text"
                        placeholder="e.g., Lakshmi"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className={errors.name ? 'error' : ''}
                    />
                    <button
                        type="button"
                        className={`voice-btn ${voice.isListening && activeField === 'name' ? 'listening' : ''}`}
                        onClick={() => toggleVoice('name')}
                        title="Speak your name"
                    >
                        {voice.isListening && activeField === 'name' ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                </div>
                {errors.name && <span className="error-text">{errors.name}</span>}
                {voice.isListening && activeField === 'name' && (
                    <span className="listening-hint">Listening... say your name</span>
                )}
            </div>

            <div className="form-group">
                <label>Your age (optional)</label>
                <input
                    type="number"
                    placeholder="e.g., 68"
                    value={formData.age}
                    onChange={(e) => updateFormData('age', e.target.value)}
                    min="1"
                    max="120"
                />
            </div>

            <div className="form-group">
                <label>
                    <MapPin size={16} /> Where do you live?
                </label>
                <div className="voice-input-group">
                    <input
                        type="text"
                        placeholder="e.g., Pune"
                        value={formData.location}
                        onChange={(e) => updateFormData('location', e.target.value)}
                        className={errors.location ? 'error' : ''}
                    />
                    <button
                        type="button"
                        className={`voice-btn ${voice.isListening && activeField === 'location' ? 'listening' : ''}`}
                        onClick={() => toggleVoice('location')}
                        title="Speak your city"
                    >
                        {voice.isListening && activeField === 'location' ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                </div>
                {errors.location && <span className="error-text">{errors.location}</span>}
                {voice.isListening && activeField === 'location' && (
                    <span className="listening-hint">Listening... say your city</span>
                )}
            </div>

            <div className="step-actions">
                <button className="secondary-btn" onClick={onBack}>
                    <ChevronLeft size={20} /> Back
                </button>
                <button className="primary-btn" onClick={handleNext}>
                    Continue <ChevronRight size={20} />
                </button>
            </div>
        </div>
    )
}


// ============================================================
// Step 3: Interests
// ============================================================

const INTEREST_OPTIONS = [
    { id: 'walking', label: 'Morning Walks', icon: '🚶' },
    { id: 'yoga', label: 'Yoga', icon: '🧘' },
    { id: 'reading', label: 'Reading', icon: '📚' },
    { id: 'music', label: 'Classical Music', icon: '🎵' },
    { id: 'gardening', label: 'Gardening', icon: '🌱' },
    { id: 'cooking', label: 'Cooking', icon: '🍳' },
    { id: 'television', label: 'TV Shows', icon: '📺' },
    { id: 'crafts', label: 'Crafts', icon: '🎨' },
    { id: 'socializing', label: 'Meeting Friends', icon: '☕' },
    { id: 'grandchildren', label: 'Grandchildren', icon: '👶' },
    { id: 'temple', label: 'Temple/Prayer', icon: '🙏' },
    { id: 'puzzles', label: 'Puzzles & Games', icon: '🧩' }
]

function InterestsStep({ formData, updateFormData, onNext, onBack }) {
    const toggleInterest = (interestId) => {
        const current = formData.interests
        if (current.includes(interestId)) {
            updateFormData('interests', current.filter(i => i !== interestId))
        } else {
            updateFormData('interests', [...current, interestId])
        }
    }

    return (
        <div className="step-content interests-step">
            <div className="step-header">
                <Heart size={32} className="step-icon" />
                <h2>What do you enjoy?</h2>
                <p>Select your interests (you can change these later)</p>
            </div>

            <div className="interests-grid">
                {INTEREST_OPTIONS.map(interest => (
                    <button
                        key={interest.id}
                        className={`interest-chip ${formData.interests.includes(interest.id) ? 'selected' : ''}`}
                        onClick={() => toggleInterest(interest.id)}
                    >
                        <span className="interest-icon">{interest.icon}</span>
                        <span className="interest-label">{interest.label}</span>
                        {formData.interests.includes(interest.id) && (
                            <Check size={16} className="check-icon" />
                        )}
                    </button>
                ))}
            </div>

            <div className="step-actions">
                <button className="secondary-btn" onClick={onBack}>
                    <ChevronLeft size={20} /> Back
                </button>
                <button className="primary-btn" onClick={onNext}>
                    Continue <ChevronRight size={20} />
                </button>
            </div>
        </div>
    )
}


// ============================================================
// Step 4: Family Members
// ============================================================

const RELATION_OPTIONS = ['Son', 'Daughter', 'Spouse', 'Sibling', 'Grandchild', 'Friend', 'Caregiver', 'Other']

function FamilyStep({ formData, updateFormData, onNext, onBack }) {
    const [showAddForm, setShowAddForm] = useState(false)
    const [newMember, setNewMember] = useState({ name: '', email: '', relation: 'Son' })

    const addFamilyMember = () => {
        if (newMember.name.trim()) {
            updateFormData('familyMembers', [...formData.familyMembers, { ...newMember, id: Date.now() }])
            setNewMember({ name: '', email: '', relation: 'Son' })
            setShowAddForm(false)
        }
    }

    const removeFamilyMember = (id) => {
        updateFormData('familyMembers', formData.familyMembers.filter(m => m.id !== id))
    }

    return (
        <div className="step-content family-step">
            <div className="step-header">
                <Users size={32} className="step-icon" />
                <h2>Add your family</h2>
                <p>They'll receive updates and can check in on you</p>
            </div>

            {/* Added family members */}
            <div className="family-list">
                {formData.familyMembers.map(member => (
                    <div key={member.id} className="family-member-card">
                        <div className="member-info">
                            <span className="member-name">{member.name}</span>
                            <span className="member-relation">{member.relation}</span>
                            {member.email && (
                                <span className="member-email">
                                    <Mail size={14} /> {member.email}
                                </span>
                            )}
                        </div>
                        <button
                            className="remove-btn"
                            onClick={() => removeFamilyMember(member.id)}
                        >
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add family form */}
            {showAddForm ? (
                <div className="add-family-form">
                    <input
                        type="text"
                        placeholder="Name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    />
                    <input
                        type="email"
                        placeholder="Email (for invite)"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    />
                    <select
                        value={newMember.relation}
                        onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                    >
                        {RELATION_OPTIONS.map(rel => (
                            <option key={rel} value={rel}>{rel}</option>
                        ))}
                    </select>
                    <div className="form-actions">
                        <button className="secondary-btn" onClick={() => setShowAddForm(false)}>
                            Cancel
                        </button>
                        <button className="primary-btn" onClick={addFamilyMember}>
                            <Check size={18} /> Add
                        </button>
                    </div>
                </div>
            ) : (
                <button className="add-family-btn" onClick={() => setShowAddForm(true)}>
                    <Plus size={20} /> Add Family Member
                </button>
            )}

            <p className="skip-hint">
                You can skip this and add family members later
            </p>

            <div className="step-actions">
                <button className="secondary-btn" onClick={onBack}>
                    <ChevronLeft size={20} /> Back
                </button>
                <button className="primary-btn" onClick={onNext}>
                    {formData.familyMembers.length > 0 ? (
                        <>Continue <ChevronRight size={20} /></>
                    ) : (
                        <>Skip for now <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
    )
}


// ============================================================
// Step 5: Complete
// ============================================================

function CompleteStep({ formData, onBack, onComplete, isLoading }) {
    return (
        <div className="step-content complete-step">
            <div className="complete-icon">
                <Sparkles size={48} />
            </div>
            <h2>You're all set, {formData.name || 'friend'}!</h2>
            <p>Amble is ready to be your daily companion</p>

            <div className="summary-card">
                <h3>Quick Summary</h3>
                <div className="summary-item">
                    <User size={18} />
                    <span>{formData.name || 'Not set'}, {formData.age ? `${formData.age} years` : 'Age not set'}</span>
                </div>
                <div className="summary-item">
                    <MapPin size={18} />
                    <span>{formData.location || 'Location not set'}</span>
                </div>
                <div className="summary-item">
                    <Heart size={18} />
                    <span>
                        {formData.interests.length > 0
                            ? `${formData.interests.length} interests selected`
                            : 'No interests selected'}
                    </span>
                </div>
                <div className="summary-item">
                    <Users size={18} />
                    <span>
                        {formData.familyMembers.length > 0
                            ? `${formData.familyMembers.length} family members`
                            : 'No family added yet'}
                    </span>
                </div>
            </div>

            {formData.familyMembers.length > 0 && (
                <div className="invite-notice">
                    <Send size={18} />
                    <span>Invites will be sent to your family members</span>
                </div>
            )}

            <div className="step-actions">
                <button className="secondary-btn" onClick={onBack}>
                    <ChevronLeft size={20} /> Back
                </button>
                <button
                    className="primary-btn complete-btn"
                    onClick={onComplete}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader size={20} className="spin" /> Setting up...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} /> Start Using Amble
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}


// ============================================================
// Family Invite Accept Page
// ============================================================

export function InviteAccept() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const token = searchParams.get('token')

    const [inviteData, setInviteData] = useState(null)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Validate invite token
        async function validateToken() {
            try {
                const response = await fetch(`${API_BASE}/api/invite/validate?token=${token}`)
                if (response.ok) {
                    const data = await response.json()
                    setInviteData(data)
                } else {
                    setError('This invite link is invalid or has expired.')
                }
            } catch (err) {
                setError('Unable to validate invite. Please try again.')
            }
            setIsLoading(false)
        }

        if (token) {
            validateToken()
        } else {
            setError('No invite token provided.')
            setIsLoading(false)
        }
    }, [token])

    const handleAccept = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch(`${API_BASE}/api/invite/accept`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            })

            if (response.ok) {
                navigate('/family')
            } else {
                const data = await response.json()
                setError(data.detail || 'Failed to accept invite')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        }
        setIsLoading(false)
    }

    if (isLoading) {
        return (
            <div className="onboarding invite-accept">
                <div className="loading-state">
                    <Loader size={32} className="spin" />
                    <p>Validating invite...</p>
                </div>
            </div>
        )
    }

    if (error && !inviteData) {
        return (
            <div className="onboarding invite-accept">
                <div className="error-state">
                    <X size={48} className="error-icon" />
                    <h2>Invalid Invite</h2>
                    <p>{error}</p>
                    <button className="primary-btn" onClick={() => navigate('/')}>
                        Go to Homepage
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="onboarding invite-accept">
            <div className="step-content">
                <div className="welcome-icon">👨‍👩‍👧</div>
                <h2>Join {inviteData?.elder_name}'s Circle</h2>
                <p>
                    You've been invited as <strong>{inviteData?.relation}</strong> to
                    stay connected with {inviteData?.elder_name} through Amble.
                </p>

                <div className="form-group">
                    <label>Create a password</label>
                    <input
                        type="password"
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Confirm password</label>
                    <input
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                {error && <div className="error-message">{error}</div>}

                <button
                    className="primary-btn complete-btn"
                    onClick={handleAccept}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <><Loader size={20} className="spin" /> Creating account...</>
                    ) : (
                        <>Accept & Join <ChevronRight size={20} /></>
                    )}
                </button>
            </div>
        </div>
    )
}
