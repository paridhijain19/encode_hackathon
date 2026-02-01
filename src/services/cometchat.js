/**
 * CometChat Service for Amble
 * 
 * Provides real-time chat, voice, and video calling capabilities
 * for family members to communicate with elderly users.
 * 
 * NOTE: This service gracefully degrades when CometChat SDK is not installed.
 * Install with: npm install @cometchat-pro/chat
 */

// CometChat configuration from environment
const COMETCHAT_APP_ID = import.meta.env.VITE_COMETCHAT_APP_ID || ''
const COMETCHAT_REGION = import.meta.env.VITE_COMETCHAT_REGION || 'us'
const COMETCHAT_AUTH_KEY = import.meta.env.VITE_COMETCHAT_AUTH_KEY || ''

let CometChat = null
let isInitialized = false
let sdkAvailable = false

/**
 * Initialize CometChat SDK
 */
export async function initCometChat() {
    if (isInitialized) return true
    if (!COMETCHAT_APP_ID) {
        console.log('[CometChat] Not configured - using fallback mode')
        return false
    }

    try {
        // Dynamic import of CometChat SDK - only if installed
        // Using a variable to prevent Vite from analyzing the import
        const moduleName = '@cometchat-pro/chat'
        const CometChatModule = await import(/* @vite-ignore */ moduleName)
        CometChat = CometChatModule.CometChat
        sdkAvailable = true

        const appSetting = new CometChat.AppSettingsBuilder()
            .subscribePresenceForAllUsers()
            .setRegion(COMETCHAT_REGION)
            .build()

        await CometChat.init(COMETCHAT_APP_ID, appSetting)
        console.log('[CometChat] Initialized successfully')
        isInitialized = true
        return true
    } catch (error) {
        console.warn('[CometChat] SDK not available or init error - using fallback mode:', error.message)
        sdkAvailable = false
        return false
    }
}

/**
 * Login user to CometChat
 * @param {string} userId - User ID
 * @param {string} displayName - Display name for the user
 */
export async function loginUser(userId, displayName) {
    if (!CometChat) {
        console.log('[CometChat] Not initialized')
        return null
    }

    try {
        // First try to get existing user
        let user = await CometChat.getLoggedinUser()
        
        if (!user) {
            // Create user if doesn't exist
            user = await CometChat.login(userId, COMETCHAT_AUTH_KEY)
        }

        console.log('[CometChat] User logged in:', user.getName())
        return user
    } catch (error) {
        console.error('[CometChat] Login error:', error)
        
        // Try to create user if login fails
        if (error.code === 'ERR_UID_NOT_FOUND') {
            try {
                const newUser = new CometChat.User(userId)
                newUser.setName(displayName)
                await CometChat.createUser(newUser, COMETCHAT_AUTH_KEY)
                return await CometChat.login(userId, COMETCHAT_AUTH_KEY)
            } catch (createError) {
                console.error('[CometChat] Create user error:', createError)
            }
        }
        return null
    }
}

/**
 * Logout user from CometChat
 */
export async function logoutUser() {
    if (!CometChat) return
    
    try {
        await CometChat.logout()
        console.log('[CometChat] User logged out')
    } catch (error) {
        console.error('[CometChat] Logout error:', error)
    }
}

/**
 * Start a voice call with another user
 * @param {string} receiverId - User ID to call
 * @param {string} receiverType - 'user' or 'group'
 */
export async function startVoiceCall(receiverId, receiverType = 'user') {
    if (!CometChat) {
        console.log('[CometChat] Not available - showing fallback')
        return { success: false, fallback: true }
    }

    try {
        const callType = CometChat.CALL_TYPE.AUDIO
        const call = new CometChat.Call(receiverId, callType, receiverType)
        
        const outgoingCall = await CometChat.initiateCall(call)
        console.log('[CometChat] Voice call initiated:', outgoingCall)
        return { success: true, call: outgoingCall }
    } catch (error) {
        console.error('[CometChat] Voice call error:', error)
        return { success: false, error }
    }
}

/**
 * Start a video call with another user
 * @param {string} receiverId - User ID to call
 * @param {string} receiverType - 'user' or 'group'
 */
export async function startVideoCall(receiverId, receiverType = 'user') {
    if (!CometChat) {
        console.log('[CometChat] Not available - showing fallback')
        return { success: false, fallback: true }
    }

    try {
        const callType = CometChat.CALL_TYPE.VIDEO
        const call = new CometChat.Call(receiverId, callType, receiverType)
        
        const outgoingCall = await CometChat.initiateCall(call)
        console.log('[CometChat] Video call initiated:', outgoingCall)
        return { success: true, call: outgoingCall }
    } catch (error) {
        console.error('[CometChat] Video call error:', error)
        return { success: false, error }
    }
}

/**
 * Accept incoming call
 * @param {string} sessionId - Call session ID
 */
export async function acceptCall(sessionId) {
    if (!CometChat) return null

    try {
        const call = await CometChat.acceptCall(sessionId)
        console.log('[CometChat] Call accepted:', call)
        return call
    } catch (error) {
        console.error('[CometChat] Accept call error:', error)
        return null
    }
}

/**
 * Reject incoming call
 * @param {string} sessionId - Call session ID
 */
export async function rejectCall(sessionId) {
    if (!CometChat) return

    try {
        await CometChat.rejectCall(sessionId, CometChat.CALL_STATUS.REJECTED)
        console.log('[CometChat] Call rejected')
    } catch (error) {
        console.error('[CometChat] Reject call error:', error)
    }
}

/**
 * End ongoing call
 * @param {string} sessionId - Call session ID
 */
export async function endCall(sessionId) {
    if (!CometChat) return

    try {
        await CometChat.endCall(sessionId)
        console.log('[CometChat] Call ended')
    } catch (error) {
        console.error('[CometChat] End call error:', error)
    }
}

/**
 * Send a text message
 * @param {string} receiverId - Recipient user ID
 * @param {string} text - Message text
 */
export async function sendMessage(receiverId, text) {
    if (!CometChat) {
        console.log('[CometChat] Not available')
        return null
    }

    try {
        const textMessage = new CometChat.TextMessage(
            receiverId,
            text,
            CometChat.RECEIVER_TYPE.USER
        )
        
        const message = await CometChat.sendMessage(textMessage)
        console.log('[CometChat] Message sent:', message)
        return message
    } catch (error) {
        console.error('[CometChat] Send message error:', error)
        return null
    }
}

/**
 * Add listener for incoming calls
 * @param {string} listenerId - Unique listener ID
 * @param {Function} onIncomingCall - Callback for incoming calls
 * @param {Function} onOutgoingCallAccepted - Callback when call is accepted
 * @param {Function} onOutgoingCallRejected - Callback when call is rejected
 * @param {Function} onCallEnded - Callback when call ends
 */
export function addCallListener(listenerId, callbacks) {
    if (!CometChat) return

    CometChat.addCallListener(
        listenerId,
        new CometChat.CallListener({
            onIncomingCallReceived: callbacks.onIncomingCall,
            onOutgoingCallAccepted: callbacks.onOutgoingCallAccepted,
            onOutgoingCallRejected: callbacks.onOutgoingCallRejected,
            onIncomingCallCancelled: callbacks.onCallEnded,
            onCallEndedMessageReceived: callbacks.onCallEnded
        })
    )
}

/**
 * Remove call listener
 * @param {string} listenerId - Listener ID to remove
 */
export function removeCallListener(listenerId) {
    if (!CometChat) return
    CometChat.removeCallListener(listenerId)
}

/**
 * Add listener for incoming messages
 * @param {string} listenerId - Unique listener ID
 * @param {Function} onMessageReceived - Callback for new messages
 */
export function addMessageListener(listenerId, onMessageReceived) {
    if (!CometChat) return

    CometChat.addMessageListener(
        listenerId,
        new CometChat.MessageListener({
            onTextMessageReceived: onMessageReceived
        })
    )
}

/**
 * Remove message listener
 * @param {string} listenerId - Listener ID to remove
 */
export function removeMessageListener(listenerId) {
    if (!CometChat) return
    CometChat.removeMessageListener(listenerId)
}

/**
 * Get conversation history with a user
 * @param {string} userId - User ID to get history with
 * @param {number} limit - Number of messages to fetch
 */
export async function getConversationHistory(userId, limit = 50) {
    if (!CometChat) return []

    try {
        const messagesRequest = new CometChat.MessagesRequestBuilder()
            .setUID(userId)
            .setLimit(limit)
            .build()

        const messages = await messagesRequest.fetchPrevious()
        return messages
    } catch (error) {
        console.error('[CometChat] Get history error:', error)
        return []
    }
}

/**
 * Check if CometChat is available
 */
export function isCometChatAvailable() {
    return isInitialized && CometChat !== null
}

/**
 * Get CometChat configuration status
 */
export function getCometChatStatus() {
    return {
        configured: !!COMETCHAT_APP_ID,
        initialized: isInitialized,
        appId: COMETCHAT_APP_ID ? '***' + COMETCHAT_APP_ID.slice(-4) : null,
        region: COMETCHAT_REGION
    }
}

export default {
    initCometChat,
    loginUser,
    logoutUser,
    startVoiceCall,
    startVideoCall,
    acceptCall,
    rejectCall,
    endCall,
    sendMessage,
    addCallListener,
    removeCallListener,
    addMessageListener,
    removeMessageListener,
    getConversationHistory,
    isCometChatAvailable,
    getCometChatStatus
}
