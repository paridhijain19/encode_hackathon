import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import ParentPortal from './pages/ParentPortal'
import FamilyDashboard from './pages/FamilyDashboard'
import Onboarding, { InviteAccept } from './pages/Onboarding'
import Settings from './pages/Settings'
import SmartHome from './components/SmartHome'

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
        <Route path="/" element={<LandingPage />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/invite/accept" element={<InviteAccept />} />
        <Route path="/parent/*" element={<ParentPortal />} />
        <Route path="/family/*" element={<FamilyDashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/smart-home" element={<SmartHome />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
