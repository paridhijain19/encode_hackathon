/**
 * Simple Authentication Context for Amble
 * 
 * Provides easy sign-in for parent and family members.
 * Uses localStorage to persist the current user.
 */

import { createContext, useContext, useState, useEffect } from 'react'

// Predefined family members (in real app, this would come from backend)
export const FAMILY_MEMBERS = {
    parent: {
        id: 'parent_user',
        name: 'Mom',
        role: 'parent',
        avatar: '👵'
    },
    family: [
        { id: 'family_sarah', name: 'Sarah', role: 'daughter', avatar: '👩' },
        { id: 'family_mike', name: 'Mike', role: 'son', avatar: '👨' },
        { id: 'family_emma', name: 'Emma', role: 'granddaughter', avatar: '👧' }
    ]
}

const AuthContext = createContext(null)

const AUTH_KEY = 'amble_current_user'

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Load user from localStorage on mount
    useEffect(() => {
        const savedUser = localStorage.getItem(AUTH_KEY)
        if (savedUser) {
            try {
                setCurrentUser(JSON.parse(savedUser))
            } catch (e) {
                console.error('Failed to parse saved user:', e)
                localStorage.removeItem(AUTH_KEY)
            }
        }
        setIsLoading(false)
    }, [])

    // Sign in as a specific user
    const signIn = (user) => {
        setCurrentUser(user)
        localStorage.setItem(AUTH_KEY, JSON.stringify(user))
        // Also set the user_id for the API
        localStorage.setItem('amble_user_id', user.id)
    }

    // Sign out
    const signOut = () => {
        setCurrentUser(null)
        localStorage.removeItem(AUTH_KEY)
        localStorage.removeItem('amble_user_id')
    }

    // Quick sign in as parent
    const signInAsParent = () => {
        signIn(FAMILY_MEMBERS.parent)
    }

    // Get user ID for API calls
    const getUserId = () => {
        return currentUser?.id || 'default_user'
    }

    const value = {
        currentUser,
        isLoading,
        signIn,
        signOut,
        signInAsParent,
        getUserId,
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
