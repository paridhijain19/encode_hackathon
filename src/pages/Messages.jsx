/**
 * Messages Page - Chat History Viewer
 * 
 * Shows the history of conversations with Amble.
 * Allows users to scroll through past messages.
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Calendar, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './Messages.css'

const API_BASE = 'http://localhost:8000'

export default function Messages() {
    const { currentUser } = useAuth()
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedDate, setSelectedDate] = useState('')

    const userId = currentUser?.id || 'default_user'

    // Fetch chat history on mount
    useEffect(() => {
        async function fetchHistory() {
            try {
                setLoading(true)
                const response = await fetch(`${API_BASE}/api/family/chat/${userId}?limit=100`)

                if (!response.ok) {
                    throw new Error('Failed to load messages')
                }

                const data = await response.json()
                setMessages(data.messages || [])
            } catch (err) {
                console.error('Failed to load chat history:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchHistory()
    }, [userId])

    // Filter messages by search and date
    const filteredMessages = messages.filter(msg => {
        const matchesSearch = !searchQuery ||
            msg.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            msg.response?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesDate = !selectedDate ||
            msg.timestamp?.startsWith(selectedDate)

        return matchesSearch && matchesDate
    })

    // Group messages by date
    const groupedMessages = filteredMessages.reduce((groups, msg) => {
        const date = msg.timestamp ? new Date(msg.timestamp).toLocaleDateString() : 'Unknown'
        if (!groups[date]) {
            groups[date] = []
        }
        groups[date].push(msg)
        return groups
    }, {})

    return (
        <div className="messages-page">
            {/* Header */}
            <header className="messages-header">
                <Link to="/app" className="back-btn">
                    <ArrowLeft size={24} />
                </Link>
                <h1>Message History</h1>
            </header>

            {/* Filters */}
            <div className="messages-filters">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="date-filter">
                    <Calendar size={18} />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Messages List */}
            <div className="messages-content">
                {loading ? (
                    <div className="messages-loading">
                        <div className="loading-spinner"></div>
                        <p>Loading messages...</p>
                    </div>
                ) : error ? (
                    <div className="messages-error">
                        <p>⚠️ {error}</p>
                        <button onClick={() => window.location.reload()}>
                            Try Again
                        </button>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="messages-empty">
                        <MessageCircle size={48} />
                        <h2>No messages yet</h2>
                        <p>Start a conversation with Amble</p>
                        <Link to="/app" className="start-chat-btn">
                            Start Chatting
                        </Link>
                    </div>
                ) : (
                    <div className="messages-list">
                        {Object.entries(groupedMessages).map(([date, msgs]) => (
                            <div key={date} className="message-group">
                                <div className="date-divider">
                                    <span>{date}</span>
                                </div>
                                {msgs.map((msg, i) => (
                                    <div key={i} className="history-item">
                                        {/* User message */}
                                        {msg.message && (
                                            <div className="history-bubble user">
                                                <p>{msg.message}</p>
                                                <span className="time">
                                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                        )}
                                        {/* Agent response */}
                                        {msg.response && (
                                            <div className="history-bubble agent">
                                                <div className="agent-avatar">🌿</div>
                                                <div className="bubble-content">
                                                    <p>{msg.response}</p>
                                                    <span className="time">
                                                        {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
