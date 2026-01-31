/**
 * Toast Notification Component
 * 
 * Shows feedback messages to user.
 * Auto-dismisses after a few seconds.
 */

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'

// Context for global toast management
const ToastContext = createContext(null)

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now()
        setToasts(prev => [...prev, { id, message, type }])
        
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
        
        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const success = useCallback((message) => addToast(message, 'success'), [addToast])
    const error = useCallback((message) => addToast(message, 'error'), [addToast])
    const info = useCallback((message) => addToast(message, 'info'), [addToast])

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        // Fallback if not in provider
        return {
            success: (msg) => console.log('Toast:', msg),
            error: (msg) => console.error('Toast:', msg),
            info: (msg) => console.log('Toast:', msg),
        }
    }
    return context
}

function ToastContainer({ toasts, onRemove }) {
    if (toasts.length === 0) return null

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '90%',
            width: '360px'
        }}>
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
            ))}
        </div>
    )
}

function Toast({ message, type, onClose }) {
    const styles = {
        success: { bg: '#E8F5E9', border: '#4CAF50', icon: '✅' },
        error: { bg: '#FFEBEE', border: '#F44336', icon: '❌' },
        info: { bg: '#E3F2FD', border: '#2196F3', icon: 'ℹ️' },
    }
    
    const style = styles[type] || styles.info

    return (
        <div
            style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                animation: 'slideDown 0.3s ease'
            }}
            onClick={onClose}
        >
            <span style={{ fontSize: '20px' }}>{style.icon}</span>
            <p style={{ margin: 0, flex: 1, color: '#333', fontSize: '15px' }}>{message}</p>
            <style>{`
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

export default Toast
