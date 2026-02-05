/**
 * Sound Utilities - Audio feedback using Web Audio API
 * 
 * Provides subtle audio feedback for user interactions.
 * No external sound files needed - uses generated tones.
 */

// Shared AudioContext (lazy initialized)
let audioContext = null

function getAudioContext() {
    if (!audioContext && typeof window !== 'undefined') {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContext
}

/**
 * Play a simple tone
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in seconds
 * @param {string} type - Oscillator type (sine, square, triangle, sawtooth)
 * @param {number} volume - Volume 0-1
 */
function playTone(frequency, duration = 0.1, type = 'sine', volume = 0.1) {
    try {
        const ctx = getAudioContext()
        if (!ctx) return

        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.frequency.value = frequency
        oscillator.type = type

        // Fade in and out for smoother sound
        gainNode.gain.setValueAtTime(0, ctx.currentTime)
        gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + duration)
    } catch (e) {
        // Gracefully fail if audio not available
        console.log('Audio feedback unavailable:', e.message)
    }
}

// Sound effects
export const sounds = {
    /**
     * Message sent - quick high beep
     */
    messageSent: () => playTone(800, 0.08, 'sine', 0.08),

    /**
     * Message received - softer low beep
     */
    messageReceived: () => playTone(400, 0.12, 'sine', 0.06),

    /**
     * Voice start - rising tone
     */
    voiceStart: () => {
        playTone(400, 0.1, 'triangle', 0.08)
        setTimeout(() => playTone(600, 0.1, 'triangle', 0.08), 80)
    },

    /**
     * Voice stop - falling tone
     */
    voiceStop: () => {
        playTone(600, 0.1, 'triangle', 0.08)
        setTimeout(() => playTone(400, 0.1, 'triangle', 0.08), 80)
    },

    /**
     * Success - pleasant chord
     */
    success: () => {
        playTone(523, 0.15, 'sine', 0.06) // C5
        setTimeout(() => playTone(659, 0.15, 'sine', 0.06), 50) // E5
        setTimeout(() => playTone(784, 0.2, 'sine', 0.06), 100) // G5
    },

    /**
     * Error - short harsh buzz
     */
    error: () => playTone(200, 0.2, 'sawtooth', 0.05),

    /**
     * Click - tiny tick
     */
    click: () => playTone(1000, 0.03, 'sine', 0.04),
}

export default sounds
