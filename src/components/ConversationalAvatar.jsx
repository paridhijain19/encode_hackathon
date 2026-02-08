/**
 * Conversational Avatar with Anam Video + ElevenLabs Voice
 * 
 * Based on: https://docs.anam.ai/third-party-integrations/elevenlabs
 * 
 * Flow:
 * 1. Fetch session token from backend (with enableAudioPassthrough: true)
 * 2. Create Anam client with disableInputAudio: true
 * 3. Create audioInputStream for lip-sync
 * 4. Connect ElevenLabs via WebSocket
 * 5. Forward ElevenLabs audio to Anam for lip-sync
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@anam-ai/js-sdk'
import { formatMessage } from '../utils/formatMessage'

export default function ConversationalAvatar({
    onTranscript,
    onResponse,
    onStateChange,
    userName = 'there'
}) {
    const [status, setStatus] = useState('idle') // idle, connecting, connected, speaking, error
    const [error, setError] = useState(null)
    const [anamStatus, setAnamStatus] = useState('loading') // loading, ready, error, unavailable
    const [lastTranscript, setLastTranscript] = useState('')
    const [lastResponse, setLastResponse] = useState('')

    const videoRef = useRef(null)
    const anamClientRef = useRef(null)
    const audioInputStreamRef = useRef(null)
    const wsRef = useRef(null)
    const mediaStreamRef = useRef(null)
    const audioContextRef = useRef(null)

    const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID
    const hasAnamKey = !!import.meta.env.VITE_ANAM_API_KEY

    const initStarted = useRef(false)

    // Initialize Anam on mount
    useEffect(() => {
        if (!hasAnamKey) {
            console.log('[Anam] No API key configured')
            setAnamStatus('unavailable')
            return
        }

        // Prevent double-initialization in Strict Mode
        if (initStarted.current) {
            console.log('[Anam] Skipping double init')
            return
        }
        initStarted.current = true

        initAnam()

        return () => {
            cleanup()
        }
    }, [])

    // Cleanup on unmount/refresh
    useEffect(() => {
        const handleUnload = () => {
            cleanup()
        }
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

            const res = await fetch('http://localhost:8000/api/anam/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.detail || 'Failed to get session')
            }

            const data = await res.json()
            console.log('[Anam] API Response Data:', data)
            const sessionToken = data.sessionToken

            if (!sessionToken) {
                console.error('[Anam] Session token missing from response:', data)
                throw new Error('Session token missing from response')
            }

            console.log('[Anam] Session token type:', typeof sessionToken)
            console.log('[Anam] Session token preview:', sessionToken.substring(0, 20) + '...')

            // Create Anam client with audio passthrough
            const client = createClient(sessionToken, {
                disableInputAudio: true // ElevenLabs handles mic
            })
            anamClientRef.current = client

            // Stream to video element
            const videoId = 'anam-video-element'
            const videoEl = document.getElementById(videoId)

            if (videoEl) {
                console.log('[Anam] Found video element, connecting stream...')
                try {
                    await client.streamToVideoElement(videoId)
                    console.log('[Anam] ✅ Streaming to video')
                    setAnamStatus('ready')

                    // ONLY create audio input stream if video streaming succeeded
                    try {
                        audioInputStreamRef.current = client.createAgentAudioInputStream({
                            encoding: 'pcm_s16le',
                            sampleRate: 16000,
                            channels: 1
                        })
                        console.log('[Anam] ✅ Audio input stream ready')
                    } catch (audioErr) {
                        console.error('[Anam] Audio stream error:', audioErr)
                        // If audio stream fails, we can still have video, but no lip sync
                    }

                } catch (streamErr) {
                    console.error('[Anam] Stream error:', streamErr)

                    // Check for concurrency limit specifically in stream error
                    if (streamErr.message && streamErr.message.includes('Concurrency limit')) {
                        throw new Error('Concurrency limit reached')
                    }
                    throw streamErr
                }
            } else {
                console.error('[Anam] Video element not found in DOM with ID:', videoId)
                setAnamStatus('error')
            }

        } catch (err) {
            console.error('[Anam] Init failed:', err)

            // Handle concurrency limit specifically
            if (err.message && (err.message.includes('Concurrency limit') || err.message.includes('429'))) {
                setAnamStatus('unavailable')
                setError('Avatar limit reached. Using voice only.')
            } else {
                setAnamStatus('error')
                setError(err.message)
            }
        }
    }


    async function startConversation() {
        if (!agentId) {
            setError('Missing VITE_ELEVENLABS_AGENT_ID')
            return
        }

        setStatus('connecting')
        setError(null)

        try {
            // Get microphone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            mediaStreamRef.current = stream

            // Connect to ElevenLabs WebSocket
            const ws = new WebSocket(
                `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`
            )
            wsRef.current = ws

            // Set up audio context for mic capture
            const audioContext = new AudioContext({ sampleRate: 16000 })
            audioContextRef.current = audioContext
            const source = audioContext.createMediaStreamSource(stream)
            const processor = audioContext.createScriptProcessor(4096, 1, 1)

            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0)
                    const pcmData = float32ToPcm16(inputData)
                    const base64 = arrayBufferToBase64(pcmData.buffer)
                    ws.send(JSON.stringify({ user_audio_chunk: base64 }))
                }
            }

            source.connect(processor)
            processor.connect(audioContext.destination)

            ws.onopen = () => {
                console.log('[ElevenLabs] WebSocket connected')
                setStatus('connected')
                onStateChange?.('connected')
            }

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data)

                switch (msg.type) {
                    case 'audio':
                        // Forward audio to Anam for lip-sync
                        if (msg.audio_event?.audio_base_64 && audioInputStreamRef.current) {
                            audioInputStreamRef.current.sendAudioChunk(msg.audio_event.audio_base_64)
                        }
                        setStatus('speaking')
                        break

                    case 'agent_response':
                        const response = msg.agent_response_event?.agent_response
                        if (response) {
                            setLastResponse(response)
                            onResponse?.(response)
                        }
                        // End audio sequence
                        audioInputStreamRef.current?.endSequence?.()
                        setStatus('connected')
                        break

                    case 'user_transcript':
                        const transcript = msg.user_transcription_event?.user_transcript
                        if (transcript) {
                            setLastTranscript(transcript)
                            onTranscript?.(transcript)
                        }
                        break

                    case 'interruption':
                        audioInputStreamRef.current?.endSequence?.()
                        break

                    case 'ping':
                        ws.send(JSON.stringify({
                            type: 'pong',
                            event_id: msg.ping_event.event_id
                        }))
                        break
                }
            }

            ws.onerror = (err) => {
                console.error('[ElevenLabs] WebSocket error:', err)
                setError('Connection error')
                setStatus('error')
            }

            ws.onclose = () => {
                console.log('[ElevenLabs] WebSocket closed')
                setStatus('idle')
                onStateChange?.('disconnected')
            }

        } catch (err) {
            console.error('[Avatar] Start failed:', err)
            setError(err.message)
            setStatus('error')
        }
    }

    function stopConversation() {
        cleanup()
        setStatus('idle')
        setLastTranscript('')
        setLastResponse('')
    }

    function cleanup() {
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(t => t.stop())
            mediaStreamRef.current = null
        }
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }
        if (anamClientRef.current) {
            try {
                anamClientRef.current.stopStreaming()
            } catch (e) {
                console.error('[Anam] Error stopping stream:', e)
            }
        }
    }

    // Helpers
    function float32ToPcm16(float32Array) {
        const pcm16 = new Int16Array(float32Array.length)
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]))
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
        }
        return pcm16
    }

    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        return btoa(binary)
    }

    const isConnected = status === 'connected' || status === 'speaking'
    const isSpeaking = status === 'speaking'

    // Render
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '32px',
            gap: '20px',
            background: 'linear-gradient(180deg, #faf8f5 0%, #fff 100%)',
            borderRadius: '24px',
            minHeight: '500px',
            width: '100%',
            maxWidth: '440px',
            margin: '0 auto',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.1)',
            border: '3px solid #C4A484'
        }}>
            <h2 style={{ color: '#2D2D2D', margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
                🎙️ Talk with Amble
            </h2>

            {/* Avatar */}
            <div
                onClick={isConnected ? stopConversation : startConversation}
                style={{
                    width: '260px',
                    height: '260px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSpeaking
                        ? 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)'
                        : isConnected
                            ? 'linear-gradient(135deg, #AED581 0%, #8BC34A 100%)'
                            : 'linear-gradient(135deg, #E8D5B7 0%, #C4A484 100%)',
                    boxShadow: isConnected
                        ? '0 0 50px rgba(76, 175, 80, 0.4)'
                        : '0 12px 40px rgba(196, 164, 132, 0.4)',
                    transition: 'all 0.3s ease',
                    border: '5px solid white'
                }}
            >
                {/* Video Avatar */}
                <video
                    id="anam-video-element"
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: anamStatus === 'ready' ? 'block' : 'none'
                    }}
                />

                {/* Emoji Fallback */}
                {anamStatus !== 'ready' && (
                    <span style={{ fontSize: '90px' }}>
                        {isSpeaking ? '💬' : isConnected ? '👂' : '🎤'}
                    </span>
                )}
            </div>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    background: anamStatus === 'ready' ? '#E8F5E9' : anamStatus === 'loading' ? '#FFF3E0' : '#FFEBEE',
                    color: anamStatus === 'ready' ? '#2E7D32' : anamStatus === 'loading' ? '#E65100' : '#C62828'
                }}>
                    {anamStatus === 'ready' ? '🎬 Video Avatar' :
                        anamStatus === 'loading' ? '⏳ Loading avatar...' :
                            anamStatus === 'unavailable' ? '🌿 Voice Only' : '❌ Avatar Error'}
                </span>
            </div>

            {/* Connection Status */}
            <p style={{
                fontSize: '1.2rem',
                fontWeight: 600,
                color: error ? '#d32f2f' : isConnected ? '#2E7D32' : '#555',
                margin: 0,
                textAlign: 'center'
            }}>
                {error && `❌ ${error}`}
                {!error && status === 'connecting' && '⏳ Connecting...'}
                {!error && isSpeaking && '💬 Amble is speaking...'}
                {!error && status === 'connected' && '👂 Listening... speak now!'}
                {!error && status === 'idle' && '🎤 Tap to start talking'}
            </p>

            {/* Transcript */}
            {lastTranscript && (
                <div style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: '#FFF8E1',
                    borderLeft: '4px solid #FFB300'
                }}>
                    <strong style={{ color: '#F57C00' }}>You:</strong>{' '}
                    <span style={{ color: '#333' }}>{lastTranscript}</span>
                </div>
            )}

            {/* Response */}
            {lastResponse && (
                <div style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '16px',
                    background: '#E8F5E9',
                    borderLeft: '4px solid #4CAF50'
                }}>
                    <strong style={{ color: '#2E7D32' }}>Amble:</strong>{' '}
                    <div style={{ color: '#333', marginTop: '8px' }}>
                        {formatMessage(lastResponse)}
                    </div>
                </div>
            )}

            {/* Stop Button */}
            {isConnected && (
                <button
                    onClick={(e) => { e.stopPropagation(); stopConversation() }}
                    style={{
                        padding: '16px 36px',
                        background: 'linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)',
                        border: 'none',
                        borderRadius: '50px',
                        color: '#C62828',
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    ⏹️ End Conversation
                </button>
            )}

            {/* Config status */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    background: agentId ? '#E8F5E9' : '#FFEBEE',
                    color: agentId ? '#2E7D32' : '#C62828'
                }}>
                    {agentId ? '✅ ElevenLabs' : '❌ ElevenLabs'}
                </span>
            </div>
        </div>
    )
}