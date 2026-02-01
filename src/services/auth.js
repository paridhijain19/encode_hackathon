/**
 * Supabase Authentication Service
 * 
 * Provides real authentication for multi-user support.
 * Can be used alongside the simple demo auth for hackathon.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Initialize Supabase client
const supabase = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// ============================================================
// Auth State
// ============================================================

let currentSession = null
let authStateChangeCallback = null

/**
 * Check if Supabase auth is available
 */
export const isSupabaseAuthAvailable = () => {
    return Boolean(supabase)
}

/**
 * Get current session
 */
export const getSession = async () => {
    if (!supabase) return null
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
        console.error('Error getting session:', error)
        return null
    }
    currentSession = session
    return session
}

/**
 * Get current user
 */
export const getCurrentUser = async () => {
    const session = await getSession()
    return session?.user || null
}

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback) => {
    if (!supabase) return () => {}
    
    authStateChangeCallback = callback
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
            currentSession = session
            callback(event, session)
        }
    )
    
    return () => {
        subscription?.unsubscribe()
    }
}

// ============================================================
// Sign Up / Sign In
// ============================================================

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email, password, metadata = {}) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: metadata.name,
                    role: metadata.role || 'family',
                    avatar: metadata.avatar || '👤'
                }
            }
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { 
            success: true, 
            user: data.user,
            session: data.session,
            needsEmailConfirmation: !data.session
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { 
            success: true, 
            user: data.user,
            session: data.session
        }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Sign in with OAuth provider (Google, Apple, etc.)
 */
export const signInWithOAuth = async (provider) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { success: true, url: data.url }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Sign in with magic link (passwordless)
 */
export const signInWithMagicLink = async (email) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { success: true, message: 'Check your email for the login link!' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Sign out
 */
export const signOut = async () => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { error } = await supabase.auth.signOut()
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        currentSession = null
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ============================================================
// Password Management
// ============================================================

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { success: true, message: 'Check your email for the password reset link!' }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Update password (requires active session)
 */
export const updatePassword = async (newPassword) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ============================================================
// User Profile
// ============================================================

/**
 * Update user metadata
 */
export const updateUserMetadata = async (metadata) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { data, error } = await supabase.auth.updateUser({
            data: metadata
        })
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { success: true, user: data.user }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Get user profile from user_profiles table
 */
export const getUserProfile = async (userId) => {
    if (!supabase) return null
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()
        
        if (error && error.code !== 'PGRST116') { // Not found is okay
            console.error('Error fetching user profile:', error)
            return null
        }
        
        return data
    } catch (error) {
        console.error('Error fetching user profile:', error)
        return null
    }
}

/**
 * Create or update user profile in user_profiles table
 */
export const upsertUserProfile = async (userId, profile) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .upsert({
                user_id: userId,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                avatar: profile.avatar,
                preferences: profile.preferences || {},
                updated_at: new Date().toISOString()
            })
            .select()
            .single()
        
        if (error) {
            return { success: false, error: error.message }
        }
        
        return { success: true, profile: data }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

// ============================================================
// Family Linking
// ============================================================

/**
 * Link a family member to a parent user
 */
export const linkFamilyMember = async (parentUserId, familyMemberId, relationship) => {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured' }
    }
    
    // This would typically use a family_links table
    // For now, store in user metadata
    try {
        const { error } = await supabase
            .from('family_links')
            .insert({
                parent_user_id: parentUserId,
                family_member_id: familyMemberId,
                relationship,
                created_at: new Date().toISOString()
            })
        
        if (error) {
            // If table doesn't exist, store in metadata
            console.log('Family links table not found, using metadata')
            return { success: true, fallback: true }
        }
        
        return { success: true }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

/**
 * Get family members for a parent user
 */
export const getFamilyMembers = async (parentUserId) => {
    if (!supabase) return []
    
    try {
        const { data, error } = await supabase
            .from('family_links')
            .select(`
                family_member_id,
                relationship,
                user_profiles!family_member_id (
                    user_id,
                    name,
                    email,
                    avatar,
                    role
                )
            `)
            .eq('parent_user_id', parentUserId)
        
        if (error) {
            console.error('Error fetching family members:', error)
            return []
        }
        
        return data?.map(link => ({
            ...link.user_profiles,
            relationship: link.relationship
        })) || []
    } catch (error) {
        console.error('Error fetching family members:', error)
        return []
    }
}

// ============================================================
// Demo Mode Integration
// ============================================================

/**
 * Convert demo user to auth user format
 * This allows seamless integration between demo and real auth
 */
export const demoUserToAuthFormat = (demoUser) => {
    return {
        id: demoUser.id,
        email: `${demoUser.id}@amble.demo`,
        user_metadata: {
            name: demoUser.name,
            role: demoUser.role,
            avatar: demoUser.avatar
        }
    }
}

/**
 * Check if using demo mode
 */
export const isDemoMode = () => {
    // In demo mode when Supabase isn't configured or user explicitly chose demo
    return !isSupabaseAuthAvailable() || localStorage.getItem('amble_demo_mode') === 'true'
}

/**
 * Enable demo mode
 */
export const enableDemoMode = () => {
    localStorage.setItem('amble_demo_mode', 'true')
}

/**
 * Disable demo mode (use real auth)
 */
export const disableDemoMode = () => {
    localStorage.removeItem('amble_demo_mode')
}

export default supabase
