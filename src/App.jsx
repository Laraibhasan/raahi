import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from '@clerk/clerk-react'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Plan from './pages/Plan'
import Itinerary from './pages/Itinerary'
import MyTrips from './pages/MyTrips'
import Login from './pages/Login'
import Signup from './pages/Signup'
import InstallPrompt from './components/InstallPrompt'

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth()
  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
      <div className="w-10 h-10 border-4 border-[#F0E6DC] border-t-[#C4663A] rounded-full animate-spin" />
    </div>
  )
  return isSignedIn ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Navbar />
      <Routes>
        <Route path="/"          element={<Home />}    />
        <Route path="/plan"      element={<Plan />}    />
        <Route path="/login"     element={<Login />}   />
        <Route path="/signup"    element={<Signup />}  />
        <Route path="/itinerary" element={
          <ProtectedRoute><Itinerary /></ProtectedRoute>
        } />
        <Route path="/trips"     element={
          <ProtectedRoute><MyTrips /></ProtectedRoute>
        } />
      </Routes>
      <InstallPrompt />
    </Router>
  )
}

export default App