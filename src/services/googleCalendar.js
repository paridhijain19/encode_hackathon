/**
 * Google Calendar Integration Service
 * 
 * Provides Google Calendar sync functionality.
 * Requires Google Calendar API credentials in environment.
 */

// Google Calendar API configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'

let gapiInited = false
let gisInited = false
let tokenClient = null

// ============================================================
// Initialization
// ============================================================

/**
 * Check if Google Calendar integration is available
 */
export const isGoogleCalendarAvailable = () => {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY)
}

/**
 * Initialize Google API client
 */
export const initGoogleCalendar = () => {
    return new Promise((resolve, reject) => {
        if (!isGoogleCalendarAvailable()) {
            reject(new Error('Google Calendar credentials not configured'))
            return
        }

        // Load Google API script
        const script = document.createElement('script')
        script.src = 'https://apis.google.com/js/api.js'
        script.onload = () => {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: GOOGLE_API_KEY,
                        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
                    })
                    gapiInited = true
                    maybeEnableSync(resolve)
                } catch (error) {
                    reject(error)
                }
            })
        }
        script.onerror = reject
        document.head.appendChild(script)

        // Load Google Identity Services
        const gisScript = document.createElement('script')
        gisScript.src = 'https://accounts.google.com/gsi/client'
        gisScript.onload = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: CALENDAR_SCOPES,
                callback: '' // Will be set dynamically
            })
            gisInited = true
            maybeEnableSync(resolve)
        }
        gisScript.onerror = reject
        document.head.appendChild(gisScript)
    })
}

const maybeEnableSync = (resolve) => {
    if (gapiInited && gisInited) {
        resolve({ success: true })
    }
}

// ============================================================
// Authentication
// ============================================================

/**
 * Request access to user's calendar
 */
export const requestCalendarAccess = () => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('Google API not initialized'))
            return
        }

        tokenClient.callback = async (response) => {
            if (response.error) {
                reject(response)
                return
            }
            resolve({ success: true, token: response.access_token })
        }

        if (window.gapi.client.getToken() === null) {
            // First time - request consent
            tokenClient.requestAccessToken({ prompt: 'consent' })
        } else {
            // Already have token - skip consent
            tokenClient.requestAccessToken({ prompt: '' })
        }
    })
}

/**
 * Revoke calendar access
 */
export const revokeCalendarAccess = () => {
    const token = window.gapi.client.getToken()
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token)
        window.gapi.client.setToken('')
        return { success: true }
    }
    return { success: false, error: 'No token to revoke' }
}

// ============================================================
// Calendar Operations
// ============================================================

/**
 * Get user's calendars
 */
export const getCalendarList = async () => {
    try {
        const response = await window.gapi.client.calendar.calendarList.list()
        return {
            success: true,
            calendars: response.result.items.map(cal => ({
                id: cal.id,
                name: cal.summary,
                color: cal.backgroundColor,
                primary: cal.primary || false,
                accessRole: cal.accessRole
            }))
        }
    } catch (error) {
        console.error('Failed to get calendar list:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get events from a calendar
 */
export const getCalendarEvents = async (calendarId = 'primary', options = {}) => {
    const {
        timeMin = new Date().toISOString(),
        timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        maxResults = 50,
        singleEvents = true,
        orderBy = 'startTime'
    } = options

    try {
        const response = await window.gapi.client.calendar.events.list({
            calendarId,
            timeMin,
            timeMax,
            maxResults,
            singleEvents,
            orderBy
        })

        return {
            success: true,
            events: response.result.items.map(event => ({
                id: event.id,
                title: event.summary,
                description: event.description,
                location: event.location,
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                allDay: !event.start.dateTime,
                creator: event.creator?.email,
                attendees: event.attendees?.map(a => ({
                    email: a.email,
                    name: a.displayName,
                    status: a.responseStatus
                })),
                reminders: event.reminders,
                htmlLink: event.htmlLink
            }))
        }
    } catch (error) {
        console.error('Failed to get calendar events:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (event, calendarId = 'primary') => {
    try {
        const response = await window.gapi.client.calendar.events.insert({
            calendarId,
            resource: {
                summary: event.title,
                description: event.description,
                location: event.location,
                start: {
                    dateTime: event.allDay ? undefined : event.start,
                    date: event.allDay ? event.start.split('T')[0] : undefined,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                end: {
                    dateTime: event.allDay ? undefined : event.end,
                    date: event.allDay ? event.end.split('T')[0] : undefined,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                reminders: {
                    useDefault: false,
                    overrides: event.reminders || [
                        { method: 'popup', minutes: 30 },
                        { method: 'email', minutes: 60 }
                    ]
                }
            }
        })

        return {
            success: true,
            event: {
                id: response.result.id,
                title: response.result.summary,
                htmlLink: response.result.htmlLink
            }
        }
    } catch (error) {
        console.error('Failed to create calendar event:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update an existing calendar event
 */
export const updateCalendarEvent = async (eventId, updates, calendarId = 'primary') => {
    try {
        // First get the existing event
        const existing = await window.gapi.client.calendar.events.get({
            calendarId,
            eventId
        })

        // Merge updates
        const updated = {
            ...existing.result,
            summary: updates.title || existing.result.summary,
            description: updates.description || existing.result.description,
            location: updates.location || existing.result.location
        }

        if (updates.start) {
            updated.start = {
                dateTime: updates.allDay ? undefined : updates.start,
                date: updates.allDay ? updates.start.split('T')[0] : undefined,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        }

        if (updates.end) {
            updated.end = {
                dateTime: updates.allDay ? undefined : updates.end,
                date: updates.allDay ? updates.end.split('T')[0] : undefined,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        }

        const response = await window.gapi.client.calendar.events.update({
            calendarId,
            eventId,
            resource: updated
        })

        return {
            success: true,
            event: {
                id: response.result.id,
                title: response.result.summary
            }
        }
    } catch (error) {
        console.error('Failed to update calendar event:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId, calendarId = 'primary') => {
    try {
        await window.gapi.client.calendar.events.delete({
            calendarId,
            eventId
        })

        return { success: true }
    } catch (error) {
        console.error('Failed to delete calendar event:', error)
        return { success: false, error: error.message }
    }
}

// ============================================================
// Sync Functions
// ============================================================

/**
 * Sync appointments to Google Calendar
 */
export const syncAppointmentsToGoogle = async (appointments, calendarId = 'primary') => {
    const results = {
        created: 0,
        updated: 0,
        failed: 0,
        errors: []
    }

    for (const appointment of appointments) {
        try {
            if (appointment.googleEventId) {
                // Update existing
                await updateCalendarEvent(appointment.googleEventId, {
                    title: appointment.title,
                    description: appointment.notes,
                    start: appointment.datetime,
                    end: new Date(new Date(appointment.datetime).getTime() + 60 * 60 * 1000).toISOString()
                }, calendarId)
                results.updated++
            } else {
                // Create new
                const result = await createCalendarEvent({
                    title: appointment.title,
                    description: appointment.notes,
                    start: appointment.datetime,
                    end: new Date(new Date(appointment.datetime).getTime() + 60 * 60 * 1000).toISOString()
                }, calendarId)
                
                if (result.success) {
                    results.created++
                    // Store Google event ID for future sync
                    appointment.googleEventId = result.event.id
                } else {
                    results.failed++
                    results.errors.push(result.error)
                }
            }
        } catch (error) {
            results.failed++
            results.errors.push(error.message)
        }
    }

    return results
}

/**
 * Import events from Google Calendar
 */
export const importFromGoogleCalendar = async (calendarId = 'primary', options = {}) => {
    const eventsResult = await getCalendarEvents(calendarId, options)
    
    if (!eventsResult.success) {
        return eventsResult
    }

    // Convert to Amble appointment format
    const appointments = eventsResult.events.map(event => ({
        title: event.title,
        notes: event.description,
        datetime: event.start,
        location: event.location,
        googleEventId: event.id,
        allDay: event.allDay,
        source: 'google'
    }))

    return {
        success: true,
        appointments,
        count: appointments.length
    }
}

// ============================================================
// Demo Mode (No credentials)
// ============================================================

/**
 * Get mock calendar events for demo
 */
export const getDemoCalendarEvents = () => {
    const now = new Date()
    
    return [
        {
            id: 'demo-1',
            title: 'Doctor Appointment',
            description: 'Annual checkup with Dr. Smith',
            location: 'City Medical Center',
            start: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            allDay: false,
            source: 'google-demo'
        },
        {
            id: 'demo-2',
            title: 'Lunch with Family',
            description: 'Monthly family lunch at the park',
            location: 'Central Park Pavilion',
            start: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
            allDay: false,
            source: 'google-demo'
        },
        {
            id: 'demo-3',
            title: 'Book Club Meeting',
            description: 'Discussing "The Great Gatsby"',
            location: 'Community Library',
            start: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
            allDay: false,
            source: 'google-demo'
        }
    ]
}
