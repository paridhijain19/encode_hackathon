/**
 * LoadingSpinner Component
 * 
 * Simple loading indicator for async operations.
 */

import React from 'react'

export function LoadingSpinner({ size = 24, color = '#5B7355' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: 'spin 1s linear infinite' }}
        >
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="31.4 31.4"
                strokeDashoffset="0"
            />
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </svg>
    )
}

/**
 * LoadingCard Component
 * 
 * Skeleton loading state for section cards.
 */
export function LoadingCard({ lines = 3 }) {
    return (
        <div className="loading-card" style={{
            background: '#FAF9F7',
            borderRadius: '16px',
            padding: '20px',
            animation: 'pulse 1.5s ease-in-out infinite'
        }}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        height: i === 0 ? '20px' : '16px',
                        width: i === 0 ? '60%' : `${80 - i * 10}%`,
                        background: '#E8E4DD',
                        borderRadius: '4px',
                        marginBottom: i < lines - 1 ? '12px' : 0
                    }}
                />
            ))}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    )
}

/**
 * LoadingOverlay Component
 * 
 * Full-screen loading overlay.
 */
export function LoadingOverlay({ message = 'Loading...' }) {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(250, 249, 247, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <LoadingSpinner size={48} />
            <p style={{ marginTop: '16px', color: '#524C44', fontSize: '18px' }}>
                {message}
            </p>
        </div>
    )
}

export default LoadingSpinner
