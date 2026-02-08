/**
 * AgentChat Component
 * 
 * Chat overlay for text-based interaction with Amble agent.
 * Shows conversation history and allows text/voice input.
 * 
 * Props:
 *   - isOpen: boolean - Whether chat overlay is visible
 *   - onClose: function - Callback when closing chat
 *   - messages: array - Conversation messages from useAgent
 *   - onSendMessage: function - Callback to send message (from useAgent.chat)
 *   - isLoading: boolean - Whether agent is processing
 *   - error: string|null - Current error message
 *   - memoryCount: number - Number of memories stored for user
 */

import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Mic, Volume2, VolumeX, Loader, Brain } from 'lucide-react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useTextToSpeech } from '../hooks/useTextToSpeech'
import { formatMessage } from '../utils/formatMessage'
import './AgentChat.css'

export function AgentChat({ 
    isOpen, 
    onClose, 
    messages = [], 
    onSendMessage, 
    isLoading = false, 
    error = null,
    memoryCount = 0 
}) {
    const [input, setInput] = useState('')
    const [autoSpeak, setAutoSpeak] = useState(true)
    const messagesEndRef = useRef(null)
    const lastSpokenMsgRef = useRef(null) // Track last spoken message to avoid repeats

    const { isListening, transcript, startListening, stopListening, clearTranscript, isSupported: voiceSupported } = useVoiceInput()
    const { speak, stop: stopSpeaking, isSpeaking, isSupported: ttsSupported } = useTextToSpeech()

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Cleanup voice and TTS when overlay closes or component unmounts
    useEffect(() => {
        return () => {
            stopListening()
            stopSpeaking()
        }
    }, [])

    // Stop voice/TTS when overlay is closed
    useEffect(() => {
        if (!isOpen) {
            stopListening()
            stopSpeaking()
            // Reset last spoken message when closing
            lastSpokenMsgRef.current = null
        }
    }, [isOpen, stopListening, stopSpeaking])

    // Handle voice transcript
    useEffect(() => {
        if (transcript && !isLoading) {
            handleSend(transcript)
            clearTranscript()
        }
    }, [transcript])

    // Auto-speak agent responses - only speak NEW messages
    useEffect(() => {
        if (!autoSpeak || !ttsSupported) return
        
        const lastAgentMsg = messages.filter(m => m.role === 'agent').slice(-1)[0]
        if (!lastAgentMsg || lastAgentMsg.isError) return
        
        // Only speak if this is a new message (not already spoken)
        const msgId = lastAgentMsg.timestamp || lastAgentMsg.text
        if (msgId !== lastSpokenMsgRef.current) {
            lastSpokenMsgRef.current = msgId
            speak(lastAgentMsg.text)
        }
    }, [messages, autoSpeak, ttsSupported, speak])

    const handleSend = async (text = input) => {
        const message = text?.trim()
        if (!message || isLoading) return

        setInput('')
        if (onSendMessage) {
            await onSendMessage(message)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const toggleVoice = () => {
        if (isListening) {
            stopListening()
        } else {
            startListening()
        }
    }

    const toggleAutoSpeak = () => {
        if (isSpeaking) {
            stopSpeaking()
        }
        setAutoSpeak(!autoSpeak)
    }

    if (!isOpen) return null

    return (
        <div className="agent-chat-overlay" onClick={onClose}>
            <div className="agent-chat" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <header className="chat-header">
                    <div className="chat-title">
                        <span className="chat-icon">🌿</span>
                        <div>
                            <h2>Amble</h2>
                            <span className="chat-subtitle">Your companion</span>
                        </div>
                    </div>
                    <div className="chat-actions">
                        {memoryCount > 0 && (
                            <span className="memory-badge" title={`${memoryCount} memories stored`}>
                                <Brain size={16} />
                                {memoryCount}
                            </span>
                        )}
                        {ttsSupported && (
                            <button 
                                className={`icon-btn ${autoSpeak ? 'active' : ''}`}
                                onClick={toggleAutoSpeak}
                                title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
                            >
                                {autoSpeak ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                        )}
                        <button className="icon-btn close-btn" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <div className="chat-messages">
                    {messages.length === 0 && (
                        <div className="chat-empty">
                            <span className="empty-icon">👋</span>
                            <p>Hello! I'm Amble, your companion.</p>
                            <p className="empty-hint">Try saying "I spent 200 rupees on groceries" or "How am I doing today?"</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
                            <div className="message-content">
                                {formatMessage(msg.text)}
                            </div>
                            <span className="message-time">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="message agent loading">
                            <Loader size={20} className="spin" />
                            <span>Thinking...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <footer className="chat-input">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={isLoading}
                    />

                    {voiceSupported && (
                        <button
                            className={`voice-btn ${isListening ? 'listening' : ''}`}
                            onClick={toggleVoice}
                            disabled={isLoading}
                            title={isListening ? 'Stop listening' : 'Voice input'}
                        >
                            <Mic size={22} />
                        </button>
                    )}

                    <button
                        className="send-btn"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isLoading}
                    >
                        <Send size={22} />
                    </button>
                </footer>
            </div>
        </div>
    )
}

export default AgentChat
