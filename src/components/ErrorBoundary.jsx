/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child component tree.
 * Displays a fallback UI instead of crashing the whole app.
 */

import React from 'react'

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '20px',
                    background: '#FFF5F5',
                    borderRadius: '12px',
                    border: '1px solid #FED7D7',
                    margin: '16px',
                    textAlign: 'center'
                }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>😢</span>
                    <h3 style={{ color: '#C53030', margin: '0 0 8px 0' }}>Something went wrong</h3>
                    <p style={{ color: '#7A7267', margin: '0 0 16px 0', fontSize: '14px' }}>
                        {this.props.fallbackMessage || "We're having trouble loading this section."}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            background: '#5B7355',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Try Again
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

/**
 * ErrorMessage Component
 * 
 * Simple inline error display.
 */
export function ErrorMessage({ message, onRetry }) {
    return (
        <div style={{
            padding: '16px',
            background: '#FFF5F5',
            borderRadius: '12px',
            border: '1px solid #FED7D7',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
                <p style={{ color: '#C53030', margin: 0, fontSize: '14px' }}>
                    {message || 'Something went wrong'}
                </p>
            </div>
            {onRetry && (
                <button
                    onClick={onRetry}
                    style={{
                        background: 'transparent',
                        color: '#5B7355',
                        border: '1px solid #5B7355',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    Retry
                </button>
            )}
        </div>
    )
}

export default ErrorBoundary
