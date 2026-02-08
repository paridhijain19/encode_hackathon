/**
 * useVoiceInput Hook
 * 
 * Provides Web Speech API integration for voice input.
 * Works in Chrome, Edge, and Safari.
 */

import { useState, useCallback, useRef, useEffect } from 'react'

export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [error, setError] = useState(null)
    const [isSupported, setIsSupported] = useState(true)
    
    const recognitionRef = useRef(null)

    // Initialize speech recognition on mount
    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        
        if (!SpeechRecognition) {
            setIsSupported(false)
            setError('Voice input is not supported in this browser. Please use Chrome or Edge.')
            return
        }

        const recognition = new SpeechRecognition()
        
        // Configuration
        recognition.continuous = false      // Stop after one phrase
        recognition.interimResults = true   // Show interim results for better feedback
        recognition.lang = 'en-IN'          // English (India) - good for Indian accents
        recognition.maxAlternatives = 1

        // Event handlers
        recognition.onstart = () => {
            console.log('[Voice] Recognition started')
            setIsListening(true)
            setError(null)
            setInterimTranscript('')
        }

        recognition.onresult = (event) => {
            let interim = ''
            let final = ''
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    final += result[0].transcript
                } else {
                    interim += result[0].transcript
                }
            }
            
            setInterimTranscript(interim)
            if (final) {
                console.log('[Voice] Final transcript:', final)
                setTranscript(final)
                setInterimTranscript('')
            }
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            setIsListening(false)
            
            switch (event.error) {
                case 'no-speech':
                    setError("I didn't hear anything. Please try again.")
                    break
                case 'audio-capture':
                    setError('No microphone found. Please check your settings.')
                    break
                case 'not-allowed':
                    setError('Microphone access denied. Please allow microphone access.')
                    break
                case 'network':
                    setError('Network error. Please check your connection.')
                    break
                default:
                    setError(`Error: ${event.error}`)
            }
        }

        recognition.onend = () => {
            setIsListening(false)
        }

        recognitionRef.current = recognition

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.abort()
                    recognitionRef.current = null
                } catch (err) {
                    console.warn('Error aborting speech recognition:', err)
                }
            }
        }
    }, [])

    // Additional cleanup effect for when component unmounts during active listening
    useEffect(() => {
        return () => {
            if (isListening && recognitionRef.current) {
                try {
                    recognitionRef.current.stop()
                } catch (err) {
                    console.warn('Error stopping speech recognition on cleanup:', err)
                }
            }
        }
    }, [isListening])

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Voice input not available')
            return
        }

        // Clear previous transcript and interim
        setTranscript('')
        setInterimTranscript('')
        setError(null)

        try {
            console.log('[Voice] Starting recognition...')
            recognitionRef.current.start()
        } catch (err) {
            // Recognition may already be started
            console.warn('Recognition start error:', err)
        }
    }, [])

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            console.log('[Voice] Stopping recognition...')
            recognitionRef.current.stop()
        }
    }, [isListening])

    const clearTranscript = useCallback(() => {
        setTranscript('')
        setInterimTranscript('')
    }, [])

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        startListening,
        stopListening,
        clearTranscript,
    }
}

export default useVoiceInput
