/**
 * Sign-In Component for Amble
 * 
 * Loads registered users from the database via AuthContext.
 * Supports creating new user accounts.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, FAMILY_MEMBERS } from '../context/AuthContext'
import { registerUser } from '../services/api'
import './SignIn.css'

const AVATAR_OPTIONS = ['👵', '👴', '👵🏽', '👴🏽', '👩', '👨', '👧', '👦', '👩🏽', '👨🏽', '🧑', '🧓']

export function SignInModal({ onClose, mode = 'all' }) {
    const { signIn, registeredUsers, refreshUsers } = useAuth()
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState(mode === 'family' ? 'family' : 'parent')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newUser, setNewUser] = useState({ name: '', role: 'parent', avatar: '👵', relation: '' })
    const [isCreating, setIsCreating] = useState(false)

    const handleSignIn = (user) => {
        signIn(user)
        if (onClose) onClose()
        if (user.role === 'parent') {
            navigate('/app')
        } else {
            navigate('/family')
        }
    }

    const handleCreateUser = async () => {
        if (!newUser.name.trim()) return
        
        setIsCreating(true)
        const role = activeTab === 'parent' ? 'parent' : (newUser.relation || 'family')
        const userId = `${role}_${newUser.name.trim().toLowerCase().replace(/\s+/g, '_')}`
        
        const result = await registerUser({
            user_id: userId,
            name: newUser.name.trim(),
            role: role,
            avatar: newUser.avatar,
            relation: activeTab === 'family' ? newUser.relation : undefined,
        })
        
        setIsCreating(false)
        
        if (result?.user) {
            await refreshUsers()
            handleSignIn(result.user)
        }
        setShowCreateForm(false)
    }

    const showTabs = mode === 'all'
    const parents = registeredUsers.parents
    const family = registeredUsers.family

    return (
        <div className="signin-overlay" onClick={onClose}>
            <div className="signin-modal" onClick={e => e.stopPropagation()}>
                {onClose && <button className="signin-close" onClick={onClose}>×</button>}
                
                <div className="signin-header">
                    <span className="signin-icon">🌿</span>
                    <h2>Welcome to Amble</h2>
                    <p>Choose your account to continue</p>
                </div>

                {/* Tabs for switching between parent/family when mode='all' */}
                {showTabs && (
                    <div className="signin-tabs">
                        <button 
                            className={`signin-tab ${activeTab === 'parent' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('parent'); setShowCreateForm(false) }}
                        >
                            🏠 I'm an Elder
                        </button>
                        <button 
                            className={`signin-tab ${activeTab === 'family' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('family'); setShowCreateForm(false) }}
                        >
                            👨‍👩‍👧 Family Member
                        </button>
                    </div>
                )}

                <div className="signin-options">
                    {!showCreateForm ? (
                        <>
                            {(activeTab === 'parent' || mode === 'parent') && (
                                <>
                                    <p className="signin-label">Select your account</p>
                                    {parents.map(parent => (
                                        <button 
                                            key={parent.id}
                                            className="signin-option signin-parent"
                                            onClick={() => handleSignIn(parent)}
                                        >
                                            <span className="signin-avatar">{parent.avatar}</span>
                                            <span className="signin-name">{parent.name}</span>
                                            <span className="signin-role">Elder</span>
                                        </button>
                                    ))}
                                </>
                            )}
                            {(activeTab === 'family' || mode === 'family') && (
                                <>
                                    <p className="signin-label">Select your account</p>
                                    {family.map(member => (
                                        <button 
                                            key={member.id}
                                            className="signin-option signin-family"
                                            onClick={() => handleSignIn(member)}
                                        >
                                            <span className="signin-avatar">{member.avatar}</span>
                                            <span className="signin-name">{member.name}</span>
                                            <span className="signin-role">{member.relation || member.role}</span>
                                        </button>
                                    ))}
                                </>
                            )}
                            
                            {/* Create new account button */}
                            <button 
                                className="signin-option signin-create"
                                onClick={() => setShowCreateForm(true)}
                            >
                                <span className="signin-avatar">➕</span>
                                <span className="signin-name">Create New Account</span>
                                <span className="signin-role">
                                    {activeTab === 'parent' ? 'New elder' : 'New family member'}
                                </span>
                            </button>
                        </>
                    ) : (
                        /* Create account form */
                        <div className="signin-create-form">
                            <p className="signin-label">
                                {activeTab === 'parent' ? 'Create Elder Account' : 'Create Family Account'}
                            </p>
                            
                            <div className="form-field">
                                <label>Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter your name"
                                    value={newUser.name}
                                    onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                                    autoFocus
                                />
                            </div>
                            
                            {activeTab === 'family' && (
                                <div className="form-field">
                                    <label>Relation</label>
                                    <select 
                                        value={newUser.relation}
                                        onChange={e => setNewUser(prev => ({ ...prev, relation: e.target.value }))}
                                    >
                                        <option value="">Select relation</option>
                                        <option value="daughter">Daughter</option>
                                        <option value="son">Son</option>
                                        <option value="granddaughter">Granddaughter</option>
                                        <option value="grandson">Grandson</option>
                                        <option value="spouse">Spouse</option>
                                        <option value="caregiver">Caregiver</option>
                                    </select>
                                </div>
                            )}
                            
                            <div className="form-field">
                                <label>Choose Avatar</label>
                                <div className="avatar-picker">
                                    {AVATAR_OPTIONS.map(av => (
                                        <button
                                            key={av}
                                            className={`avatar-choice ${newUser.avatar === av ? 'selected' : ''}`}
                                            onClick={() => setNewUser(prev => ({ ...prev, avatar: av }))}
                                        >
                                            {av}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="form-actions">
                                <button 
                                    className="btn-cancel" 
                                    onClick={() => setShowCreateForm(false)}
                                >
                                    Back
                                </button>
                                <button 
                                    className="btn-create" 
                                    onClick={handleCreateUser}
                                    disabled={!newUser.name.trim() || isCreating}
                                >
                                    {isCreating ? 'Creating...' : 'Create & Sign In'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export function UserBadge({ showName = true }) {
    const { currentUser, signOut } = useAuth()
    const [showMenu, setShowMenu] = useState(false)
    const menuRef = useRef(null)
    const navigate = useNavigate()

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false)
            }
        }
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showMenu])

    if (!currentUser) return null

    const [showSwitchModal, setShowSwitchModal] = useState(false)

    const handleSignOut = () => {
        setShowMenu(false)
        signOut()
        navigate('/')
    }

    const handleSwitchAccount = () => {
        setShowMenu(false)
        setShowSwitchModal(true)
    }

    return (
        <>
            <div className="user-badge" ref={menuRef}>
                <button 
                    className="user-badge-button"
                    onClick={() => setShowMenu(!showMenu)}
                    title={`Signed in as ${currentUser.name} (${currentUser.role})`}
                >
                    <span className="user-avatar">{currentUser.avatar}</span>
                    {showName && <span className="user-name">{currentUser.name}</span>}
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
                        <div className="user-menu-info">
                            <small>ID: {currentUser.id}</small>
                        </div>
                        <button className="user-menu-switch" onClick={handleSwitchAccount}>
                            🔄 Switch Account
                        </button>
                        <button className="user-menu-signout" onClick={handleSignOut}>
                            Sign Out
                        </button>
                    </div>
                )}
            </div>

            {/* Switch Account Modal */}
            {showSwitchModal && (
                <SignInModal 
                    mode="all" 
                    onClose={() => setShowSwitchModal(false)} 
                />
            )}
        </>
    )
}
