import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import ParentPortal from './pages/ParentPortal'
import FamilyDashboard from './pages/FamilyDashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/parent/*" element={<ParentPortal />} />
      <Route path="/family/*" element={<FamilyDashboard />} />
    </Routes>
  )
}

export default App
