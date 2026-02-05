import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// New minimal pages
import Chat from './pages/Chat'
import QuickAdd from './pages/QuickAdd'
import Messages from './pages/Messages'

// Legacy pages (can be removed later if not needed)
import LandingPage from './pages/LandingPage'
import FamilyDashboard from './pages/FamilyDashboard'
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

function App() {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <AuthProvider>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/invite/accept" element={<InviteAccept />} />

        {/* New Minimal App Routes */}
        <Route path="/app" element={<Chat />} />
        <Route path="/app/quick-add" element={<QuickAdd />} />
        <Route path="/app/messages" element={<Messages />} />
        <Route path="/app/settings" element={<Settings />} />

        {/* Legacy Parent Portal - redirect to new /app */}
        <Route path="/parent/*" element={<Navigate to="/app" replace />} />

        {/* Family Dashboard (keeping for now) */}
        <Route path="/family/*" element={<FamilyDashboard />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
