/**
 * Modal Component
 * 
 * Reusable modal/dialog for forms and confirmations.
 * Large touch targets for elderly users.
 */

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

export function Modal({ isOpen, onClose, title, children, size = 'medium' }) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const widths = {
        small: '320px',
        medium: '400px',
        large: '500px',
        full: '95%'
    }

    return (
        <div 
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3000,
                padding: '20px',
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div 
                className="modal-content"
                style={{
                    background: 'white',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: widths[size],
                    maxHeight: '90vh',
                    overflow: 'auto',
                    animation: 'slideUp 0.3s ease'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px',
                    borderBottom: '1px solid #E8E4DD'
                }}>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#524C44' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            border: 'none',
                            background: '#F5F3EF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} color="#7A7267" />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px' }}>
                    {children}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

/**
 * ConfirmModal Component
 * 
 * Simple yes/no confirmation dialog.
 */
export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Yes', cancelText = 'No' }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="small">
            <p style={{ margin: '0 0 24px', color: '#7A7267', fontSize: '16px' }}>{message}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={onClose}
                    style={{
                        flex: 1,
                        padding: '14px',
                        border: '2px solid #E8E4DD',
                        borderRadius: '12px',
                        background: 'white',
                        color: '#524C44',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm()
                        onClose()
                    }}
                    style={{
                        flex: 1,
                        padding: '14px',
                        border: 'none',
                        borderRadius: '12px',
                        background: '#5B7355',
                        color: 'white',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    )
}

/**
 * InputModal Component
 * 
 * Modal with a simple input field.
 */
export function InputModal({ isOpen, onClose, onSubmit, title, placeholder, submitText = 'Submit' }) {
    const [value, setValue] = React.useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        if (value.trim()) {
            onSubmit(value.trim())
            setValue('')
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="medium">
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={placeholder}
                    autoFocus
                    style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '18px',
                        border: '2px solid #E8E4DD',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }}
                />
                <button
                    type="submit"
                    disabled={!value.trim()}
                    style={{
                        width: '100%',
                        padding: '16px',
                        border: 'none',
                        borderRadius: '12px',
                        background: value.trim() ? '#5B7355' : '#ccc',
                        color: 'white',
                        fontSize: '18px',
                        cursor: value.trim() ? 'pointer' : 'not-allowed'
                    }}
                >
                    {submitText}
                </button>
            </form>
        </Modal>
    )
}

export default Modal
