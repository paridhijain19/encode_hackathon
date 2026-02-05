/**
 * Chat Page - Minimal chat interface inspired by Grace
 * 
 * A clean, centered chat experience for talking to Amble.
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Send, Mic, Home, MessageCircle, Settings, Plus, MicOff } from 'lucide-react'
import { useAgent } from '../hooks/useAgent'
import { useAuth } from '../context/AuthContext'
import './Chat.css'

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
    const { currentUser } = useAuth()
    const agent = useAgent(currentUser?.id)
    const [input, setInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [agent.messages])

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
        setIsListening(!isListening)
        // TODO: Implement voice input with Web Speech API
    }

    const hasMessages = agent.messages.length > 0

    return (
        <div className="chat-page">
            {/* Sidebar */}
            <aside className="chat-sidebar">
                <div className="sidebar-header">
                    <AmbleAvatar size="small" />
                    <span className="sidebar-title">Amble</span>
                </div>

                <div className="sidebar-input">
                    <input
                        type="text"
                        placeholder="Ask me anything..."
                        disabled
                    />
                    <Mic size={18} />
                </div>

                <nav className="sidebar-nav">
                    <Link to="/app" className="nav-link active">
                        <Home size={20} />
                    </Link>
                    <Link to="/app/messages" className="nav-link">
                        <MessageCircle size={20} />
                    </Link>
                    <Link to="/app/quick-add" className="nav-link">
                        <Plus size={20} />
                    </Link>
                    <Link to="/app/settings" className="nav-link">
                        <Settings size={20} />
                    </Link>
                </nav>
            </aside>

            {/* Main Chat Area */}
            <main className="chat-main">
                {!hasMessages ? (
                    /* Empty State - Welcome Screen */
                    <div className="chat-welcome">
                        <h1 className="welcome-title">Talk with Amble</h1>
                        <p className="welcome-subtitle">One on one conversation with Amble</p>

                        <AmbleAvatar size="large" isActive={agent.loading} />

                        <p className="welcome-status">
                            {agent.loading ? 'Amble is thinking...' : 'Amble is ready to talk'}
                        </p>
                        <p className="welcome-hint">
                            Share your thoughts, feelings, or ask me anything
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
                                className={`voice-btn ${isListening ? 'listening' : ''}`}
                                onClick={toggleVoice}
                                title={isListening ? 'Stop listening' : 'Voice input'}
                            >
                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
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
