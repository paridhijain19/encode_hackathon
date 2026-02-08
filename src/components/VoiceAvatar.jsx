/**
 * VoiceAvatar Component
 * 
 * Anam AI video avatar + ElevenLabs TTS, synced with our agent.
 * Based on: https://docs.anam.ai/third-party-integrations/elevenlabs
 * 
 * Flow:
 * - Text mode OFF: Text input → Agent → Text response (no speech)
 * - Voice mode ON: Voice/Text input → Agent → ElevenLabs TTS → Anam lip-sync → Play audio
 * 
 * Both modes share the same conversation through the agent.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@anam-ai/js-sdk'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import './VoiceAvatar.css'

const API_BASE = 'http://localhost:8000'

export default function VoiceAvatar({ 
    onVoiceInput,        // Callback when voice input is transcribed
    textToSpeak,         // Text for avatar to speak (agent response)
    isProcessing = false,
    voiceEnabled = false,
    onVoiceToggle,
    disabled = false,
}) {
    // Avatar state
    const [anamStatus, setAnamStatus] = useState('loading') // loading, ready, error, unavailable
    const [error, setError] = useState(null)
    
    // Voice state
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [transcript, setTranscript] = useState('')
    
    // Refs
    const videoRef = useRef(null)
    const anamClientRef = useRef(null)
    const audioInputStreamRef = useRef(null)
    const recognitionRef = useRef(null)
    const audioContextRef = useRef(null)
    const silenceTimeoutRef = useRef(null)
    const lastSpokenRef = useRef('')
    const initStartedRef = useRef(false)

    const hasAnamKey = !!import.meta.env.VITE_ANAM_API_KEY

    // ==================== Anam Initialization ====================
    
    useEffect(() => {
        if (!hasAnamKey) {
            console.log('[Anam] No API key configured')
            setAnamStatus('unavailable')
            return
        }

        // Prevent double-init in Strict Mode
        if (initStartedRef.current) return
        initStartedRef.current = true

        initAnam()

        return () => cleanup()
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        const handleUnload = () => cleanup()
        window.addEventListener('beforeunload', handleUnload)
        return () => {
            window.removeEventListener('beforeunload', handleUnload)
            cleanup()
        }
    }, [])

    async function initAnam() {
        try {
            console.log('[Anam] Fetching session token...')
            setAnamStatus('loading')

            const res = await fetch(`${API_BASE}/api/anam/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || 'Failed to get session')
            }

            const data = await res.json()
            const sessionToken = data.sessionToken

            if (!sessionToken) {
                throw new Error('Session token missing from response')
            }

            console.log('[Anam] Got session token, creating client...')

            // Create Anam client with audio passthrough (ElevenLabs handles voice)
            const client = createClient(sessionToken, {
                disableInputAudio: true // We send audio from ElevenLabs
            })
            anamClientRef.current = client

            // Stream to video element
            const videoId = 'anam-video-element'
            const videoEl = document.getElementById(videoId)

            if (videoEl) {
                console.log('[Anam] Streaming to video element...')
                await client.streamToVideoElement(videoId)
                console.log('[Anam] ✅ Video streaming')
                setAnamStatus('ready')

                // Create audio input stream for lip-sync
                try {
                    audioInputStreamRef.current = client.createAgentAudioInputStream({
                        encoding: 'pcm_s16le',
                        sampleRate: 16000,
                        channels: 1
                    })
                    console.log('[Anam] ✅ Audio input stream ready')
                } catch (audioErr) {
                    console.error('[Anam] Audio stream error:', audioErr)
                    // Video still works, just no lip-sync
                }
            } else {
                console.error('[Anam] Video element not found')
                setAnamStatus('error')
            }

        } catch (err) {
            console.error('[Anam] Init failed:', err)
            
            if (err.message?.includes('Concurrency limit') || err.message?.includes('429')) {
                setAnamStatus('unavailable')
                setError('Avatar limit reached. Using voice only.')
            } else {
                setAnamStatus('error')
                setError(err.message)
            }
        }
    }

    function cleanup() {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current)
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {})
            audioContextRef.current = null
        }
        if (anamClientRef.current) {
            try {
                anamClientRef.current.stopStreaming()
            } catch (e) {
                console.error('[Anam] Cleanup error:', e)
            }
        }
    }

    // ==================== ElevenLabs TTS + Anam Lip-sync ====================

    const speakWithAvatar = useCallback(async (text) => {
        if (!text || isSpeaking || text === lastSpokenRef.current) return
        if (!voiceEnabled) return // Don't speak if voice mode is off

        lastSpokenRef.current = text
        setIsSpeaking(true)

        // Stop listening while speaking
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
        }

        try {
            // Get PCM audio from ElevenLabs via our backend
            const response = await fetch(`${API_BASE}/api/voice/elevenlabs-tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text,
                    output_format: 'pcm_16000' // PCM for Anam lip-sync
                })
            })

            if (!response.ok) {
                const err = await response.json().catch(() => ({}))
                throw new Error(err.detail || 'TTS failed')
            }

            // Get PCM audio data
            const arrayBuffer = await response.arrayBuffer()
            const pcmData = new Uint8Array(arrayBuffer)

            // Send to Anam for lip-sync (only if Anam is ready)
            if (anamStatus === 'ready' && audioInputStreamRef.current) {
                // Convert to base64 and send in chunks
                const chunkSize = 4096
                for (let i = 0; i < pcmData.length; i += chunkSize) {
                    const chunk = pcmData.slice(i, i + chunkSize)
                    const base64 = arrayBufferToBase64(chunk.buffer)
                    audioInputStreamRef.current.sendAudioChunk(base64)
                }
                audioInputStreamRef.current.endSequence()
            }

            // Play audio locally (always - works with or without Anam)
            await playPcmAudio(arrayBuffer)

        } catch (err) {
            console.error('[VoiceAvatar] TTS error:', err)
        } finally {
            setIsSpeaking(false)

            // Resume listening if voice mode is on
            if (voiceEnabled) {
                startListening()
            }
        }
    }, [isSpeaking, voiceEnabled, isListening, anamStatus])

    // Play PCM audio through Web Audio API
    async function playPcmAudio(arrayBuffer) {
        try {
            // Create audio context if needed
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext({ sampleRate: 16000 })
            }
            const ctx = audioContextRef.current

            // Convert PCM Int16 to Float32
            const int16Array = new Int16Array(arrayBuffer)
            const float32Array = new Float32Array(int16Array.length)
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0
            }

            // Create audio buffer
            const audioBuffer = ctx.createBuffer(1, float32Array.length, 16000)
            audioBuffer.getChannelData(0).set(float32Array)

            // Play
            const source = ctx.createBufferSource()
            source.buffer = audioBuffer
            source.connect(ctx.destination)

            return new Promise((resolve) => {
                source.onended = resolve
                source.start()
            })

        } catch (err) {
            console.error('[VoiceAvatar] Audio playback error:', err)
        }
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }

    // Speak when textToSpeak changes (agent response)
    useEffect(() => {
        if (textToSpeak && !isProcessing && voiceEnabled) {
            speakWithAvatar(textToSpeak)
        }
    }, [textToSpeak, isProcessing, voiceEnabled, speakWithAvatar])

    // ==================== Speech Recognition (Voice Input) ====================

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            console.warn('[VoiceAvatar] Speech recognition not supported')
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'

        recognition.onresult = (event) => {
            let finalTranscript = ''
            let interimTranscript = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalTranscript += result[0].transcript
                } else {
                    interimTranscript += result[0].transcript
                }
            }

            setTranscript(interimTranscript || finalTranscript)

            // Clear previous timeout
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current)
            }

            // Submit after pause in speech
            if (finalTranscript.trim()) {
                silenceTimeoutRef.current = setTimeout(() => {
                    if (onVoiceInput) {
                        onVoiceInput(finalTranscript.trim())
                        setTranscript('')
                        // Stop listening - will resume after speaking
                        recognition.stop()
                        setIsListening(false)
                    }
                }, 1500)
            }
        }

        recognition.onerror = (event) => {
            console.error('[VoiceAvatar] Recognition error:', event.error)
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setIsListening(false)
            }
        }

        recognition.onend = () => {
            // Auto-restart only if voice mode is on and not speaking/processing
            if (voiceEnabled && !isSpeaking && !isProcessing) {
                try {
                    recognition.start()
                } catch (e) {
                    // May already be running
                }
            } else {
                setIsListening(false)
            }
        }

        recognitionRef.current = recognition

        return () => {
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current)
            }
            recognition.stop()
        }
    }, [voiceEnabled, isSpeaking, isProcessing, onVoiceInput])

    function startListening() {
        if (recognitionRef.current && !isListening && !isSpeaking && !isProcessing) {
            try {
                recognitionRef.current.start()
                setIsListening(true)
            } catch (e) {
                console.log('[VoiceAvatar] Could not start listening')
            }
        }
    }

    function stopListening() {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop()
            setIsListening(false)
            setTranscript('')
        }
    }

    // Handle voice toggle
    useEffect(() => {
        if (voiceEnabled && !isListening && !isSpeaking && !isProcessing) {
            startListening()
        } else if (!voiceEnabled && isListening) {
            stopListening()
        }
    }, [voiceEnabled])

    // Stop listening when processing
    useEffect(() => {
        if (isProcessing && isListening) {
            stopListening()
        }
    }, [isProcessing])

    // ==================== Render ====================

    const getAvatarState = () => {
        if (isProcessing) return 'thinking'
        if (isSpeaking) return 'speaking'
        if (isListening) return 'listening'
        return 'idle'
    }

    const avatarState = getAvatarState()

    return (
        <div className="voice-avatar-container">
            {/* Avatar Display */}
            <div className={`avatar-display ${avatarState}`}>
                {/* Anam Video Avatar */}
                <video
                    id="anam-video-element"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="avatar-video"
                    style={{ display: anamStatus === 'ready' ? 'block' : 'none' }}
                />

                {/* Fallback: Animated Orb */}
                {anamStatus !== 'ready' && (
                    <div className="avatar-orb">
                        <div className="orb-core">
                            {anamStatus === 'loading' ? (
                                <Loader2 className="spin" size={40} />
                            ) : (
                                <span className="orb-emoji">
                                    {isSpeaking ? '💬' : isListening ? '👂' : '🌿'}
                                </span>
                            )}
                        </div>
                        {(isListening || isSpeaking) && (
                            <>
                                <div className="orb-ring ring-1" />
                                <div className="orb-ring ring-2" />
                                <div className="orb-ring ring-3" />
                            </>
                        )}
                    </div>
                )}

                {/* Loading Overlay */}
                {anamStatus === 'loading' && (
                    <div className="avatar-loading">
                        <span>Loading avatar...</span>
                    </div>
                )}
            </div>

            {/* Status Badges */}
            <div className="status-badges">
                <span className={`badge ${anamStatus === 'ready' ? 'success' : anamStatus === 'loading' ? 'loading' : 'warning'}`}>
                    {anamStatus === 'ready' ? '🎬 Video Avatar' :
                     anamStatus === 'loading' ? '⏳ Loading avatar...' :
                     anamStatus === 'unavailable' ? '⚠️ Low credits - Voice only' : '⚠️ Low credits - Voice only'}
                </span>
            </div>

            {/* Status Text */}
            <div className="avatar-status">
                {error ? (
                    <span className="status-text error">{error}</span>
                ) : isProcessing ? (
                    <span className="status-text thinking">Thinking...</span>
                ) : isSpeaking ? (
                    <span className="status-text speaking">Speaking...</span>
                ) : isListening ? (
                    <span className="status-text listening">Listening... speak now!</span>
                ) : (
                    <span className="status-text idle">
                        {voiceEnabled ? 'Ready to listen' : 'Voice mode off'}
                    </span>
                )}
            </div>

            {/* Transcript Display */}
            {transcript && (
                <div className="transcript">
                    <span>"{transcript}"</span>
                </div>
            )}

            {/* Voice Toggle Button */}
            <div className="avatar-controls">
                <button
                    className={`voice-toggle ${voiceEnabled ? 'active' : ''}`}
                    onClick={() => onVoiceToggle?.(!voiceEnabled)}
                    disabled={disabled || isProcessing || isSpeaking}
                    title={voiceEnabled ? 'Turn off voice mode' : 'Turn on voice mode'}
                >
                    {voiceEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                    <span>
                        {voiceEnabled 
                            ? (anamStatus === 'ready' ? 'Voice + Avatar On' : 'Voice On')
                            : (anamStatus === 'ready' ? 'Voice + Avatar Off' : 'Voice Off')
                        }
                    </span>
                </button>
            </div>
        </div>
    )
}
