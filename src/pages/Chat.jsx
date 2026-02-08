/**
 * Chat Page - Unified Split Interface
 * 
 * Left: Text chat with message history and input
 * Right: Voice avatar with speech recognition
 * Both share the same conversation and agent
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
    Send, Home, MessageCircle, Settings, Plus,
    ArrowLeft, Grid3X3, Menu, X, Mic 
} from 'lucide-react'
import { useAgent } from '../hooks/useAgent'
import { useNotifications } from '../hooks/useNotifications'
import { useAuth } from '../context/AuthContext'
import { getState } from '../services/api'
import { UserBadge, SignInModal } from '../components/SignIn'
import NotificationBanner from '../components/NotificationBanner'
import VoiceAvatar from '../components/VoiceAvatar'
import './Chat.css'

// Get contextual greeting based on time of day
function getGreeting(name = '') {
    const hour = new Date().getHours()
    const n = name ? `, ${name}` : ''
    if (hour >= 5 && hour < 12) return `Good morning${n}!`
    if (hour >= 12 && hour < 17) return `Good afternoon${n}!`
    if (hour >= 17 && hour < 21) return `Good evening${n}!`
    return `Hello${n}!`
}

// Message bubble component
function MessageBubble({ message }) {
    const isUser = message.role === 'user'
    return (
        <div className={`message ${isUser ? 'user' : 'agent'} ${message.isError ? 'error' : ''}`}>
            {!isUser && (
                <div className="message-avatar">
                    <span>🌿</span>
                </div>
            )}
            <div className="message-bubble">
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
        <div className="message agent">
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
    const notifications = useNotifications(userId)
    
    const [input, setInput] = useState('')
    const [voiceEnabled, setVoiceEnabled] = useState(false)
    const [userName, setUserName] = useState('')
    const [showSignIn, setShowSignIn] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [mobileView, setMobileView] = useState('chat') // 'chat' or 'voice'
    const [lastAgentMessage, setLastAgentMessage] = useState('')
    
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const lastMessageCountRef = useRef(0)

    const needsSignIn = !authLoading && !isSignedIn

    // Load user name
    useEffect(() => {
        if (currentUser?.name) {
            setUserName(currentUser.name)
        }
    }, [currentUser])

    // Load name from API if not in auth
    useEffect(() => {
        async function loadUserInfo() {
            try {
                const state = await getState(userId)
                if (state.user_profile?.name && !currentUser?.name) {
                    setUserName(state.user_profile.name)
                }
            } catch (err) {
                console.log('Could not load user info:', err)
            }
        }
        loadUserInfo()
    }, [userId])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [agent.messages])

    // Track last agent message for avatar to speak
    useEffect(() => {
        if (agent.messages.length > lastMessageCountRef.current) {
            const lastMsg = agent.messages[agent.messages.length - 1]
            if (lastMsg && lastMsg.role === 'agent' && !lastMsg.isError) {
                // Set the message for avatar to speak
                setLastAgentMessage(lastMsg.text)
            }
        }
        lastMessageCountRef.current = agent.messages.length
    }, [agent.messages])

    // Handle text send
    const handleSend = async () => {
        if (!input.trim() || agent.loading) return
        const message = input.trim()
        setInput('')
        await agent.chat(message)
        inputRef.current?.focus()
    }

    // Handle voice input - routes through agent
    const handleVoiceInput = async (transcript) => {
        if (!transcript.trim() || agent.loading) return
        await agent.chat(transcript)
    }

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const hasMessages = agent.messages.length > 0

    return (
        <div className="chat-page">
            {/* Sign-in modal */}
            {(needsSignIn || showSignIn) && (
                <SignInModal
                    mode="all"
                    onClose={isSignedIn ? () => setShowSignIn(false) : undefined}
                />
            )}

            {/* Notifications */}
            <NotificationBanner
                notifications={notifications.notifications}
                onDismiss={notifications.dismiss}
                onAction={(notif) => {
                    if (notif.message) {
                        setInput(notif.message)
                        inputRef.current?.focus()
                    }
                }}
            />

            {/* Mobile Header */}
            <header className="mobile-header">
                <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
                    <Menu size={24} />
                </button>
                <h1>Amble</h1>
                <div className="mobile-tabs">
                    <button 
                        className={mobileView === 'chat' ? 'active' : ''}
                        onClick={() => setMobileView('chat')}
                    >
                        <MessageCircle size={20} />
                    </button>
                    <button 
                        className={mobileView === 'voice' ? 'active' : ''}
                        onClick={() => setMobileView('voice')}
                    >
                        <Mic size={20} />
                    </button>
                </div>
            </header>

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/" className="logo">
                        <span className="logo-icon">🌿</span>
                        <span className="logo-text">Amble</span>
                    </Link>
                    <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/" className="nav-item">
                        <ArrowLeft size={20} />
                        <span>Back</span>
                    </Link>
                    <Link to="/dashboard" className="nav-item">
                        <Grid3X3 size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/app" className="nav-item active">
                        <Home size={20} />
                        <span>Chat</span>
                    </Link>
                    <Link to="/app/messages" className="nav-item">
                        <MessageCircle size={20} />
                        <span>Messages</span>
                    </Link>
                    <Link to="/app/quick-add" className="nav-item">
                        <Plus size={20} />
                        <span>Quick Add</span>
                    </Link>
                    <Link to="/app/settings" className="nav-item">
                        <Settings size={20} />
                        <span>Settings</span>
                    </Link>
                </nav>

                <div className="sidebar-footer">
                    <UserBadge />
                </div>
            </aside>

            {/* Sidebar overlay for mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Main Content - Split View */}
            <main className="main-content">
                {/* Left Panel - Text Chat */}
                <section className={`chat-panel ${mobileView === 'chat' ? 'mobile-active' : ''}`}>
                    <div className="panel-header">
                        <h2>💬 Text Chat</h2>
                    </div>

                    <div className="messages-container">
                        {!hasMessages ? (
                            <div className="empty-state">
                                <div className="empty-avatar">🌿</div>
                                <h3>{getGreeting(userName)}</h3>
                                <p>How can I help you today?</p>
                            </div>
                        ) : (
                            <div className="messages">
                                {agent.messages.map((msg, i) => (
                                    <MessageBubble key={i} message={msg} />
                                ))}
                                {agent.loading && <TypingIndicator />}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="input-area">
                        <div className="input-wrapper">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type a message..."
                                disabled={agent.loading}
                            />
                            <button
                                className="send-btn"
                                onClick={handleSend}
                                disabled={!input.trim() || agent.loading}
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Right Panel - Voice Avatar */}
                <section className={`voice-panel ${mobileView === 'voice' ? 'mobile-active' : ''}`}>
                    <div className="panel-header">
                        <h2>🎙️ Voice Chat</h2>
                    </div>

                    <div className="voice-container">
                        <VoiceAvatar
                            onVoiceInput={handleVoiceInput}
                            textToSpeak={lastAgentMessage}
                            isProcessing={agent.loading}
                            voiceEnabled={voiceEnabled}
                            onVoiceToggle={setVoiceEnabled}
                            disabled={agent.loading}
                        />

                        {/* Recent conversation preview */}
                        {hasMessages && (
                            <div className="voice-preview">
                                <h4>Recent</h4>
                                <div className="preview-messages">
                                    {agent.messages.slice(-3).map((msg, i) => (
                                        <div key={i} className={`preview-msg ${msg.role}`}>
                                            <span className="preview-role">
                                                {msg.role === 'user' ? 'You' : 'Amble'}:
                                            </span>
                                            <span className="preview-text">
                                                {msg.text.substring(0, 80)}
                                                {msg.text.length > 80 ? '...' : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}
