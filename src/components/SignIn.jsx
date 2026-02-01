/**
 * Sign-In Component for Amble
 * 
 * Simple, easy-to-use sign-in for parent and family members.
 */

import { useState } from 'react'
import { useAuth, FAMILY_MEMBERS } from '../context/AuthContext'
import './SignIn.css'

export function SignInModal({ onClose, mode = 'parent' }) {
    const { signIn } = useAuth()

    const handleSignIn = (user) => {
        signIn(user)
        onClose()
    }

    return (
        <div className="signin-overlay" onClick={onClose}>
            <div className="signin-modal" onClick={e => e.stopPropagation()}>
                <button className="signin-close" onClick={onClose}>×</button>
                
                <div className="signin-header">
                    <span className="signin-icon">🌿</span>
                    <h2>Welcome to Amble</h2>
                    <p>{mode === 'parent' ? 'Sign in to start chatting' : 'Select your name to continue'}</p>
                </div>

                <div className="signin-options">
                    {mode === 'parent' ? (
                        // Parent sign-in (single option, easy)
                        <button 
                            className="signin-option signin-parent"
                            onClick={() => handleSignIn(FAMILY_MEMBERS.parent)}
                        >
                            <span className="signin-avatar">{FAMILY_MEMBERS.parent.avatar}</span>
                            <span className="signin-name">{FAMILY_MEMBERS.parent.name}</span>
                            <span className="signin-role">Continue as yourself</span>
                        </button>
                    ) : (
                        // Family sign-in (multiple family members)
                        <>
                            <p className="signin-label">Who are you?</p>
                            {FAMILY_MEMBERS.family.map(member => (
                                <button 
                                    key={member.id}
                                    className="signin-option signin-family"
                                    onClick={() => handleSignIn(member)}
                                >
                                    <span className="signin-avatar">{member.avatar}</span>
                                    <span className="signin-name">{member.name}</span>
                                    <span className="signin-role">{member.role}</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export function UserBadge() {
    const { currentUser, signOut } = useAuth()
    const [showMenu, setShowMenu] = useState(false)

    if (!currentUser) return null

    return (
        <div className="user-badge">
            <button 
                className="user-badge-button"
                onClick={() => setShowMenu(!showMenu)}
            >
                <span className="user-avatar">{currentUser.avatar}</span>
                <span className="user-name">{currentUser.name}</span>
            </button>
            {showMenu && (
                <div className="user-menu">
                    <div className="user-menu-header">
                        <span>{currentUser.avatar}</span>
                        <div>
                            <strong>{currentUser.name}</strong>
                            <small>{currentUser.role}</small>
                        </div>
                    </div>
                    <button className="user-menu-signout" onClick={signOut}>
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}
