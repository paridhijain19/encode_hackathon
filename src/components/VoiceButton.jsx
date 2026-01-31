/**
 * VoiceButton Component
 * 
 * Floating action button that opens the chat overlay.
 * Displays visual states for listening/loading.
 * 
 * Props:
 *   - onClick: function - Callback when button is clicked (opens chat)
 *   - isListening: boolean - Whether voice recognition is active
 *   - isLoading: boolean - Whether agent is processing
 *   - showLabel: boolean - Whether to show text label
 */

import React from 'react'
import { Mic, MicOff, Loader } from 'lucide-react'
import './VoiceButton.css'

export function VoiceButton({ onClick, isListening = false, isLoading = false, showLabel = true }) {
    // Determine button state
    const buttonClass = `voice-fab ${isListening ? 'listening' : ''} ${isLoading ? 'loading' : ''}`

    const getLabel = () => {
        if (isListening) return 'Listening...'
        if (isLoading) return 'Thinking...'
        return 'Speak'
    }

    return (
        <button
            className={buttonClass}
            onClick={onClick}
            aria-label="Open chat with Amble"
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader size={28} className="spin" />
            ) : (
                <Mic size={28} />
            )}
            {showLabel && <span>{getLabel()}</span>}
        </button>
    )
}

export default VoiceButton
