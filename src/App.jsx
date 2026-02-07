import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Main pages
import Chat from './pages/Chat'
import QuickAdd from './pages/QuickAdd'
import Messages from './pages/Messages'
import LandingPage from './pages/LandingPage'
import FamilyDashboard from './pages/FamilyDashboard'
import UserDashboard from './pages/UserDashboard'
import Onboarding, { InviteAccept } from './pages/Onboarding'
import Settings from './pages/Settings'

// Register service worker for PWA
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('Service Worker registered:', registration.scope)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
}

/**
 * Auth guard - redirects to landing page if not signed in.
 * Shows nothing while auth is loading to prevent flash.
 */
function RequireAuth({ children, requiredRole }) {
  const { currentUser, isLoading, isSignedIn } = useAuth()
  
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#FAF9F7', fontFamily: 'Outfit, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '2rem' }}>🌿</span>
          <p style={{ color: '#7A7267', marginTop: '12px' }}>Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!isSignedIn) {
    return <Navigate to="/" replace />
  }
  
  // If a specific role is required, check it
  if (requiredRole && currentUser?.role !== requiredRole) {
    // Redirect to the correct portal based on role
    if (currentUser?.role === 'parent') {
      return <Navigate to="/app" replace />
    }
    return <Navigate to="/family" replace />
  }
  
  return children
}

function App() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/invite/accept" element={<InviteAccept />} />

        {/* Elder/Parent routes */}
        <Route path="/app" element={<Chat />} />
        <Route path="/app/quick-add" element={<QuickAdd />} />
        <Route path="/app/messages" element={<Messages />} />
        <Route path="/app/settings" element={<Settings />} />
        <Route path="/dashboard/*" element={<UserDashboard />} />

        {/* Family routes */}
        <Route path="/family/*" element={<FamilyDashboard />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
