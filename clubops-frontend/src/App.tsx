import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'

// Layout Components
import Sidebar from '@components/layout/Sidebar'
import Header from '@components/layout/Header'

// Pages
import Dashboard from '@pages/Dashboard'
import DancerManagement from '@pages/DancerManagement'
import DJInterface from '@pages/DJInterface'
import VIPRooms from '@pages/VIPRooms'
import Financial from '@pages/Financial'
import Settings from '@pages/Settings'
import Login from '@pages/auth/Login'

// Hooks
import { useAuth } from '@hooks/useAuth'

// Store
import { useStore } from '@utils/store'

function App() {
  const { user, isLoading } = useAuth()
  const { theme } = useStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return (
    <div className={`min-h-screen bg-dark-50 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex">
        {/* Sidebar Navigation */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <Header />
          
          <main className="flex-1 p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dancers" element={<DancerManagement />} />
                <Route path="/dj" element={<DJInterface />} />
                <Route path="/vip" element={<VIPRooms />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default App