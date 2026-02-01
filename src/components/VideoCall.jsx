/**
 * Video Call Component for Amble
 * 
 * Provides video calling interface for family communication.
 * Uses CometChat SDK when available, falls back to simple interface.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
    Volume2, VolumeX, X, Maximize, Minimize, Users
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { FAMILY_MEMBERS } from '../context/AuthContext'
import * as CometChatService from '../services/cometchat'
import './VideoCall.css'

// ============================================================
// Main Video Call Component
// ============================================================

export default function VideoCall({ 
    callType = 'video', // 'video' or 'audio'
    recipientId,
    recipientName,
    onClose 
}) {
    const { currentUser } = useAuth()
    const [callState, setCallState] = useState('connecting') // connecting, ringing, active, ended
    const [isMuted, setIsMuted] = useState(false)
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio')
    const [isSpeakerOff, setIsSpeakerOff] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [callDuration, setCallDuration] = useState(0)
    const [error, setError] = useState(null)
    
    const localVideoRef = useRef(null)
    const remoteVideoRef = useRef(null)
    const containerRef = useRef(null)
    const durationTimerRef = useRef(null)

    // Initialize call
    useEffect(() => {
        initializeCall()
        
        return () => {
            cleanupCall()
        }
    }, [])

    // Call duration timer
    useEffect(() => {
        if (callState === 'active') {
            durationTimerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1)
            }, 1000)
        } else {
            if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current)
            }
        }
        
        return () => {
            if (durationTimerRef.current) {
                clearInterval(durationTimerRef.current)
            }
        }
    }, [callState])

    const initializeCall = async () => {
        try {
            // Check if CometChat is available
            if (CometChatService.isCometChatAvailable()) {
                // Use CometChat for real calling
                const result = callType === 'video' 
                    ? await CometChatService.startVideoCall(recipientId)
                    : await CometChatService.startVoiceCall(recipientId)
                
                if (result.success) {
                    setCallState('ringing')
                } else if (result.fallback) {
                    // Use fallback mode
                    simulateCall()
                } else {
                    setError('Failed to start call')
                    setCallState('ended')
                }
            } else {
                // Simulate call for demo
                simulateCall()
            }
        } catch (err) {
            console.error('Call initialization error:', err)
            setError('Failed to connect')
            setCallState('ended')
        }
    }

    const simulateCall = () => {
        // Simulate ringing
        setCallState('ringing')
        
        setTimeout(() => {
            setCallState('active')
            startLocalVideo()
        }, 2000)
    }

    const startLocalVideo = async () => {
        if (callType === 'audio') return
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            })
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream
            }
        } catch (err) {
            console.error('Failed to access camera:', err)
            setIsVideoOff(true)
        }
    }

    const cleanupCall = () => {
        // Stop local video stream
        if (localVideoRef.current?.srcObject) {
            const tracks = localVideoRef.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        }
        
        // End CometChat call if active
        // CometChatService.endCall(sessionId)
    }

    const handleEndCall = () => {
        cleanupCall()
        setCallState('ended')
        setTimeout(() => onClose?.(), 1000)
    }

    const toggleMute = () => {
        setIsMuted(prev => !prev)
        // In real implementation, mute the local audio track
        if (localVideoRef.current?.srcObject) {
            const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = isMuted
            }
        }
    }

    const toggleVideo = () => {
        setIsVideoOff(prev => !prev)
        // In real implementation, toggle the local video track
        if (localVideoRef.current?.srcObject) {
            const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = isVideoOff
            }
        }
    }

    const toggleSpeaker = () => {
        setIsSpeakerOff(prev => !prev)
    }

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            containerRef.current?.requestFullscreen?.()
        } else {
            document.exitFullscreen?.()
        }
        setIsFullscreen(prev => !prev)
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div ref={containerRef} className={`video-call-container ${isFullscreen ? 'fullscreen' : ''}`}>
            {/* Remote Video (Main) */}
            <div className="remote-video">
                {callState === 'active' && callType === 'video' ? (
                    <video ref={remoteVideoRef} autoPlay playsInline />
                ) : (
                    <div className="avatar-placeholder">
                        <div className="avatar-circle">
                            {recipientName?.charAt(0) || '?'}
                        </div>
                        <h3>{recipientName || 'Unknown'}</h3>
                        {callState === 'connecting' && <p>Connecting...</p>}
                        {callState === 'ringing' && <p>Ringing...</p>}
                        {callState === 'active' && <p>{formatDuration(callDuration)}</p>}
                        {callState === 'ended' && <p>Call Ended</p>}
                    </div>
                )}
            </div>

            {/* Local Video (PIP) */}
            {callType === 'video' && callState === 'active' && !isVideoOff && (
                <div className="local-video">
                    <video ref={localVideoRef} autoPlay playsInline muted />
                </div>
            )}

            {/* Call Status Bar */}
            <div className="call-status">
                <div className="status-info">
                    {callState === 'active' && (
                        <>
                            <span className="call-type">
                                {callType === 'video' ? <Video size={16} /> : <Phone size={16} />}
                            </span>
                            <span className="duration">{formatDuration(callDuration)}</span>
                        </>
                    )}
                </div>
                <button className="fullscreen-btn" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>
            </div>

            {/* Call Controls */}
            <div className="call-controls">
                <button 
                    className={`control-btn ${isMuted ? 'off' : ''}`}
                    onClick={toggleMute}
                >
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                {callType === 'video' && (
                    <button 
                        className={`control-btn ${isVideoOff ? 'off' : ''}`}
                        onClick={toggleVideo}
                    >
                        {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                    </button>
                )}

                <button 
                    className={`control-btn ${isSpeakerOff ? 'off' : ''}`}
                    onClick={toggleSpeaker}
                >
                    {isSpeakerOff ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>

                <button 
                    className="control-btn end-call"
                    onClick={handleEndCall}
                >
                    <PhoneOff size={24} />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="call-error">
                    <p>{error}</p>
                    <button onClick={onClose}>Close</button>
                </div>
            )}
        </div>
    )
}

// ============================================================
// Incoming Call Modal
// ============================================================

export function IncomingCallModal({ call, onAccept, onReject }) {
    const [isRinging, setIsRinging] = useState(true)

    // Auto-reject after 30 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onReject()
        }, 30000)

        return () => clearTimeout(timer)
    }, [])

    const callType = call?.type === 'video' ? 'Video' : 'Voice'
    const callerName = call?.callerName || 'Unknown'

    return (
        <div className="incoming-call-overlay">
            <div className="incoming-call-modal">
                <div className="caller-info">
                    <div className="caller-avatar">
                        {callerName.charAt(0)}
                    </div>
                    <h3>{callerName}</h3>
                    <p>Incoming {callType} Call</p>
                </div>

                <div className="call-actions">
                    <button className="reject-btn" onClick={onReject}>
                        <PhoneOff size={28} />
                        <span>Decline</span>
                    </button>
                    <button className="accept-btn" onClick={onAccept}>
                        {call?.type === 'video' ? <Video size={28} /> : <Phone size={28} />}
                        <span>Accept</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// Call Family Widget
// ============================================================

export function CallFamilyWidget({ onStartCall }) {
    const { currentUser } = useAuth()
    
    // Get family members to call
    const callableMembers = currentUser?.role === 'parent'
        ? FAMILY_MEMBERS.family
        : [FAMILY_MEMBERS.parent]

    return (
        <div className="call-family-widget">
            <div className="widget-header">
                <h3><Users size={18} /> Call Family</h3>
            </div>
            
            <div className="family-list">
                {callableMembers.map(member => (
                    <div key={member.id} className="family-member">
                        <div className="member-avatar">{member.avatar}</div>
                        <div className="member-info">
                            <span className="member-name">{member.name}</span>
                            <span className="member-role">{member.role}</span>
                        </div>
                        <div className="call-buttons">
                            <button 
                                className="call-btn voice"
                                onClick={() => onStartCall(member, 'audio')}
                                title="Voice Call"
                            >
                                <Phone size={18} />
                            </button>
                            <button 
                                className="call-btn video"
                                onClick={() => onStartCall(member, 'video')}
                                title="Video Call"
                            >
                                <Video size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
