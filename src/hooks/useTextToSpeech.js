/**
 * useTextToSpeech Hook
 * 
 * Provides text-to-speech functionality using Web Speech API.
 * Configured for elderly users (slower rate, clear voice).
 */

import { useCallback, useState, useEffect } from 'react'

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isSupported, setIsSupported] = useState(true)
    const [voices, setVoices] = useState([])

    // Load available voices
    useEffect(() => {
        if (!window.speechSynthesis) {
            setIsSupported(false)
            return
        }

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices()
            setVoices(availableVoices)
        }

        // Voices may load asynchronously
        loadVoices()
        window.speechSynthesis.onvoiceschanged = loadVoices

        return () => {
            window.speechSynthesis.onvoiceschanged = null
        }
    }, [])

    // Cleanup effect - stop speech when component unmounts
    useEffect(() => {
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel()
            }
        }
    }, [])

    /**
     * Get the best voice for elderly users
     * Prefers English (India) or English (US) female voices
     */
    const getBestVoice = useCallback(() => {
        if (voices.length === 0) return null

        // Priority order for voice selection
        const preferences = [
            (v) => v.lang === 'en-IN' && v.name.includes('Female'),
            (v) => v.lang === 'en-IN',
            (v) => v.lang === 'en-US' && v.name.includes('Female'),
            (v) => v.lang === 'en-US',
            (v) => v.lang.startsWith('en-'),
        ]

        for (const pref of preferences) {
            const match = voices.find(pref)
            if (match) return match
        }

        return voices[0]
    }, [voices])

    /**
     * Speak text aloud
     * @param {string} text - Text to speak
     * @param {Object} options - Optional settings
     */
    const speak = useCallback((text, options = {}) => {
        if (!window.speechSynthesis || !text) return

        // Cancel any ongoing speech
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        // Configuration for elderly users
        utterance.rate = options.rate || 0.85     // Slightly slower than normal
        utterance.pitch = options.pitch || 1.0    // Normal pitch
        utterance.volume = options.volume || 1.0  // Full volume

        // Set voice
        const voice = getBestVoice()
        if (voice) {
            utterance.voice = voice
        }

        // Event handlers
        utterance.onstart = () => setIsSpeaking(true)
        utterance.onend = () => setIsSpeaking(false)
        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event)
            setIsSpeaking(false)
        }

        window.speechSynthesis.speak(utterance)
    }, [getBestVoice])

    /**
     * Stop any ongoing speech
     */
    const stop = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
        }
    }, [])

    /**
     * Pause speech
     */
    const pause = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.pause()
        }
    }, [])

    /**
     * Resume paused speech
     */
    const resume = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.resume()
        }
    }, [])

    return {
        speak,
        stop,
        pause,
        resume,
        isSpeaking,
        isSupported,
    }
}

export default useTextToSpeech
