/**
 * Haptic Utilities - Mobile vibration feedback
 * 
 * Provides tactile feedback for mobile users.
 * Falls back silently on unsupported devices.
 */

/**
 * Vibrate the device
 * @param {number|number[]} pattern - Duration in ms, or pattern array
 */
function vibrate(pattern) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate(pattern)
        } catch (e) {
            // Silently fail if vibration not available
        }
    }
}

// Haptic patterns
export const haptics = {
    /**
     * Light tap - for button presses
     */
    light: () => vibrate(10),

    /**
     * Medium tap - for confirmations
     */
    medium: () => vibrate(25),

    /**
     * Heavy tap - for important actions
     */
    heavy: () => vibrate(50),

    /**
     * Success feedback - double tap
     */
    success: () => vibrate([15, 50, 15]),

    /**
     * Error feedback - longer buzz
     */
    error: () => vibrate([50, 100, 50]),

    /**
     * Notification - attention-getting
     */
    notification: () => vibrate([100, 50, 100]),
}

export default haptics
