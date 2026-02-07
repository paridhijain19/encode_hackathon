/**
 * Authentication Context for Amble
 * 
 * Loads registered users from the database (Supabase).
 * Falls back to static defaults if the backend is unavailable.
 * Uses localStorage to persist the current user session.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { listUsers } from '../services/api'

// Fallback users when database is unreachable
const DEFAULT_PARENTS = [
    { id: 'parent_user', name: 'Mom', role: 'parent', avatar: '👵' },
]
const DEFAULT_FAMILY = [
    { id: 'family_sarah', name: 'Sarah', role: 'daughter', avatar: '👩' },
    { id: 'family_mike', name: 'Mike', role: 'son', avatar: '👨' },
    { id: 'family_emma', name: 'Emma', role: 'granddaughter', avatar: '👧' },
]

// Mutable FAMILY_MEMBERS that gets updated once DB loads
export const FAMILY_MEMBERS = {
    parents: [...DEFAULT_PARENTS],
    family: [...DEFAULT_FAMILY],
    parent: DEFAULT_PARENTS[0],
}

const AuthContext = createContext(null)

const AUTH_KEY = 'amble_current_user'
const SESSION_KEY = 'amble_session_id'
const USER_KEY = 'amble_user_id'

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [registeredUsers, setRegisteredUsers] = useState({ parents: DEFAULT_PARENTS, family: DEFAULT_FAMILY })

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem(AUTH_KEY)
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser)
                setCurrentUser(parsed)
                localStorage.setItem(USER_KEY, parsed.id)
            } catch (e) {
                console.error('Failed to parse saved user:', e)
                localStorage.removeItem(AUTH_KEY)
                localStorage.removeItem(USER_KEY)
            }
        }
        setIsLoading(false)
    }, [])

    // Fetch registered users from DB
    const refreshUsers = useCallback(async () => {
        try {
            console.log('[AuthContext] Fetching users from API...')
            const allUsers = await listUsers()
            console.log('[AuthContext] API returned:', allUsers)
            if (allUsers && allUsers.length > 0) {
                const parents = allUsers.filter(u => u.role === 'parent')
                const family = allUsers.filter(u => u.role !== 'parent')
                console.log('[AuthContext] Parents:', parents, 'Family:', family)
                
                const result = {
                    parents: parents.length > 0 ? parents : DEFAULT_PARENTS,
                    family: family.length > 0 ? family : DEFAULT_FAMILY,
                }
                
                // Update the mutable export for backward compat
                FAMILY_MEMBERS.parents = result.parents
                FAMILY_MEMBERS.family = result.family
                FAMILY_MEMBERS.parent = result.parents[0]
                
                setRegisteredUsers(result)
            } else {
                console.log('[AuthContext] No users returned from API, using defaults')
            }
        } catch (e) {
            console.error('Failed to load users from DB:', e)
        }
    }, [])

    // Load users from DB on mount
    useEffect(() => {
        refreshUsers()
    }, [refreshUsers])

    // Sign in as a specific user
    const signIn = useCallback((user) => {
        setCurrentUser(user)
        localStorage.setItem(AUTH_KEY, JSON.stringify(user))
        localStorage.setItem(USER_KEY, user.id)
        // Clear old session so a fresh session is created for this user
        localStorage.removeItem(SESSION_KEY)
    }, [])

    // Sign out - clears all auth and session state
    const signOut = useCallback(() => {
        setCurrentUser(null)
        localStorage.removeItem(AUTH_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(SESSION_KEY)
    }, [])

    // Quick sign in as parent
    const signInAsParent = useCallback(() => {
        signIn(FAMILY_MEMBERS.parent)
    }, [signIn])

    // Get user ID for API calls
    const getUserId = useCallback(() => {
        return currentUser?.id || null
    }, [currentUser])

    const value = {
        currentUser,
        isLoading,
        signIn,
        signOut,
        signInAsParent,
        getUserId,
        refreshUsers,
        registeredUsers,
        isSignedIn: !!currentUser,
        isParent: currentUser?.role === 'parent',
        isFamily: currentUser?.role !== 'parent' && !!currentUser
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
