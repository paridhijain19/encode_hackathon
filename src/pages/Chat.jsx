/**
 * Chat Page - Minimal chat interface inspired by Grace
 * 
 * A clean, centered chat experience for talking to Amble.
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Send, Mic, Home, MessageCircle, Settings, Plus, MicOff, Volume2, VolumeX, ArrowLeft, Grid3X3 } from 'lucide-react'
import { useAgent } from '../hooks/useAgent'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../context/AuthContext'
import { getState } from '../services/api'
import { UserBadge, SignInModal } from '../components/SignIn'
import NotificationBanner from '../components/NotificationBanner'
import ConversationalAvatar from '../components/ConversationalAvatar'
import './Chat.css'

// Get contextual greeting based on time of day
function getContextualGreeting(name = '') {
    const hour = new Date().getHours()
    const greeting = name ? `, ${name}` : ''

    if (hour >= 5 && hour < 12) {
        return `Good morning${greeting}! How did you sleep?`
    }
    if (hour >= 12 && hour < 17) {
        return `Good afternoon${greeting}! How's your day going?`
    }
    if (hour >= 17 && hour < 21) {
        return `Good evening${greeting}! How was your day?`
    }
    return `Hello${greeting}! What's on your mind?`
}

// Avatar component for Amble
function AmbleAvatar({ size = 'medium', isActive = false }) {
    const sizeMap = {
        small: 48,
        medium: 120,
        large: 180
    }
    const px = sizeMap[size] || 120

    return (
        <div
            className={`amble-avatar ${size} ${isActive ? 'active' : ''}`}
            style={{ width: px, height: px }}
        >
            <div className="avatar-inner">
                <span className="avatar-emoji">🌿</span>
            </div>
            {isActive && <div className="avatar-pulse" />}
        </div>
    )
}

// Message bubble component
function MessageBubble({ message }) {
    const isUser = message.role === 'user'

    return (
        <div className={`message-bubble ${isUser ? 'user' : 'agent'} ${message.isError ? 'error' : ''}`}>
            {!isUser && (
                <div className="message-avatar">
                    <span>🌿</span>
                </div>
            )}
            <div className="message-content">
                <p>{message.text}</p>
                <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
            </div>
        </div>
    )
}

// Typing indicator
function TypingIndicator() {
    return (
        <div className="typing-indicator">
            <div className="message-avatar">
                <span>🌿</span>
            </div>
            <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    )
}

export default function Chat() {
    const { currentUser, isSignedIn, isLoading: authLoading } = useAuth()
    const userId = currentUser?.id || 'default_user'
    const agent = useAgent(userId)
    const voice = useVoiceInput()
    const tts = useTextToSpeech()
    const notifications = useNotifications(userId)
    const [input, setInput] = useState('')
    const [autoSpeak, setAutoSpeak] = useState(true)
    const [currentHint, setCurrentHint] = useState('')
    const [allHints, setAllHints] = useState([])
    const [userName, setUserName] = useState('')
    const [showSignIn, setShowSignIn] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const lastMessageCountRef = useRef(0)
    const hintIndexRef = useRef(0)

    // Voice mode state - true when using avatar voice, false for text chat
    const [voiceMode, setVoiceMode] = useState(false)
    const [avatarConnected, setAvatarConnected] = useState(false)

    // Show sign-in if not authenticated
    const needsSignIn = !authLoading && !isSignedIn

    // Use current user's name first, then fetch from API
    useEffect(() => {
        if (currentUser?.name) {
            setUserName(currentUser.name)
        }
    }, [currentUser])

    // Load memory hints on mount (for welcome screen)
    useEffect(() => {
        async function loadMemoryHints() {
            try {
                const state = await getState(userId)
                const hints = []

                // Update username from profile if available
                if (state.user_profile?.name && !currentUser?.name) {
                    setUserName(state.user_profile.name)
                }

                // Dynamic hints based on actual data
                if (state.expenses && state.expenses.length > 0) {
                    const recent = state.expenses[0]
                    hints.push(`Last expense: ₹${recent.amount} on ${recent.category}`)
                    const total = state.expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
                    hints.push(`Total tracked: ₹${total.toFixed(0)} this month`)
                }

                if (state.activities && state.activities.length > 0) {
                    const recent = state.activities[0]
                    hints.push(`Recent activity: ${recent.activity_name || recent.activity_type}`)
                }

                if (state.appointments && state.appointments.length > 0) {
                    const next = state.appointments[0]
                    hints.push(`Next: ${next.title} on ${new Date(next.date_time).toLocaleDateString()}`)
                }

                if (state.moods && state.moods.length > 0) {
                    hints.push(`You were feeling ${state.moods[0].rating} recently`)
                }

                // Add some engaging prompts if no data
                if (hints.length === 0) {
                    hints.push("Try saying 'Track my expenses'")
                    hints.push("Ask me about today's activities")
                    hints.push("I can set reminders for you")
                }

                setAllHints(hints)
                if (hints.length > 0) {
                    setCurrentHint(hints[0])
                }
            } catch (err) {
                console.log('Could not load memory hints:', err)
            }
        }

        // Trigger proactive notifications on first load
        async function triggerProactiveGreeting() {
            try {
                // Check if we already triggered today
                const lastTrigger = sessionStorage.getItem(`amble_greeting_${userId}`)
                const today = new Date().toDateString()

                if (lastTrigger !== today) {
                    await fetch(`http://localhost:8000/api/notifications/${userId}/demo`, {
                        method: 'POST'
                    })
                    sessionStorage.setItem(`amble_greeting_${userId}`, today)
                }
            } catch (err) {
                console.log('Could not trigger greeting:', err)
            }
        }

        loadMemoryHints()
        triggerProactiveGreeting()
    }, [userId])

    // Rotate hints every 5 seconds
    useEffect(() => {
        if (allHints.length <= 1) return

        const interval = setInterval(() => {
            hintIndexRef.current = (hintIndexRef.current + 1) % allHints.length
            setCurrentHint(allHints[hintIndexRef.current])
        }, 5000)

        return () => clearInterval(interval)
    }, [allHints])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [agent.messages])

    // Cleanup voice and TTS when component unmounts (navigation away)
    useEffect(() => {
        return () => {
            voice.stopListening()
            tts.stop()
        }
    }, [voice, tts])

    // Auto-send when voice transcript is ready
    useEffect(() => {
        if (voice.transcript && voice.transcript.trim() && !agent.loading) {
            const message = voice.transcript.trim()
            console.log('[Voice] Auto-sending:', message)
            // Clear transcript first to prevent double-send
            voice.clearTranscript()
            // Give a small delay to ensure clearTranscript completes
            setTimeout(() => {
                agent.chat(message)
            }, 50)
        }
    }, [voice.transcript])

    // Auto-speak agent responses (Disabled in Voice Mode)
    useEffect(() => {
        // Only auto-speak if NOT in voice mode (ElevenLabs handles voice mode)
        if (autoSpeak && !voiceMode && agent.messages.length > lastMessageCountRef.current) {
            const lastMsg = agent.messages[agent.messages.length - 1]
            if (lastMsg && lastMsg.role === 'agent' && !lastMsg.isError) {
                console.log('[TTS] Auto-speaking:', lastMsg.text.substring(0, 50) + '...')
                // Small delay to ensure UI is ready
                setTimeout(() => tts.speak(lastMsg.text), 100)
            }
        }
        lastMessageCountRef.current = agent.messages.length
    }, [agent.messages, autoSpeak, voiceMode])

    // Handle send message
    const handleSend = async () => {
        if (!input.trim() || agent.loading) return

        const message = input.trim()
        setInput('')
        await agent.chat(message)
        inputRef.current?.focus()
    }

    // Handle key press (Enter to send)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Voice input toggle
    const toggleVoice = () => {
        if (voice.isListening) {
            voice.stopListening()
        } else {
            tts.stop() // Stop any speaking when starting to listen
            voice.startListening()
        }
    }

    const hasMessages = agent.messages.length > 0
    const isActive = voice.isListening || agent.loading || tts.isSpeaking

    return (
        <div className="chat-page">
            {/* Sign-in modal if not authenticated */}
            {(needsSignIn || showSignIn) && (
                <SignInModal
                    mode="all"
                    onClose={isSignedIn ? () => setShowSignIn(false) : undefined}
                />
            )}

            {/* Proactive Notifications */}
            <NotificationBanner
                notifications={notifications.notifications}
                onDismiss={notifications.dismiss}
                onAction={(notif) => {
                    // Handle notification action (e.g., start a chat about the topic)
                    if (notif.message) {
                        setInput(notif.message)
                        inputRef.current?.focus()
                    }
                }}
            />

            {/* Sidebar */}
            <aside className="chat-sidebar">
                <Link to="/" className="sidebar-header">
                    <AmbleAvatar size="small" />
                    <span className="sidebar-title">Amble</span>
                </Link>

                <nav className="sidebar-nav">
                    <Link to="/" className="nav-link back-link">
                        <ArrowLeft size={24} />
                    </Link>
                    <Link to="/dashboard" className="nav-link">
                        <Grid3X3 size={24} />
                        <span className="nav-label">Dashboard</span>
                    </Link>
                    <Link to="/app" className="nav-link active">
                        <Home size={24} />
                        <span className="nav-label">Chat</span>
                    </Link>
                    <Link to="/app/messages" className="nav-link">
                        <MessageCircle size={24} />
                        <span className="nav-label">Messages</span>
                    </Link>
                    <Link to="/app/quick-add" className="nav-link">
                        <Plus size={24} />
                        <span className="nav-label">Quick Add</span>
                    </Link>
                    <Link to="/app/settings" className="nav-link">
                        <Settings size={24} />
                        <span className="nav-label">Settings</span>
                    </Link>
                </nav>

                {/* User badge at bottom of sidebar */}
                <div className="sidebar-user">
                    <UserBadge />
                </div>
            </aside>

            {/* Mode Toggle - Always visible with inline styles */}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 99999,
                display: 'flex',
                justifyContent: 'center',
                padding: '8px',
                background: 'white',
                borderRadius: '50px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                border: '3px solid #C4A484'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setVoiceMode(false)}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '50px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: !voiceMode ? '#C4A484' : '#f0f0f0',
                            color: !voiceMode ? 'white' : '#666',
                            transition: 'all 0.2s'
                        }}
                    >
                        💬 Text
                    </button>
                    <button
                        onClick={() => setVoiceMode(true)}
                        style={{
                            padding: '12px 24px',
                            border: 'none',
                            borderRadius: '50px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: voiceMode ? '#4CAF50' : '#f0f0f0',
                            color: voiceMode ? 'white' : '#666',
                            transition: 'all 0.2s'
                        }}
                    >
                        🎙️ Voice
                    </button>
                </div>
            </div>

            {/* Main Chat Area */}
            <main className={`chat-main ${voiceMode ? 'voice-mode' : ''}`}>
                {voiceMode ? (
                    /* Voice Mode - Full screen avatar */
                    <div className="voice-mode-container">
                        <ConversationalAvatar
                            userName={userName}
                            isActive={voiceMode}
                            onTranscript={(text) => {
                                console.log('[Avatar] User said:', text)
                                // Add user's voice message to chat history
                                agent.addMessage({ role: 'user', text })
                            }}
                            onResponse={(text) => {
                                console.log('[Avatar] Amble said:', text)
                                // Add agent's response to chat history
                                agent.addMessage({ role: 'agent', text })
                            }}
                            onStateChange={(state) => {
                                setAvatarConnected(state === 'connected')
                                console.log('[Avatar] State:', state)
                            }}
                        />
                    </div>
                ) : !hasMessages ? (
                    /* Empty State - Welcome Screen */
                    <div className="chat-welcome">
                        <h1 className="welcome-title">Talk with Amble</h1>
                        <p className="welcome-subtitle">{getContextualGreeting(userName)}</p>

                        <AmbleAvatar size="large" isActive={isActive} />

                        {currentHint && (
                            <div className="memory-hint-single">
                                <span className="hint-icon">💭</span>
                                <span className="hint-text">{currentHint}</span>
                            </div>
                        )}

                        <p className="welcome-status">
                            {voice.isListening ? 'Listening...' : agent.loading ? 'Thinking...' : tts.isSpeaking ? 'Speaking...' : 'Ready to talk'}
                        </p>
                        <p className="welcome-hint">
                            Tap the mic or type to share your thoughts
                        </p>
                    </div>
                ) : (
                    /* Messages List */
                    <div className="chat-messages">
                        {agent.messages.map((msg, i) => (
                            <MessageBubble key={i} message={msg} />
                        ))}
                        {agent.loading && <TypingIndicator />}
                        <div ref={messagesEndRef} />
                    </div>
                )}

                {/* Interim Transcript Bubble */}
                {voice.interimTranscript && (
                    <div className="interim-transcript">
                        <Mic size={16} className="pulse" />
                        <span>{voice.interimTranscript}</span>
                    </div>
                )}

                {/* Input Area */}
                <div className="chat-input-area">
                    <div className="chat-input-container">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            disabled={agent.loading}
                        />
                        <div className="input-actions">
                            <button
                                className={`tts-toggle ${autoSpeak ? 'active' : ''}`}
                                onClick={() => { tts.stop(); setAutoSpeak(!autoSpeak) }}
                                title={autoSpeak ? 'Click to mute auto-speak' : 'Click to enable auto-speak'}
                            >
                                {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
                            </button>
                            <button
                                className={`voice-btn ${voice.isListening ? 'listening' : ''}`}
                                onClick={toggleVoice}
                                disabled={!voice.isSupported}
                                title={voice.isListening ? 'Listening... (click to stop)' : 'Click to use voice'}
                            >
                                <Mic size={20} />
                            </button>
                            <button
                                className="send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || agent.loading}
                                title="Send message"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
